<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * The guard that was determined during authentication.
     */
    private ?string $usedGuard = null;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        \Log::info('LoginRequest credentials received', $this->only('login', 'password'));
        return [
            'login'    => ['required', 'string'], // email or username
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $login = $this->input('login');
        
        // Check if session exists before trying to access it
        $sessionId = $this->hasSession() ? $this->session()->getId() : 'no_session';
        
        \Log::info('Authentication attempt', [
            'login' => $login,
            'is_email' => filter_var($login, FILTER_VALIDATE_EMAIL),
            'session_id' => $sessionId,
            'current_guard' => Auth::getDefaultDriver(),
        ]);

        // First, try to find the user to determine the correct guard
        $user = null;
        $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $regex = ['$regex' => '^'.preg_quote($login, '/').'$', '$options' => 'i'];

        // Check admin_users collection first
        if ($user = \App\Models\AdminUser::whereRaw([$field => $regex])->first()) {
            $this->usedGuard = 'admin';
        }
        // Then check service_users collection
        elseif ($user = \App\Models\ServiceUser::whereRaw([$field => $regex])->first()) {
            $this->usedGuard = 'service';
        }
        // Finally check users collection
        elseif ($user = \App\Models\User::whereRaw([$field => $regex])->first()) {
            $this->usedGuard = 'web';
        } else {
            // No user found in any collection
            $sessionId = $this->hasSession() ? $this->session()->getId() : 'no_session';
            \Log::warning('No user found in any collection', [
                'login' => $login,
                'field' => $field,
                'session_id' => $sessionId,
            ]);
            
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'login' => trans('auth.failed'),
            ]);
        }

        \Log::info('Guard selection', [
            'selected_guard' => $this->usedGuard,
            'login' => $login,
            'user_collection' => $user->getTable(),
            'user_id' => $user->getAuthIdentifier(),
            'user_role' => $user->role ?? 'not_set',
        ]);

        if (! Auth::guard($this->usedGuard)->attempt($this->only('login', 'password'), $this->boolean('remember'))) {
            $sessionId = $this->hasSession() ? $this->session()->getId() : 'no_session';
            \Log::warning('Authentication failed', [
                'login' => $login,
                'guard' => $this->usedGuard,
                'session_id' => $sessionId,
            ]);
            
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'login' => trans('auth.failed'),
            ]);
        }

        $sessionId = $this->hasSession() ? $this->session()->getId() : 'no_session';
        \Log::info('Authentication successful', [
            'login' => $login,
            'guard' => $this->usedGuard,
            'user' => Auth::guard($this->usedGuard)->user()->toArray(),
            'session_id' => $sessionId,
        ]);
        
        // logout other devices if a user logins into a new device
        Auth::guard($this->usedGuard)->logoutOtherDevices($this->input('password'));
        \Log::info('Logged out other sessions', [
            'user_id' => Auth::guard($this->usedGuard)->id(),
            'guard' => $this->usedGuard,
            'current_session_id' => $sessionId,
        ]);

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Get the guard that was used for authentication.
     */
    public function getUsedGuard(): ?string
    {
        return $this->usedGuard;
    }

    /**
     * Ensure the login request is not rate-limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    protected function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'login' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate-limiting throttle key for the request.
     */
    protected function throttleKey(): string
    {
        return Str::transliterate(
            Str::lower($this->input('login')).'|'.$this->ip()
        );
    }
}