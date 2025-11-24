<?php

namespace App\Models;

use MongoDB\Laravel\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\LogsAuditable;

class AdminUser extends Authenticatable
{
    use HasApiTokens, LogsAuditable;

    protected $connection = 'mongodb';
    protected $collection = 'admin_users';
    protected $primaryKey = '_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['name', 'username', 'email', 'password', 'mobile_number', 'activation_token', 'is_verified'];
    protected $hidden   = ['password', 'remember_token', 'activation_token'];
    protected $appends  = ['role'];

    public function getRoleAttribute(): string
    {
        return 'admin';
    }
    
    /**
     * Generate a new activation token for the user.
     *
     * @return string
     */
    public function generateActivationToken(): string
    {
        $token = \Illuminate\Support\Str::random(60);
        
        // Delete existing tokens
        \App\Models\ActivationToken::deleteByEmail($this->email);
        
        // Create new token
        \App\Models\ActivationToken::createToken(
            $this->email,
            $token,
            'admin',
            $this->_id,
            1440 // 24 hours
        );
        
        return $token;
    }
    
    /**
     * Verify if the user has a valid activation token.
     *
     * @param string $token
     * @return bool
     */
    public function hasValidActivationToken(string $token): bool
    {
        $activationToken = \App\Models\ActivationToken::findValidByEmailAndToken(
            $this->email,
            $token,
            'admin'
        );
        
        return $activationToken !== null;
    }
    
    /**
     * Mark the user as verified.
     *
     * @return bool
     */
    public function markAsVerified(): bool
    {
        $this->is_verified = true;
        return $this->save();
    }
}