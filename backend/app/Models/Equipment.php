<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model; // You are correctly using the official package's model

class Equipment extends Model
{
    protected $connection = 'mongodb';
    protected $table = 'inventory';

    protected $primaryKey = '_id';
    public $incrementing = false;
    protected $keyType = 'string';

    // Fields that can be mass-assigned through controller
    protected $fillable = [
        '_id',
        'category',
        'article',
        'description',
        'property_ro',
        'property_co',
        'semi_expendable_property_no',
        'unit',
        'unit_value',
        'recorded_count',
        'actual_count',
        'remarks',
        'location',
        'condition',
        'date_added',
        'start_date',
        'end_date',
        'pickup_date', 
        'pickup_location',
        
        // fields for predictive maintenance
        'install_date',          // The start date for our prediction calculations.
        'daily_usage_hours',     // How many hours it runs on an active day.
        'operating_days',        // The array of active days, e.g., [1, 2, 3, 4, 5].
        'total_run_hours',       // The calculated "odometer" of the machine.
        'last_run_update',       // A timestamp of when the prediction was last run.
        'next_due_date',         // prediction result
        'max_usage_hours',
        'max_time_days',
    ];

    // handles the datatype for those fillable fields
    protected $casts = [
        'unit_value' => 'float',
        'recorded_count' => 'integer',
        'actual_count' => 'integer',
        'date_added' => 'datetime',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'pickup_date' => 'datetime',
        'install_date' => 'datetime',
        'last_run_update' => 'datetime',
        'next_due_date' => 'datetime',
        'daily_usage_hours' => 'float',
        'operating_days' => 'array',
        'total_run_hours' => 'float',
    ];

    protected $appends =[
        'shortage_or_overage_qty',
        'shortage_or_overage_val',
        'formatted_property_number'
    ];

    public function getShortageOrOverageQtyAttribute()
    {
        // Calculate shortage or overage quantity
        return $this->recorded_count - $this->actual_count;
    }

    public function getShortageOrOverageValAttribute()
    {
        // Calculate shortage or overage value
        return $this->shortage_or_overage_qty * $this->unit_value;
    }

    public function getFormattedPropertyNumberAttribute()
    {
        // Format property number based on category
        if ($this->category === 'PPE') {
            return "RO-". $this->property_ro . " / CO-" . $this->property_co;
        }
        elseif($this->category === 'RPCSP') {
            return "SE-" . $this->semi_expendable_property_no;
        }
        return null; 
    }
}