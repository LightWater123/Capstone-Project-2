<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Equipment;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use App\Models\MaintenanceJob;
use MongoDB\BSON\ObjectId;
use Illuminate\Database\Eloquent\Builder; // Added for type-hinting
use Carbon\Carbon; // Added for date manipulation
use Illuminate\Support\Facades\Auth;

class EquipmentController extends Controller
{
    // valid location values for dropdown selection
    protected array $validLocations = [
        "RD's Office",
        "Conference Room",
        "Auditor's Office",
        "Storage Room",
        "Car Port/Garage",
        "CTOO II Office",
        "Outside the building",
        "Records Room",
        "Within the building"
    ];

    /**
     * GET /api/inventory
     * Retrieve equipment filtered by category (PPE or RPCSP),
     * enriched with predictive maintenance data.
     */
    public function index(Request $request)
    {
        $category = $request->query('category');

        // 1. Define maintenance intervals in MONTHS for each equipment type.
        $maintenanceIntervals = [
            'airconditioner' => 6,
            //'air con' => 6,
            'generator' => 3,
            'transformer' => 12,
            'computer' => 12,
            'pc set' => 12,
            'notebook' => 12,
            'refrigerator' => 6,
        ];
        $keywords = array_keys($maintenanceIntervals);

        // 2. Initialize the base query with the category filter
        $query = Equipment::query();
        if ($category) {
            $query->where('category', $category)->where('created_by', Auth::user()->email);
        }

        // 3. Get the equipment and then map over the collection to add the predictive date
        $equipmentWithSchedule = $query->get()->map(function ($equipment) use ($maintenanceIntervals, $keywords) {
            $interval = 0;
            $description = $equipment->description ?? ''; // Use null coalescing to prevent errors

            // Find the matching keyword and its interval for the current equipment's description.
            foreach ($maintenanceIntervals as $keyword => $months) {
                if (stripos($description, $keyword) !== false) {
                    $interval = $months;
                    break; // Stop after finding the first match
                }
            }

            // Add the new attribute to the equipment object, defaulting to null.
            // This will be the value for items that don't need maintenance or have no date.
            $equipment->next_maintenance_checkup = null;

            // If a matching type was found and it requires maintenance, proceed.
            if ($interval > 0) {
                // Use the most recent date: 'end_date' (completion) is best, otherwise 'start_date'.
                $lastMaintenanceDate = $equipment->end_date ?: $equipment->start_date;

                // *** KEY FIX: Check if a date actually exists before trying to parse it. ***
                if ($lastMaintenanceDate) {
                    try {
                        // Ensure the date is a Carbon instance for calculations.
                        $lastMaintenanceDate = Carbon::parse($lastMaintenanceDate);
                        // Calculate the next due date based on the interval.
                        $nextMaintenanceDate = (clone $lastMaintenanceDate)->addMonths($interval);
                        
                        // Format the date to the MM/dd/yyyy format requested by the frontend
                        $equipment->next_maintenance_checkup = $nextMaintenanceDate->format('m/d/Y');
                    } catch (\Exception $e) {
                        // Log error if date parsing fails for some reason (e.g., invalid format)
                        Log::warning("Could not parse maintenance date for equipment ID: " . $equipment->_id, ['error' => $e->getMessage()]);
                        $equipment->next_maintenance_checkup = 'Invalid Date';
                    }
                }
            }

            // Return the modified equipment object
            return $equipment;
        });

        // 4. Return the enriched collection as JSON
        return response()->json($equipmentWithSchedule, 200);
    }

