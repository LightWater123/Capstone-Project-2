<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Event extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'events';

    protected $fillable = [
        'id','title', 'start_date', 'end_date', 'color', 'created_by'
    ];
}