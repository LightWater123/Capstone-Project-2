<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\Maintenance; 
use App\Models\Equipment;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required',
            'color' => 'required|string',
        ]);

        $validated["created_by"] = Auth::user()->email;

        $event = Event::create($validated);

        return response()->json(['success' => true, 'event' => $event], 201);
    }

    public function index() {
        return Event::get();
    }

    public function destroy($id)
{
    $event = Event::find($id);

    if (!$event) {
        return response()->json(['message' => 'Event not found'], 404);
    }

    $event->delete();

    return response()->json(['message' => 'Event deleted successfully'], 200);
}

public function update(Request $request, $id)
{
    $event = Event::find($id);

    if (!$event) {
        return response()->json(['message' => 'Event not found'], 404);
    }

    \Log::info($id);
    \Log::info($request);

    $event->update([
        'title' => $request->title,
        'start_date' => $request->start_date,
        'end_date' => $request->end_date,
        'color' => $request->color,
    ]);

    return response()->json(['message' => 'Event updated'], 200);
}

public function maintenanceEvents()
{
    /* ----  quick debug ---- */
    \Log::info('total docs', [Maintenance::count()]);
    \Log::info('all rows',  Maintenance::all()->toArray());
    \Log::info('db & coll', [Maintenance::raw(fn($col) => $col->getCollectionName())]);
    /* ---------------------- */
     // we simply map the maintenance rows to the same json shape
    return Maintenance::query()
        ->get()
        ->map(fn($row) => [
            'id'           => (string) $row->_id,
            'title'        => "[MAINT] {$row->article}",   // short text shown on slot
            'startDate'    => $row->due_date->toIso8601String(),
            'endDate'      => $row->due_date->toIso8601String(), // 1-day event
            'color'        => $row->status === 'done' ? '#10b981' : '#f59e0b',
            'extendedProps'=> [          
                'type'        => 'maintenance',
                'article'     => $row->article,
                'description' => $row->description,
                'status'      => $row->status,
                'email'       => $row->service_user_email,
            ],
        ]);
}

public function reminderEvents()
{
    $reminders = app(EquipmentController::class)->dueSoon(new \Illuminate\Http\Request());

    return $reminders->map(fn ($item) => [
        'id'            => (string) $item->id,
        'title'         => '[REM] ' . $item->asset_name,
        'startDate'     => $item->scheduled_at->toIso8601String(),
        'endDate'       => $item->scheduled_at->toIso8601String(),
        'color'         => '#ef4444',
        'extendedProps' => [
            'type'        => 'reminder',
            'article'     => $item->asset_name,
            'description' => $item->description ?? 'Maintenance due',
            'status'      => $item->status,
            'email'       => $item->user_email,
        ],
    ]);
}

}
