<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Resend\Laravel\Facades\Resend;   // <= Resend facade


class EmailController extends Controller
{
    public function sendEmail(Request $request)
    {

        
        $request->validate([
            'recipientEmail' => ['required','email'],
            'recipientName' => ['required','string','max:255'],
            'scheduledAt' => ['required','date'],
            'message' => ['required','string'],
        ]);

        

        $when = \Carbon\Carbon::parse($request -> scheduledAt)
            ->timezone('Asia/Manila')
            ->format('M d, Y  g:i A');

        $html = nl2br(e($request->message));

        Resend::emails()->send([
            'from'    => 'noreply@treasuretracks.org',
            'to'      => $request->recipientEmail,
            'subject' => 'Maintenance Schedule Reminder',
            'html'    => "
                         <p>Hi {$request->recipientName},</p>
                         {$html}
                         <p>Scheduled at: <strong>{$when}</strong></p>
                         <p>Reply YES to Confirm or call (xxx) xxx-xxxx</p>
                         ", 
        ]);

        return response()->json(['status' => 'sent']);
    }

    // verify domain name
    public function verify(Request $request)
    {
        $resend = Resend::domains()->verify('treasuretracks.org');
        return response()->json($resend);
    }
}
