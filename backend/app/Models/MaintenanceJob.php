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
        'condition',
        'report_pdf',
        'remarks',

        'admin_email',
        'pickup_date',
        'pickup_place',
    ];

    protected $dates = ['scheduled_at'];

    //protected $visible = [
    //    '_id', 'asset_id', 'asset_name', 'user_email', 'scheduled_at', 'status', 'created_at'
    //];
}