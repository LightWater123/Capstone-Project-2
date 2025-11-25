<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Resend\Laravel\Facades\Resend;
use App\Models\PasswordReset;

class PasswordResetLinkController extends Controller
{
    /**
     * Handle an incoming password reset link request for API.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        try {
            // Check if user exists in the system
            $admin_user = \App\Models\AdminUser::where('email', $request->email)->first();
            $service_user = \App\Models\ServiceUser::where('email', $request->email)->first();

            \Log::info('admin', ['admin' => $admin_user]);
            \Log::info('service', ['service' => $service_user]);
            
            if (!$admin_user && !$service_user) {
                // For security reasons, don't reveal if email exists or not
                return response()->json([
                    'status' => 'password-reset-link-sent',
                    'message' => 'If your email address exists in our database, you will receive a password reset link shortly.',
                    'can_resend' => true
                ]);
            }

            $user = $admin_user ? $admin_user : $service_user;

            // Generate password reset token
            $token = Str::random(60);

            \Log::info('user', ['user' => $user]);
            
            // Save the reset token to the database
            \App\Models\PasswordReset::createToken($user->email, $token);
            
            // Generate the password reset URL using the validate token route
            $resetUrl = URL::to("/api/validate-reset-token?token={$token}");

            \Log::info("resetURl", [ 'resetUrl' => $resetUrl]);
            
            // Store the token in the password_resets table
            Resend::emails()->send([
                'from'    => 'noreply@treasuretracks.org',
                'to'      => $user->email,
                'subject' => 'Password Reset Link',
                'html'    => "
                            <p>Hi {$user->email},</p>
                            <p>You have requested to reset your password. Click the link below to proceed:</p>
                            <a href=\"{$resetUrl}\" target=\"_blank\">Click here to reset your password</a>
                            <p>This link will expire in 60 minutes.</p>
                            <p>If you did not request this password reset, please ignore this email.</p>
                            ",
            ]);

            return response()->json([
                'status' => 'password-reset-link-sent',
                'message' => 'If your email address exists in our database, you will receive a password reset link shortly.',
                'can_resend' => true
            ]);

        } catch (\Exception $e) {
            \Log::error('Password reset error: ' . $e->getMessage());
            // Return success even on error to avoid revealing system information
            return response()->json([
                'status' => 'password-reset-link-sent',
                'message' => 'If your email address exists in our database, you will receive a password reset link shortly.',
                'can_resend' => true
            ]);
        }
    }


    /**
     * Handle the reset password link request.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function showResetForm(Request $request)
    {
        $request->validate([
            'token' => ['required', 'string'],
        ]);

        try {
            // Find the valid password reset token
            $passwordReset = PasswordReset::findValidByToken($request->token);
            
            if (!$passwordReset) {
                return response()->json([
                    'status' => 'invalid-token',
                    'message' => 'The password reset token is invalid or has expired.',
                ], 422);
            }

            // Check if user exists
            $admin_user = \App\Models\AdminUser::where('email', $passwordReset->email)->first();
            $service_user = \App\Models\ServiceUser::where('email', $passwordReset->email)->first();

            if (!$admin_user && !$service_user) {
                return response()->json([
                    'status' => 'user-not-found',
                    'message' => 'User not found.',
                ], 404);
            }

            // Create a response that redirects to the frontend with the reset token as a cookie
            $baseUrl = config('app.frontend', 'http://localhost:3000');
            $response = redirect()->to("{$baseUrl}/reset-password?token=" . $request->token);
            
            // Add the reset token as an HTTP cookie
            $response->withCookie(cookie()->make('reset-token', $request->token, 60, null, null, false, true, false, 'strict')); // 60 minutes expiration
            
            return $response;

        } catch (\Exception $e) {
            \Log::error('Password reset validation error: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while validating the reset token.',
            ], 500);
        }
    }
}

