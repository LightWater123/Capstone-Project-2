<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Resend\Laravel\Facades\Resend;   // <= Resend facade
use App\Models\MaintenanceJob;


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

    public function sendFollowupEmail(Request $request)
    {
        $request->validate([
            'maintenanceJobId' => ['required', 'string'],
            'assetName' => ['required', 'string',],
            'scheduledAt' => ['required', 'date'],
            'userEmail' => ['required', 'email'],
        ]);

        $assetName = str_replace("\n", " ", $request->assetName);

        $when = \Carbon\Carbon::parse($request->scheduledAt)
            ->timezone('Asia/Manila')
            ->format('M d, Y  g:i A');

        $html = nl2br(e("This equipment is asking for a followup. Please schedule the maintenance as soon as possible."));

        Resend::emails()->send([
            'from'    => 'noreply@treasuretracks.org',
            'to'      => $request->userEmail,
            'subject' => 'Followup: Maintenance Required for ' . $assetName,
            'html'    => "
                         <p>Hi there,</p>
                         <p>This is a followup regarding the maintenance for your equipment: <strong>{$assetName}</strong></p>
                         {$html}
                         <p>Original scheduled date: <strong>{$when}</strong></p>
                         <p>Please contact us to reschedule or confirm the maintenance.</p>
                         <p>Reply to this email or call (xxx) xxx-xxxx for assistance.</p>
                         ",
        ]);

        // Set the maintenance job status to overdue after sending the email
        try {
            $maintenanceJob = MaintenanceJob::find($request->maintenanceJobId);
            if ($maintenanceJob) {
                $maintenanceJob->condition = 'overdue';
                $maintenanceJob->save();
            }
        } catch (\Exception $e) {
            // Log the error but don't fail the email sending
            \Log::error('Failed to update maintenance job status: ' . $e->getMessage());
        }

        return response()->json(['status' => 'followup_sent']);
    }

    // verify domain name
    public function verify(Request $request)
    {
        $resend = Resend::domains()->verify('treasuretracks.org');
        return response()->json($resend);
    }
}
