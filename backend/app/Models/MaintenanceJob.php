<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class MaintenanceJob extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'maintenance_jobs';

    protected $fillable = [
        '_id',
        'asset_id',
        'asset_name',
        'user_email',
        'scheduled_at',
        'status',
        'remarks',      
        'report_file',  
    ];

    protected $dates = ['scheduled_at'];

    //protected $visible = [
    //    '_id', 'asset_id', 'asset_name', 'user_email', 'scheduled_at', 'status', 'created_at'
    //];
}