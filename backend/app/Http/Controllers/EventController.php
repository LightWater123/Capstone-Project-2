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
            'date' => 'required|date',
            'startTime' => 'required',
            'endTime' => 'required',
            'location' => 'required|string',
            'color' => 'required|string',
        ]);

        $event = Event::create($validated);

        return response()->json(['success' => true, 'event' => $event], 201);
    }
}
