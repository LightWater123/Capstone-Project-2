<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Carbon\Carbon;

class ActivationToken extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'activation_tokens';

    protected $fillable = [
        'email',
        'token',
        'user_type',
        'user_id',
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
     * Create a new activation token record.
     *
     * @param string $email
     * @param string $token
     * @param string $userType
     * @param string $userId
     * @param int $ttlMinutes Time to live in minutes (default: 1440 = 24 hours)
     * @return static
     */
    public static function createToken(string $email, string $token, string $userType, string $userId, int $ttlMinutes = 1440): static
    {
        return static::create([
            'email' => $email,
            'token' => $token,
            'user_type' => $userType,
            'user_id' => $userId,
            'created_at' => now(),
            'expires_at' => now()->addMinutes($ttlMinutes),
        ]);
    }

    /**
     * Find an activation token by email and user type.
     *
     * @param string $email
     * @param string $userType
     * @return static|null
     */
    public static function findByEmailAndType(string $email, string $userType): ?static
    {
        return static::where('email', $email)
            ->where('user_type', $userType)
            ->first();
    }

    /**
     * Find a valid activation token by token.
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
     * Find a valid activation token by email, token, and user type.
     *
     * @param string $email
     * @param string $token
     * @param string $userType
     * @return static|null
     */
    public static function findValidByEmailAndToken(string $email, string $token, string $userType): ?static
    {
        return static::where('email', $email)
            ->where('token', $token)
            ->where('user_type', $userType)
            ->where('expires_at', '>', now())
            ->first();
    }

    /**
     * Delete activation tokens by email.
     *
     * @param string $email
     * @return int
     */
    public static function deleteByEmail(string $email): int
    {
        return static::where('email', $email)->delete();
    }

    /**
     * Clean up expired activation tokens.
     *
     * @return int
     */
    public static function cleanExpiredTokens(): int
    {
        return static::where('expires_at', '<=', now())->delete();
    }
}