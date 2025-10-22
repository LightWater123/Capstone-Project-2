<?php

namespace App\Models;

// 1. THIS IS THE CORRECT 'use' STATEMENT FOR YOUR PACKAGE
use MongoDB\Laravel\Eloquent\Model;

// 2. Your class EXTENDS the model from your package
class EquipmentType extends Model
{
    /**
     * The database connection that should be used by the model.
     *
     * @var string
     */
    protected $connection = 'mongodb';
    
    /**
     * The collection associated with the model.
     *
     * @var string
     */
    protected $collection = 'equipment_types'; 

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'default_max_usage_hours',
        'default_max_time_days',
    ];

    /**
     * This relationship function is IDENTICAL.
     * Your package and the jenssegers package handle relationships the same way.
     */
    public function equipment()
    {
        return $this->hasMany(Equipment::class, 'equipment_type_id', '_id');
    }
}