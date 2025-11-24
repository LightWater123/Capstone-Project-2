<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Carbon\Carbon;

class PasswordReset extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'password_resets';

    protected $fillable = [
        'email',
        'token',
        'created_at',
        'expires_at',
    ];

    protected $dates = ['created_at', 'expires_at'];

    /**
     * Check if the token is expired.
     *
     * @return bool
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Create a new password reset token record.
     *
     * @param string $email
     * @param string $token
     * @param int $ttlMinutes Time to live in minutes (default: 60)
     * @return static
     */
    public static function createToken(string $email, string $token, int $ttlMinutes = 60): static
    {
        return static::create([
            'email' => $email,
            'token' => $token,
            'created_at' => now(),
            'expires_at' => now()->addMinutes($ttlMinutes),
        ]);
    }

    /**
     * Find a password reset token by email.
     *
     * @param string $email
     * @return static|null
     */
    public static function findByEmail(string $email): ?static
    {
        return static::where('email', $email)->first();
    }

    /**
     * Find a valid password reset token by token.
     * This method only returns tokens that haven't expired.
     *
     * @param string $token
     * @return static|null
     */
    public static function findValidByToken(string $token): ?static
    {
        return static::where('token', $token)
            ->where('expires_at', '>', now())
            ->first();
    }

    /**
     * Delete a password reset token by email.
     *
     * @param string $email
     * @return int
     */
    public static function deleteByEmail(string $email): int
    {
        return static::where('email', $email)->delete();
    }

    /**
     * Clean up expired password reset tokens.
     *
     * @return int
     */
    public static function cleanExpiredTokens(): int
    {
        return static::where('expires_at', '<=', now())->delete();
    }
}