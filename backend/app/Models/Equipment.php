<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model; // mongodb support for Eloquent

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
        'category',  // PPE or RPCSP
        'article',
        'description',
        'property_ro',  // or semi-expandable property no (in RPCSP)
        'property_co',  // PPE only, optional since it's likely blank
        'semi_expendable_property_no', // rpcsp only
        'unit',
        'unit_value',
        'recorded_count', // quantity listed in inventory
        'actual_count', // actual count of items
        'remarks',
        'location',
        'condition', // optional, can be null   
        'date_added', // optional, can be null
        'start_date', // optional, can be null
        'end_date', // optional, can be null
        'next_due_date', // predictive maintenance
        'pickup_date', 
        'pickup_location'
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

    // pwede na alisin
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
