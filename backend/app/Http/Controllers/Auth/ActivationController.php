<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivationToken;
use App\Models\AdminUser;
use App\Models\ServiceUser;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ActivationController extends Controller
{
    /**
     * Verify the user's email address using the activation token.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verify(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'user_type' => 'required|in:admin,service_user',
        ]);

        $email = $request->email;
        $token = $request->token;
        $userType = $request->user_type;

        // Find the valid activation token
        $activationToken = ActivationToken::findValidByEmailAndToken($email, $token, $userType);

        if (!$activationToken) {
            return response()->json([
                'message' => 'Invalid or expired activation token.'
            ], 400);
        }

        // Find the user based on type
        $user = null;
        if ($userType === 'admin') {
            $user = AdminUser::where('email', $email)->first();
        } else if ($userType === 'service_user') {
            $user = ServiceUser::where('email', $email)->first();
        }

        if (!$user) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }

        // Mark user as verified
        $user->is_verified = true;
        $user->save();

        // Delete the activation token
        $activationToken->delete();
        $baseUrl = config('app.frontend', 'http://localhost:3000');
        return redirect()->away("{$baseUrl}/login");
    }

    /**
     * Resend activation email for a user.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resend(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'user_type' => 'required|in:admin,service_user',
        ]);

        $email = $request->email;
        $userType = $request->user_type;

        // Find the user based on type
        $user = null;
        if ($userType === 'admin') {
            $user = AdminUser::where('email', $email)->first();
        } else if ($userType === 'service_user') {
            $user = ServiceUser::where('email', $email)->first();
        }

        if (!$user) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }

        // Check if user is already verified
        if ($user->is_verified) {
            return response()->json([
                'message' => 'Account is already verified.'
            ], 400);
        }

        // Generate new activation token
        $token = Str::random(60);
        
        // Delete existing tokens for this user
        ActivationToken::deleteByEmail($email);
        
        // Create new activation token
        ActivationToken::createToken(
            $email,
            $token,
            $userType,
            (string) $user->_id,
            1440 // 24 hours
        );

        // Generate activation URL
        $activationUrl = $this->generateActivationUrl($email, $token, $userType);

        // Send activation email
        $this->sendActivationEmail($user, $activationUrl, $userType);

        return response()->json([
            'message' => 'Activation email resent successfully.'
        ], 200);
    }

    /**
     * Generate activation URL.
     *
     * @param string $email
     * @param string $token
     * @param string $userType
     * @return string
     */
    private function generateActivationUrl(string $email, string $token, string $userType): string
    {
        $baseUrl = config('app.url', 'http://localhost:8000');
        return "{$baseUrl}/api/verify?email={$email}&token={$token}&user_type={$userType}";
    }

    /**
     * Send activation email to user.
     *
     * @param mixed $user
     * @param string $activationUrl
     * @param string $userType
     * @return void
     */
    private function sendActivationEmail($user, string $activationUrl, string $userType): void
    {
        \Resend\Laravel\Facades\Resend::emails()->send([
            'from'    => 'noreply@treasuretracks.org',
            'to'      => $user->email,
            'subject' => 'Activate Your Account',
            'html'    => "
                <p>Hi {$user->name},</p>
                <p>Thank you for registering! Please click the button below to activate your account and start using our services.</p>
                <p><strong>Username:</strong> {$user->username}</p>
                <p><strong>Password:</strong> [Your password]</p>
                <a href=\"{$activationUrl}\" style=\"background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;\">Activate Account</a>
                <p>If the button above doesn't work, please copy and paste the following URL into your browser:</p>
                <p>{$activationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you did not create an account, please ignore this email.</p>
                <p>Best regards,<br>Treasure Tracks Team</p>
            ",
        ]);
    }
}