    /**
     * POST /api/inventory
     * Create a new equipment entry
     */
    public function store(Request $request)
    {
        try {
            // Validate incoming request through conditional validation
            $validated = $request->validate([
                'category'        => ['required', 'string', Rule::in(['PPE', 'RPCSP'])],
                'article'         => ['required', 'string'],
                'description'     => ['required', 'string'],
                'property_ro'     => ['required_if:category,PPE', 'nullable','string'], // or semi-expendable property no.
                'property_co'     => ['nullable', 'string'], // only for PPE
                'semi_expendable_property_no' => ['required_if:category,RPCSP', 'nullable', 'string'], // only for RPCSP
                'unit'            => ['required', 'string'],
                'unit_value'      => ['required', 'numeric'],
                'recorded_count'  => ['required', 'numeric', 'min:0'], // quantity listed in inventory
                'actual_count'    => ['required', 'numeric', 'min:0'], // actual count of items
                'remarks'         => ['nullable', 'string'],
                'location'        => ['required', 'string', Rule::in($this->validLocations)],
                'condition' => 'nullable|string',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
            ]);

            
            // create and save item
            // $equipment = Equipment::create($validated);
            Log::info('Creating new equipment entry', ['data' => $validated]);
            $equipment = new Equipment();
            $equipment->fill($validated);
            $equipment->date_added = now(); // set date_added to current timestamp
            $equipment->created_by = Auth::user()->email;
            $equipment->save();
            // return created item to frontend
            return response()->json($equipment, 201);

        } catch (ValidationException $e) {
            // return specific validation errors
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            // log unexpected exceptions and return a generic error response
            Log::error('Equipment creation failed', ['exception' => $e]);

            return response()->json([
                'message' => 'An unexpected error occurred.',
                'error'   => $e->getMessage() // debug, shows error message
            ], 500);
        }
    }
    /**
     * PUT /api/inventory/{id}
     * Update an existing equipment entry
     */
    public function update(Request $request, $id)
    {
        try
        {
            // find id through mongodb id
            $equipment = Equipment::findOrFail($id);

            // --- CORRECTED VALIDATION RULES ---
            // We've added all the missing fields from your model's $fillable array.
            $validated = $request->validate([
                // Core Inventory Fields
                'category'                   => ['sometimes', 'string', Rule::in(['PPE', 'RPCSP'])],
                'article'                    => ['sometimes', 'string'],
                'description'                => ['sometimes', 'string'],
                'property_ro'                => ['nullable', 'string'],
                'property_co'                => ['nullable', 'string'],
                'semi_expendable_property_no'=> ['required_if:category,RPCSP', 'nullable', 'string'],
                'unit'                       => ['sometimes', 'string'],
                'unit_value'                 => ['sometimes', 'numeric'],
                'recorded_count'             => ['sometimes', 'integer', 'min:0'],
                'actual_count'               => ['sometimes', 'integer', 'min:0'],
                'remarks'                    => ['nullable', 'string'],
                'location'                   => ['sometimes', 'string', Rule::in($this->validLocations)],
                'condition'                  => ['nullable', 'string'],
                'start_date'                 => ['nullable', 'date'],
                'end_date'                   => ['nullable', 'date'],
                'pickup_date'                => ['nullable', 'date'],
                'pickup_location'            => ['sometimes', 'string'],

                // Predictive Maintenance Fields (These were all missing)
                // 'install_date'               => ['nullable', 'date'],
                // 'daily_usage_hours'          => ['sometimes', 'numeric'],
                // 'operating_days'             => ['sometimes', 'array'],
                // 'total_run_hours'            => ['sometimes', 'numeric'],
                // 'last_run_update'            => ['nullable', 'date'],
                // 'next_due_date'              => ['nullable', 'date'],
                // 'max_usage_hours'            => ['sometimes', 'numeric'],
                // 'max_time_days'              => ['sometimes', 'integer'],
            ]);
            Log::info($validated);
            $equipment->update($validated);

            return $equipment;

            // // update field anud save
            // // Now $validated will contain all the fields you want to update
            // $equipment->fill($validated)->save();

            // // It's good practice to refresh the model to get the latest state from the DB
            // $equipment->refresh();

            // // return updated item to frontend
            // return response()->json($equipment, 200);

        } catch (ValidationException $e)
        {
            // return specific validation errors
            Log::error('Equipment update failed', ['exception' => $e]);

            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $e->errors()
            ], 422);
        }
        catch (\Exception $e)
        {
            // log unexpected exceptions and return a generic error response
            Log::error('Equipment update failed', ['exception' => $e]);

            return response()->json([
                'message' => 'An unexpected error occurred.',
                'error'   => $e->getMessage() // debug, shows error message
            ], 500);
        }
    }

    public function destroy($id)
    {
        try 
        {
            // find id through mongodb id
            $equipment = Equipment::findOrFail($id);

            // delete item
            $equipment->delete();

            return response()->json(['message' => 'Equipment deleted successfully.'], 200);

        } catch (\Exception $e) 
        {
            // log unexpected exceptions and return a generic error response
            Log::error('Equipment deletion failed', ['exception' => $e]);

            return response()->json([
                'message' => 'An unexpected error occurred.',
                'error'   => $e->getMessage() // debug, shows error message
            ], 500);
        }
    }

    /**
 * GET /api/service/inventory?category=PPE|RPCSP
 * Service-user list: only the 4 allowed columns
 */
    public function serviceIndex(Request $request)
    {
        $category = $request->query('category');

        $query = Equipment::query()
            ->select(
                'id',                                      // needed for the “click” link
                'category',
                'article',
                'description',
                'property_ro',
                'property_co',
                'semi_expendable_property_no'
            );

        if ($category) {
            $query->where('category', $category);
        }

        // tidy up the JSON so the frontend always sees the same keys
        return $query->cursor()->map(fn ($i) => [
            'id'            => $i->id,
            'article'       => $i->article,
            'description'   => $i->description,
            'property_ro'   => $i->property_ro,
            'property_co'   => $i->property_co,
            'semi_expendable_property_no' => $i->semi_expendable_property_no,
        ]);
    }

    /**
     * GET /api/service/inventory/{id}/maintenance
     * Maintenance progress timeline for the clicked item
    */
    public function serviceMaintenance($id)
    {
        // Find the equipment by id (MongoDB _id)
        // $equipment = Equipment::find($id);
        $equipment = Equipment::where("id", $id)->first();
        
        // // Find maintenance jobs related to this equipment using the equipment's id
        $maintenanceJobs = MaintenanceJob::where('equipment_id', $id)->get();
        // return response()->json($equipment);

        // // Return equipment details and maintenance history
        return response()->json([
            'id'            => $equipment->id,
            'article'       => $equipment->article,
            'description'   => $equipment->description,
            'asset_id'      => $equipment->asset_id ?? $equipment->id, // Use asset_id if available, otherwise use id
            'maintenance'   => $maintenanceJobs->map(function ($job) {
                return [
                    'id'            => $job->id,
                    'start_date'    => $job->start_date,
                    'end_date'      => $job->end_date,
                    'condition'     => $job->condition,
                    'remarks'       => $job->remarks,
                    'status'        => $job->status,
                    'scheduled_at'  => $job->scheduled_at,
                ];
            }),
        ]);
    }

    public function dueSoon(Request $request)
    {
        // Start a new query on the Equipment model
        $query = Equipment::query();

        $query->whereNotNull('next_maintenance_date');
            
            // We sort them by that date in ascending order ('asc').
            // This puts the SOONEST dates (including overdue ones) at the TOP.
            $query->orderBy('next_maintenance_date', 'desc');

        // --- THIS IS THE NEW LOGIC ---
        
        // // Check if the ?due_soon=true parameter exists in the URL
        // if ($request->has('due_soon') && $request->due_soon == 'true') {
            
        //     // If "Due soon" is clicked, we ignore category.
        //     // Instead, we find all items that have a predictive date set.
        //     $query->whereNotNull('next_maintenance_date');
            
        //     // We sort them by that date in ascending order ('asc').
        //     // This puts the SOONEST dates (including overdue ones) at the TOP.
        //     $query->orderBy('next_maintenance_date', 'asc');

        // } else if ($request->has('category')) {
        //     // This is your original logic for "PPE" and "RPCSP"
        //     // It will run if 'due_soon' is not in the URL.
        //     $query->where('category', $request->category);
        // }
        

        // Execute the query and return the results
        return $query->get();
    }
}