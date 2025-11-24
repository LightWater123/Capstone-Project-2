<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use App\Traits\LogsAuditable;

class Event extends Model
{
    use LogsAuditable;
    protected $connection = 'mongodb';
    protected $collection = 'events';

    protected $fillable = [
        'id','title', 'start_date', 'end_date', 'color', 'created_by'
    ];
}