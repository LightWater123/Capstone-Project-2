<?php

namespace App\Http\Controllers;

use App\Models\Equipment;
use App\Models\MaintenanceJob;
use App\Models\EquipmentType;
use App\Models\Message;
use App\Jobs\SendMaintenanceEmail;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use MongoDB\BSON\UTCDateTime;
use MongoDB\BSON\ObjectId;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class MaintenanceController extends Controller
{
    /**
     * Schedule maintenance:
     * 1. create job
     * 2. queue e-mail job
     * 3. store in-app message
     */
    public function store(Request $req)
    {
        // validate incoming request
        $req->validate([
            'assetId'        => 'required|string',
            'assetName'      => 'required|string',
            'recipientEmail' => 'required|email',
            'recipientName'  => 'nullable|string',
            'scheduledAt'    => 'required|date',
            'message'        => 'required|string',
        ]);

        /* ---------- 1.  create job ---------- */
        $job = MaintenanceJob::create([
            'asset_id'    => $req->assetId,
            'asset_name'  => $req->assetName,
            'user_email'  => $req->recipientEmail,
            'scheduled_at'=> Carbon::parse($req->scheduledAt),
            'status'      => 'null',
            'admin_email'     => Auth::user()->email,
        ]);

        /* ---------- 2.  queue e-mail ---------- */
        SendMaintenanceEmail::dispatch($job, $req->message);

        /* ---------- 3.  inbox message ---------- */
        Message::create([
            'sender_id'       => Auth::id(),
            'recipient_email' => $req->recipientEmail,
            'subject'         => "[Maint Due] {$req->assetName} – ".$job->scheduled_at->format('d M Y'),
            'body_html'       => nl2br(e($req->message)),
            'maint_job_id'    => $job->_id,
            'read_at'         => null,
        ]);

        return response()->json(['job' => $job], 201);
    }

    /* service-user inbox
        returns sent messages to service user inbox
        filters by status if provided
    */
    public function messages(Request $req)
    {
        \Log::info('messages() called – raw query result');

        // Explicitly use the service guard to get the authenticated user
        $user = auth('service')->user();
        
        if (!$user) {
            \Log::warning('No authenticated service user found');
            return response()->json(['error' => 'Authentication required'], 401);
        }

        \Log::info('Service user authenticated', ['email' => $user->email]);
        
        // filter through Message and gets the items with the same email as the currently logged in service user
        $message = Message::where('recipient_email', $user->email)
                    ->orderBy('created_at', 'desc')->get();

        \Log::info($message);
        
        $maint_item = [
            
        ];

        for($i = 0, $n = count($message); $i < $n; $i++)
        {
            $item = (object) [
                'sender_id' => $message[$i]->sender_id,
                'recipient_email' => $message[$i]->recipient_email,
                'subject' => $message[$i]->subject,
                'body_html' => $message[$i]->body_html,
                'read_at' => $message[$i]->read_at,
                'job' => null
            ];

            $query = MaintenanceJob::where('id', $message[$i]->maint_job_id)
                    ->orderBy('created_at', 'desc');

            // Filter by status if provided
            if ($req->has('status')) {
                $status = $req->status;
                
                // Handle special status values
                if ($status === 'null') {
                    $query->whereNull('status');
                }
                // Handle standard status values
                elseif (in_array($status, ['pending', 'in-progress', 'done', 'overdue', 'picked-up'])) {
                    $query->where('status', $status);
                }
            }

            $data = $query->first();

            if($data === null)
            {
                continue;
            }

            $item->job = $data;
            $maint_item[] = $item;
        }

        return $maint_item;

    }

    /* admin: messages he sent */
    public function sent(Request $req)
    {
        return Message::where('sender_id', Auth::id())
                      ->orderBy('created_at', 'desc')
                      ->get();
    }

    /* admin: maintenance monitor list 
        returns the messages sent by the admin to admin monitor list
    */
    public function index(Request $req)
    {
        return MaintenanceJob::query()
                    //   ->where("admin_email", Auth::user()->email)
                      ->orderBy('created_at', 'desc')
                      ->get();
    }

    public function notDone(Request $req)
    {
        return MaintenanceJob::query()
                    //   ->where("admin_email", Auth::user()->email)
                      ->where('status', '<>', 'done')
                      ->orderBy('created_at', 'desc')
                      ->get();
    }

    // service user maintenance list
    public function serviceIndex(Request $request)
    {
        // Start with base query for service user's jobs
        $query = MaintenanceJob::where('user_email', Auth::user()->email)
                          ->orderBy('created_at', 'desc');
        
        // Filter by status if provided
        if ($request->has('status')) {
            $status = $request->status;
            
            // Handle special status values
            if ($status === 'null') {
                $query->whereNull('status');
            }
            // Handle standard status values
            elseif (in_array($status, ['pending', 'in-progress', 'done', 'overdue', 'picked-up'])) {
                $query->where('status', $status);
            }
        }
        
        $jobs = $query->get();
        
        return response()->json($jobs);
    }

    // update status of equipment maintenance
    public function updateStatus(Request $request, MaintenanceJob $job)
    {
        $request->validate(['status' => 'required|in:pending,in-progress,done,null,picked-up,overdue']);

        $user = auth('admin')->user() ?? auth('service')->user();

        if (! $user) {                       // should never happen with the cookie
            abort(401, 'Session required');
        }

        $isAdmin    = $user->role === 'admin';   // or tokenCan('admin') if you issue tokens
        $isAssigned = $job->user_email === $user->email;

        if (! $isAdmin && ! $isAssigned) {
            abort(403, 'Unauthorized to update this maintenance job');
        }

        $job->status = $request->status;
        $job->save();

        return response()->json(['message' => 'Status updated', 'data' => $job]);
    }

    // update condition of equipment maintenance
    public function updateCondition(Request $request, MaintenanceJob $job)
    {
        $request->validate(['condition' => 'required|in:null,picked-up,overdue']);

        $user = auth('admin')->user() ?? auth('service')->user();

        if (! $user) {                       // should never happen with the cookie
            abort(401, 'Session required');
        }

        $isAdmin    = $user->role === 'admin';   // or tokenCan('admin') if you issue tokens
        $isAssigned = $job->user_email === $user->email;

        if (! $isAdmin && ! $isAssigned) {
            abort(403, 'Unauthorized to update this maintenance job');
        }

        $job->condition = $request->condition;
        $job->save();

        return response()->json(['message' => 'Condition updated', 'data' => $job]);
    }

    // get items due for maintenance
    public function getDueForMaintenance(Request $request)
    {
        // Get the number of days from the request, defaulting to 365.
        $days = $request->get('days', 365);

        // Validate the 'days' parameter
        if (!is_numeric($days) || (int)$days < 0) {
            return response()->json(['error' => 'The "days" parameter must be a non-negative integer.'], 400);
        }
        $days = (int)$days;

        // Use UTC to match MongoDB's date storage
        $now = Carbon::now('UTC')->startOfDay(); // Set to 00:00:00
        $futureDate = $now->copy()->addDays($days)->endOfDay(); // Set to 23:59:59
        
        // Log for debugging
        Log::info("Checking maintenance from {$now} to {$futureDate}");

        // MongoDB-specific query with proper date handling
        // Convert Carbon instances to UTCDateTime with correct milliseconds
        $startDateTime = new UTCDateTime($now->getTimestampMs());
        $endDateTime = new UTCDateTime($futureDate->getTimestampMs());
        
        $dueItems = MaintenanceJob::whereNotNull('scheduled_at')
                            // ->where('admin_email', Auth::user()->email)
                            ->where('scheduled_at', '>=', $startDateTime)
                            ->where('scheduled_at', '<=', $endDateTime)
                            ->orderBy('scheduled_at', 'asc')
                            ->get();
        
        // Log results for debugging
        Log::info("Found {$dueItems->count()} items due for maintenance");
        
        // The Laravel MongoDB driver automatically converts BSON dates to Carbon instances
        // when you retrieve them, so you usually don't need to format them here.
        // The frontend will handle the conversion.
        
        return response()->json([
            'data' => $dueItems,
            'count' => $dueItems->count(),
            'date_range' => [
                'from' => $now->toDateString(),
                'to' => $futureDate->toDateString()
            ]
        ]);
    }

    // get overdue maintenance items
    public function getOverdue(Request $request)
    {
        // Get the number of days overdue from the request, defaulting to 1
        $days = $request->get('days', 1);

        // Validate the 'days' parameter
        if (!is_numeric($days) || (int)$days < 0) {
            return response()->json(['error' => 'The "days" parameter must be a non-negative integer.'], 400);
        }
        $days = (int)$days;

        // Use UTC to match MongoDB's date storage
        $now = Carbon::now('UTC');
        $overdueDate = $now->copy()->subDays($days)->startOfDay();
        
        // Log for debugging
        Log::info("Checking overdue items before {$overdueDate}");

        // MongoDB-specific query with proper date handling
        // Convert Carbon instances to UTCDateTime with correct milliseconds
        $overdueDateTime = new UTCDateTime($overdueDate->getTimestampMs());
        
        $overdueItems = MaintenanceJob::whereNotNull('scheduled_at')
                            // ->where('admin_email', Auth::user()->email)
                            ->where('scheduled_at', '<', $overdueDateTime)
                            ->where('status', '!=', 'done') // Only include items that are not completed
                            ->orderBy('scheduled_at', 'asc')
                            ->get();
        
        // Calculate overdue days for each item
        $itemsWithOverdueDays = $overdueItems->map(function ($item) use ($now) {
            $scheduledDate = Carbon::parse($item->scheduled_at);
            $overdueDays = $now->diffInDays($scheduledDate, false); // negative value for overdue
            $item->overdue_days = abs($overdueDays);
            return $item;
        });
        
        // Log results for debugging
        Log::info("Found {$itemsWithOverdueDays->count()} overdue items");
        
        return response()->json([
            'data' => $itemsWithOverdueDays,
            'count' => $itemsWithOverdueDays->count(),
            'as_of' => $now->toDateString(),
            'overdue_by_days' => $days
        ]);
    }

    public function predictiveMaintenance(Request $request, $id)
    {
        // VALIDATE MODAL INPUT
        $request->validate([
            'install_date' => 'required|date',
            'daily_usage_hours' => 'required|numeric|min:0',
            'operating_days' => 'required|array', // 1, 2, 3, 4, 5
        ]);

        // GET EQUIPMENT & INPUTS
        $equipment = Equipment::findOrFail($id);
        $startDate = Carbon::parse($request->install_date);
        $today = Carbon::today();
        $dailyUsage = (float) $request->daily_usage_hours;
        $operatingDays = $request->operating_days;

        // CALCULATE INITIAL RUN-HOURS
        $initialRunHours = 0;
        // Create a period from the start date up to yesterday
        $period = CarbonPeriod::create($startDate, $today->copy()->subDay());

        foreach ($period as $day) {
            // Check if the day of the week (1=Mon, 7=Sun) is in the operating_days array
            if (in_array($day->dayOfWeekIso, $operatingDays)) {
                $initialRunHours += $dailyUsage;
            }
        }

        // GET MAINTENANCE RULES
        
        // Find the rules from the 'equipment_types' collection
        // match its 'name' against the equipment's 'article' field
        $rules = EquipmentType::where('name', strtolower($equipment->article))->first();

        // Handle if no rules are found for this article type
        if (!$rules) {
            $rules = EquipmentType::create([
                'name' => strtolower($equipment->article),
                'default_max_usage_hours' => 1000, // Default: 1000 hours
                'default_max_time_days' => 365,    // Default: 1 year
            ]);
            // return response()->json(['message' => 'No maintenance rules found for article type: ' . $equipment->article, 'error' => ''], 400);
        }

        // Get thresholds. Check for item-specific overrides first, then use type defaults.
        $maxUsageHours = $equipment->max_usage_hours ?? $rules->default_max_usage_hours;
        $maxTimeDays = $equipment->max_time_days ?? $rules->default_max_time_days;

        // Handle if rules are incomplete (e.g., no hours AND no days set)
        if (is_null($maxUsageHours) && is_null($maxTimeDays)) {
            return response()->json(['message' => 'Maintenance rules (thresholds) are incomplete for: ' . $equipment->article], 400);
        }

        // calculate maintenance date

        // calculate average daily usage (spread over 7 days)
        $daysPerWeek = count($operatingDays);
        $totalWeeklyUsage = $dailyUsage * $daysPerWeek;
        $averageDailyUsage = ($totalWeeklyUsage > 0) ? $totalWeeklyUsage / 7 : 0;

        // calculate predicted date based on usage
        $predictedUsageDate = Carbon::create(9999, 12, 31, 0, 0, 0); // Default to "never"
        if (!is_null($maxUsageHours) && $averageDailyUsage > 0) {
            $remainingUsageHours = $maxUsageHours - $initialRunHours;
            // Calculate days left. If already overdue, set to 0.
            $daysToHitUsageThreshold = ($remainingUsageHours > 0) ? $remainingUsageHours / $averageDailyUsage : 0;
            // Add remaining days to *today*
            $predictedUsageDate = $today->copy()->addDays(ceil($daysToHitUsageThreshold));
        }

        // calculate predicted date based on time
        $predictedTimeDate = Carbon::create(9999, 12, 31, 0, 0, 0);
        if (!is_null($maxTimeDays)) {
            // Add max days to the install date
            $predictedTimeDate = $startDate->copy()->addDays($maxTimeDays);
        }
        
        // find final date
        $nextMaintenanceDate = $predictedTimeDate->min($predictedUsageDate);

        // Handle case where item never needs maintenance (e.g., 0 usage and no time limit)
        if ($nextMaintenanceDate->equalTo(Carbon::create(9999, 12, 31, 0, 0, 0))) {
            $nextMaintenanceDate = null; 
        }

        // save equipment details
        $equipment->install_date = $startDate;
        $equipment->daily_usage_hours = $dailyUsage;
        $equipment->operating_days = $operatingDays;
        $equipment->total_run_hours = $initialRunHours; // Set the "odometer"
        $equipment->last_run_update = Carbon::now(); // Timestamp the activation/update
        $equipment->next_maintenance_date = $nextMaintenanceDate; // predicted date
        $equipment->save();

        // return response
        return response()->json([
            'message' => 'Predictive maintenance activated for: ' . $equipment->article,
            'calculated_initial_hours' => round($initialRunHours, 2),
            'next_maintenance_date' => $nextMaintenanceDate ? $nextMaintenanceDate->toDateString() : null,
        ]);
    }

    public function setPickupDetails(Request $request, $id)
    {
        $request->validate([
        'remarks'       => 'required|string|max:5000',
        'pickup_date'   => 'required|date',
        'pickup_place'  => 'required|string|max:255',
        ]);

        $job = MaintenanceJob::findOrFail($id);

        // optional authorisation – only the assigned service user may close
        if ($job->user_email !== auth()->user()->email) {
            abort(403, 'Not your job');
        }

        $asset = Equipment::findOrFail($job->asset_id);



        $job->remarks      = $request->remarks;
        $job->admin_email  = $asset->created_by;
        $job->pickup_date  = Carbon::parse($request->pickup_date);
        $job->pickup_place = $request->pickup_place;
        $job->status       = 'done';
        $job->save();

        // notify admin (mail, broadcast, etc.)
        // Mail::to($request->admin_email)->send(new JobCompleted($job));

        return response()->json(['message' => 'Job closed & details saved']);
        }

    public function uploadReport(Request $request)
    {
        $request->validate([
        'report_file' => 'required|file|mimes:pdf|max:5120', // 5 MB
        ]);

        // read file & encode
        $pdf  = $request->file('report_file');
        $b64  = base64_encode(file_get_contents($pdf));
        $url  = route('pdf.view', [
            'id' => $request->input('job_id'),   // we’ll use the job _id
            't'  => time(),                      // cache-bust
        ]);

        return response()->json([
            'url' => $url,               // Laravel route, not a disk path
            'b64' => $b64,               // optional – you can ignore it
        ]);
    }

    public function updateReport(Request $request, $id)
    {
        $request->validate([
        'remarks'    => 'nullable|string|max:5000',
        'report_pdf' => 'nullable|string',   // base64
        ]);

        $job = MaintenanceJob::find($id);
        if (!$job) return response()->json(['error' => 'Not found'], 404);

        // only keys that arrived
        if ($request->exists('remarks'))    $job->remarks    = $request->remarks;
        if ($request->exists('report_pdf')) $job->report_pdf = $request->report_pdf;

        $job->save();

        return response()->json(['message' => 'Report updated']);
    }

    public function showPdf($id, $t = null)
    {
        $job = MaintenanceJob::find($id);

        if (!$job || !$job->report_pdf) {
            abort(404);
        }

        $pdf = base64_decode($job->report_pdf);

        return response($pdf, 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="report.pdf"');
    }

    /**
     * Cancel/delete a maintenance job and remove from service inventory
     */
    public function destroy($id)
    {
        $job = MaintenanceJob::findOrFail($id);
        
        // Optional: Check if user is authorized to delete this job
        $user = auth('admin')->user() ?? auth('service')->user();
        
        if (!$user) {
            abort(401, 'Session required');
        }
        
        $isAdmin = $user->role === 'admin';
        $isAssigned = $job->user_email === $user->email;
        
        if (!$isAdmin && !$isAssigned) {
            abort(403, 'Unauthorized to delete this maintenance job');
        }

        // Delete the maintenance job
        $job->delete();
        
        return response()->json(['message' => 'Maintenance job canceled and removed']);
    }

}