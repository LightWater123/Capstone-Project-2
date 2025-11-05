<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use App\Models\Equipment;
use Illuminate\Support\Facades\Auth;

class PdfParserController extends Controller
{
    public function parse(Request $request)
    {
        $path = null;

        try {
            // Validate
            $request->validate([
                'pdf'  => 'required|file|mimes:pdf|max:10240', // 10MB
                'mode' => 'required|string|in:PPE,RPCSP',
            ]);

            // Ensure temp dir and store file
            if (!Storage::exists('temp')) {
                Storage::makeDirectory('temp');
                Log::info('Created missing temp directory.');
            }

            $uploaded = $request->file('pdf');
            $originalName = $uploaded->getClientOriginalName();
            $path = $uploaded->store('temp');
            $fullPath = Storage::path($path);
            $mode = strtoupper($request->input('mode'));

            // Windows slash normalization
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                $fullPath = str_replace('/', DIRECTORY_SEPARATOR, $fullPath);
            }

            Log::info('Resolved full path', ['fullPath' => $fullPath]);
            Log::info('PDF file uploaded', [
                'path'      => $path,
                'full_path' => $fullPath,
                'exists'    => file_exists($fullPath) ? 'yes' : 'no',
            ]);

            if (!$fullPath || !file_exists($fullPath)) {
                Log::error('PDF file storage failed', ['path' => $path, 'resolved_path' => $fullPath]);
                throw new \Exception('Failed to store the PDF file.');
            }

            // Python script
            $scriptPath = base_path('python/parse_pdf.py');
            if (!file_exists($scriptPath)) {
                throw new \Exception("Python script not found at: {$scriptPath}");
            }

            $python = $this->getPythonExecutable();
            $process = new Process([$python, $scriptPath, $fullPath, $mode]);
            $process->setTimeout(300);
            $process->setEnv(array_merge($process->getEnv(), ['PYTHONIOENCODING' => 'utf-8']));

            Log::info('Starting PDF parsing process', [
                'file'    => $fullPath,
                'mode'    => $mode,
                'command' => $process->getCommandLine()
            ]);

            // Run parser
            $process->mustRun();
            $output = $process->getOutput();
            $stderr = $process->getErrorOutput();
            if (!empty($stderr)) {
                Log::warning('Python script error/warning', ['stderr' => $stderr]);
            }

            Log::info('Python script completed', [
                'output_length' => strlen($output),
                'exit_code'     => $process->getExitCode()
            ]);

            // Remove temp file
            Storage::delete($path);

            if (empty($output)) {
                throw new \Exception('Python script returned empty output.');
            }

            // Decode JSON
            $parsed = json_decode($output, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Invalid JSON output from Python script: ' . json_last_error_msg());
            }
            if (!is_array($parsed) || empty($parsed)) {
                throw new \Exception('Python script returned no rows.');
            }

            // Helpers
            $normalizeNumber = function ($val, $asInt = false) {
                if ($val === null || $val === '') return $asInt ? 0 : 0.0;
                if (is_string($val)) $val = str_replace([',', ' '], '', $val);
                if (!is_numeric($val)) return $asInt ? 0 : 0.0;
                return $asInt ? (int)$val : (float)$val;
            };

            // Optional: filter header/blank rows
            Log::info("Type" . $parsed[0]['type']);
            $type = strtoupper($parsed[0]['type']);
            if($type != $mode) {
                return response()->json([
                'success'        => false,
                'inserted_count' => 0,
                'data'           => [],
                'message'        => 'Invalid pdf expected: '. $mode . ' received: '. $type,
                'filename'       => $originalName,
                'mode'           => $mode,
            ], 400);
            }


            $parsed = array_slice($parsed,  1);
            $rows = array_values(array_filter($parsed, function ($r) use ($normalizeNumber) {
                $article = trim((string)($r['article'] ?? ''));
                $hasNumeric =
                    $normalizeNumber($r['unit_value'] ?? null) > 0 ||
                    $normalizeNumber($r['quantity_per_property_card'] ?? null, true) > 0 ||
                    $normalizeNumber($r['quantity_per_physical_count'] ?? null, true) > 0;
                return $article !== '' || $hasNumeric;
            }));

            // Map to model fillable

            $now = now();
            $docs = array_map(function ($row) use ($mode, $normalizeNumber, $now) {

                // --- start RPCSP/PPE handling ---
                $unit         = $row['unit_of_measure'] ?? $row['unit'] ?? '';
                $unitValue    = $row['unit_value'] ?? null;
                $recordedCount= $row['quantity_per_property_card'] ?? null;

                if ($mode === 'RPCSP') {
                    // If "unit_of_measure" is actually numeric, it’s the unit_value
                    if (is_numeric(str_replace([',',' '], '', $unit))) {
                        $unitValue = $unit;
                        $unit = $row['unit'] ?? ''; // fallback if parser captured separately
                    }
                    // If "unit_value" is really an integer quantity, treat it as recorded_count
                    if (is_numeric(str_replace([',',' '], '', $unitValue))
                        && (int)str_replace([',',' '], '', $unitValue) == $unitValue) {
                        $recordedCount = $unitValue;
                    }
                }
                // --- end RPCSP/PPE handling ---

                return [
                    'category'       => $mode,
                    'article'        => (string)($row['article'] ?? ''),
                    'description'    => (string)($row['description'] ?? ''),
                    'property_ro'    => (string)($row['property_number_RO'] ?? $row['property_RO'] ?? ''),
                    'property_co'    => (string)($row['property_number_CO'] ?? $row['property_CO'] ?? ''),
                    'semi_expendable_property_no' => (string)($row['semi_expendable_property_no'] ?? ''),
                    'unit'           => (string)$unit,
                    'unit_value'     => $normalizeNumber($unitValue, false),
                    'recorded_count' => $normalizeNumber($recordedCount, true),
                    'actual_count'   => $normalizeNumber($row['quantity_per_physical_count'] ?? null, true),
                    'remarks'        => (string)($row['remarks'] ?? $row['remarks_whereabouts'] ?? ''),
                    'location'       => (string)($row['whereabouts'] ?? $row['remarks_whereabouts'] ?? ''),
                    'created_by'     => Auth::user()->email,
                    'is_active'      => true,
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ];
            }, $rows);


            // Bulk insert
            $insertedCount = 0;
            if (!empty($docs)) {
                Equipment::insert($docs);
                $insertedCount = count($docs);
                Log::info('Inserted parsed PDF rows into MongoDB', ['count' => $insertedCount]);
            } else {
                Log::warning('No valid rows to insert after filtering.');
            }

            // Success response
            return response()->json([
                'success'        => true,
                'inserted_count' => $insertedCount,
                'data'           => $rows, // optional for UI display
                'filename'       => $originalName,
                'mode'           => $mode,
            ], 200);

        } catch (ProcessFailedException $e) {
            $p = $e->getProcess();
            Log::error('Python process failed', [
                'command'   => $p->getCommandLine(),
                'stderr'    => $p->getErrorOutput(),
                'stdout'    => $p->getOutput(),
                'exit_code' => $p->getExitCode(),
            ]);
            if ($path) Storage::delete($path);

            return response()->json([
                'success' => false,
                'error'   => 'PDF parsing failed',
                'message' => 'Python process failed. Check server logs.',
            ], 500);

        } catch (\Exception $e) {
            Log::error('PDF parsing error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            if ($path) Storage::delete($path);

            return response()->json([
                'success' => false,
                'error'   => 'PDF parsing failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function getPythonExecutable(): string
    {
        return strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' ? 'python' : 'python3';
    }
}
