<?php

namespace App\Models;

use MongoDB\Laravel\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class ServiceUser extends Authenticatable
{
    use HasApiTokens;

    protected $connection = 'mongodb';
    protected $collection = 'service_users';
    protected $primaryKey = '_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name','company_name','username', 'email', 'password', 'mobile_number',
        'address', 'service_type',
    ];

    protected $hidden = ['password', 'remember_token'];
    protected $appends = ['role'];

    public const SERVICE_TYPES = ['Vehicle', 'Appliances', 'ICT Equipment'];

    public function getRoleAttribute(): string
    {
        return 'service_user';
    }

    public function getServiceTypes(): array
    {
        return self::SERVICE_TYPES;
    }

    public function hasServiceType($type): bool
    {
        return $this->service_type === $type;
    }
}