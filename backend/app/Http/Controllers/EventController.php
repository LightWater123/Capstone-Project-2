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

    public function destroy($id) {
        $event = Event::findOrFail($id);

        $event->destroy();

        return response()->json(['success' => true], 200);
    } 
}
