<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\ServiceUser;
use App\Models\PasswordReset;
use Illuminate\Auth\Events\PasswordReset as PasswordResetEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Http\JsonResponse;

class NewPasswordController extends Controller
{
    /**
     * Handle an incoming new password request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        try {
            // Log detailed cookie information
            // \Log::info('=== COOKIE DEBUG INFO ===');
            // \Log::info('All cookies in request: ', $request->cookies->all());
            // \Log::info('Request headers: ', $request->headers->all());
            // \Log::info('Request URL: ' . $request->url());
            // \Log::info('Request method: ' . $request->method());
            // \Log::info('Request origin: ' . $request->header('Origin'));
            // \Log::info('Request referer: ' . $request->header('Referer'));
            // \Log::info('=========================');
            
            // Get token from cookie
            $token = $request->token;
            \Log::info('Token from cookie: ' . ($token ? 'Found' : 'Not found'));

            
            if (!$token) {
                return response()->json([
                    'status' => 'invalid-token',
                    'message' => 'The password reset token is missing or has expired.',
                ], 422);
            }

            // Find the valid password reset token
            $passwordReset = PasswordReset::findValidByToken($token);
            
            if (!$passwordReset) {
                return response()->json([
                    'status' => 'invalid-token',
                    'message' => 'The password reset token is invalid or has expired.',
                ], 422);
            }

            // Find the admin user based on the email from the password reset token
            $admin_user = AdminUser::where('email', $passwordReset->email)->first();

            if (!$admin_user) {
                return response()->json([
                    'status' => 'user-not-found',
                    'message' => 'Admin user not found.',
                ], 404);
            }

            // Update the admin user's password
            $admin_user->password = Hash::make($request->password);
            $admin_user->save();

            // Delete the password reset token
            PasswordReset::deleteByEmail($passwordReset->email);

            // Clear the cookie
            $response = response()->json([
                'status' => 'password-reset',
                'message' => 'Password has been successfully reset.',
                'redirect_url' => 'http://localhost:3000/login'
            ]);

            return $response->withCookie(cookie()->forget('reset-token'));

        } catch (\Exception $e) {
            Log::error('Password reset error: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while resetting the password.',
            ], 500);
        }
    }
}
