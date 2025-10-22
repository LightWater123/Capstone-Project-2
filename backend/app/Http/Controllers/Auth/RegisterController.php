<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\AdminUser;
use App\Models\ServiceUser;

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
            ]);
            
            
            $user->name = $validated['name'];
        }

        return response()->json(['user' => $user], 201);
    }
}