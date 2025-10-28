<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;

class EventController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'startDate' => 'required|date',
            'endDate' => 'required',
            'color' => 'required|string',
        ]);

        $event = Event::create($validated);

        return response()->json(['success' => true, 'event' => $event], 201);
    }

    public function index() {
        return Event::all();
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

    $event->update([
        'title' => $request->title,
        'start_date' => $request->startDate,
        'end_date' => $request->endDate,
        'color' => $request->color,
    ]);

    return response()->json(['message' => 'Event updated'], 200);
}




}
