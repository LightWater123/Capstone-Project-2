<?php

namespace App\Models;

use MongoDB\Laravel\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class AdminUser extends Authenticatable
{
    use HasApiTokens;

    protected $connection = 'mongodb';
    protected $collection = 'admin_users';
    protected $primaryKey = '_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['name', 'username', 'email', 'password', 'mobile_number'];
    protected $hidden   = ['password', 'remember_token'];
    protected $appends  = ['role'];

    public function getRoleAttribute(): string
    {
        return 'admin';
    }
}