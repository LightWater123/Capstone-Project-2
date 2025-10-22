<?php

namespace App\Http\Controllers;

use App\Models\Equipment;
use App\Models\MaintenanceJob;
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
            'status'      => 'pending',
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

        
        // filter through Message and gets the items with the same email as the currently logged in user
        $message = Message::where('recipient_email', Auth::user()->email)
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
            if ($req->has('status') && in_array($req->status, ['pending', 'in-progress', 'done'])) {
                $query->where('status', $req->status);
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
                      ->orderBy('created_at', 'desc')
                      ->get();
    }

    // service user maintenance list
    public function serviceIndex()
    {
        // fetch jobs that are pending or in-progress
        $jobs = MaintenanceJob::whereIn('status', ['pending', 'in-progress'])
                          ->orderBy('created_at', 'desc')
                          ->get();
        
        return response()->json($jobs);
    }

    // update status of equipment maintenance
    public function updateStatus(Request $request, MaintenanceJob $job) // <-- type-hint
    {
        $request->validate(['status' => 'required|in:pending,in-progress,done']);

        // authorisation
        if (! auth()->user()->email === 'admin@yourdomain.com' &&   // or any admin check you use
            $job->user_email !== auth()->user()->email) {
            abort(403);
        }

        $job->update(['status' => $request->status]);

        $now = Carbon::now();
        $equipt = Equipment::find($job->asset_id);
        \Log::info("test", ['request' => $request ]);

        if($equipt && $request->status === 'in-progress') {
            $equipt->start_date = $now;
        } elseif ($equipt && $request->status === 'done') {
            $equipt->end_date = $now;
        }
        \Log::info("test", ['equipt' => $equipt]);
        
        $equipt->save();

        return response()->json($job);
    }

    // get items due for maintenance
    public function getDueForMaintenance(Request $request)
    {
        // Get the number of days from the request, defaulting to 2.
        $days = $request->get('days', 2);

        // Validate the 'days' parameter
        if (!is_numeric($days) || (int)$days < 0) {
            return response()->json(['error' => 'The "days" parameter must be a non-negative integer.'], 400);
        }
        $days = (int)$days;

        // Use UTC to match MongoDB's date storage
        $now = Carbon::now('UTC');
        $futureDate = $now->copy()->addDays($days)->endOfDay();
        
        // Log for debugging
        Log::info("Checking maintenance from {$now} to {$futureDate}");

        // MongoDB-specific query with proper date handling
        // The UTCDateTime class is now correctly referenced
        $dueItems = MaintenanceJob::whereNotNull('scheduled_at')
                            ->where('scheduled_at', '>=', new UTCDateTime($now->timestamp * 1000))
                            ->where('scheduled_at', '<=', new UTCDateTime($futureDate->timestamp * 1000))
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

    public function predictiveMaintenance(Request $request, $id)
    {
        // VALIDATE MODAL INPUT
        $request->validate([
            'install_date' => 'required|date',
            'daily_usage_hours' => 'required|numeric|min:0',
            'operating_days' => 'required|array', // e.g., [1, 2, 3, 4, 5]
        ]);

        // GET EQUIPMENT & INPUTS
        $equipment = Equipment::findOrFail($id);
        $startDate = Carbon::parse($request->install_date);
        $today = Carbon::today();
        $dailyUsage = (float) $request->daily_usage_hours;
        $operatingDays = $request->operating_days;

        // CALCULATE INITIAL RUN-HOURS
        $initialRunHours = 0;
        // Create a period from the start date up to *yesterday*
        $period = CarbonPeriod::create($startDate, $today->copy()->subDay());

        foreach ($period as $day) {
            // Check if the day of the week (1=Mon, 7=Sun) is in the operating_days array
            if (in_array($day->dayOfWeekIso, $operatingDays)) {
                $initialRunHours += $dailyUsage;
            }
        }

        // GET MAINTENANCE RULES (Dynamic Lookup)
        
        // Find the rules from the 'equipment_types' collection
        // match its 'name' against the equipment's 'article' field
        $rules = EquipmentType::where('name', strtolower($equipment->article))->first();

        // Handle if no rules are found for this article type
        if (!$rules) {
            return response()->json(['message' => 'No maintenance rules found for article type: ' . $equipment->article], 400);
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
        $predictedUsageDate = Carbon::maxValue(); // Default to "never"
        if (!is_null($maxUsageHours) && $averageDailyUsage > 0) {
            $remainingUsageHours = $maxUsageHours - $initialRunHours;
            // Calculate days left. If already overdue, set to 0.
            $daysToHitUsageThreshold = ($remainingUsageHours > 0) ? $remainingUsageHours / $averageDailyUsage : 0;
            // Add remaining days to *today*
            $predictedUsageDate = $today->copy()->addDays(ceil($daysToHitUsageThreshold));
        }

        // calculate predicted date based on time
        $predictedTimeDate = Carbon::maxValue(); // Default to "never"
        if (!is_null($maxTimeDays)) {
            // Add max days to the *install date*
            $predictedTimeDate = $startDate->copy()->addDays($maxTimeDays);
        }
        
        // find final date
        $nextMaintenanceDate = $predictedTimeDate->min($predictedUsageDate);

        // Handle case where item never needs maintenance (e.g., 0 usage and no time limit)
        if ($nextMaintenanceDate->equalTo(Carbon::maxValue())) {
            $nextMaintenanceDate = null; 
        }

        // save equipment details
        $equipment->install_date = $startDate;
        $equipment->daily_usage_hours = $dailyUsage;
        $equipment->operating_days = $operatingDays;
        $equipment->total_run_hours = $initialRunHours; // Set the "odometer"
        $equipment->last_run_update = Carbon::now(); // Timestamp the activation/update
        $equipment->next_maintenance_date = $nextMaintenanceDate; // The new predicted date!
        
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

    }
}