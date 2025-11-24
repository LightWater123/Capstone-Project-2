<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\AdminUser;
use App\Models\ServiceUser;
use App\Models\ActivationToken;
use Resend\Laravel\Facades\Resend;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:8',
            'mobile_number' => 'required|string|max:20',
            'role' => 'required|in:admin,service_user',
        ]);

        // Format mobile number
        $digitsOnly = preg_replace('/\D+/', '', $validated['mobile_number']);
        if (strlen($digitsOnly) === 11) {
            $validated['mobile_number'] = substr($digitsOnly, 0, 4) . '-' .
                                          substr($digitsOnly, 4, 3) . '-' .
                                          substr($digitsOnly, 7);
        } else {
            return response()->json(['error' => 'Mobile number must contain exactly 11 digits.'], 422);
        }

        // Create user based on role
        if ($validated['role'] === 'admin') {
            
            $request->validate([
                'username' => 'unique:admin_users,username',
                'email' => 'unique:admin_users,email',
            ]);
            
            $user = AdminUser::create([
                'name' => $validated['name'],
                'username' => $validated['username'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'mobile_number' => $validated['mobile_number'],
                'is_verified' => false
            ]);
            
            
            $user->name = $validated['name'];
            $user->role = $validated['role'];
            
        } else if ($validated['role'] === 'service_user') {
            // Validate service_type for service users
            $request->validate([
                'service_type' => 'required|in:Vehicle,Appliances,ICT Equipment',
                'address' => 'required|string|max:255',
                'username' => 'unique:service_users,username',
                'email' => 'unique:service_users,email',
            ]);
            
            $user = ServiceUser::create([
                'username' => $validated['username'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'mobile_number' => $validated['mobile_number'],
                'service_type' => $request->service_type,
                'address' => $request->address,
                'is_verified' => false
            ]);
            
            
            $user->name = $validated['name'];
        }

        // Generate activation token
        $token = Str::random(60);
        
        // Store activation token after the user is saved to ensure _id exists
        $user->save(); // Make sure the user is saved and has an _id
        ActivationToken::createToken(
            $user->email,
            $token,
            $validated['role'],
            (string) $user->_id,
            1440 // 24 hours
        );
        
        // Generate activation URL
        $activationUrl = $this->generateActivationUrl($user->email, $token, $validated['role']);
        
        // Send activation email
        $this->sendActivationEmail($user, $validated['password'], $activationUrl, $validated['role']);
        
        return response()->json([
            'user' => $user,
            'message' => 'Registration successful. Please check your email to activate your account.'
        ], 201);
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
        return "{$baseUrl}/api/activate?email={$email}&token={$token}&user_type={$userType}";
    }
    
    /**
     * Send activation email to user.
     *
     * @param mixed $user
     * @param string $password
     * @param string $activationUrl
     * @param string $userType
     * @return void
     */
    private function sendActivationEmail($user, string $password, string $activationUrl, string $userType): void
    {
        Resend::emails()->send([
            'from'    => 'noreply@treasuretracks.org',
            'to'      => $user->email,
            'subject' => 'Activate Your Account',
            'html'    => "
                <p>Hi {$user->name},</p>
                <p>Thank you for registering with Treasure Tracks! Please click the button below to activate your account and start using our services.</p>
                <p><strong>Username:</strong> {$user->username}</p>
                <p><strong>Password:</strong> {$password}</p>
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