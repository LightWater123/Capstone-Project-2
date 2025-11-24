<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use App\Traits\LogsAuditable;

class Maintenance extends Model
{
    use LogsAuditable;
    protected $table = 'maintenanceCalendar';

    protected $dates = ['due_date'];

    protected $fillable = [
        'asset_id',          // ← add this
        'article',
        'description',
        'due_date',
        'status',
        'service_user_email',
    ];

    /* ----  inverse relationship  ---- */
    public function equipment()
    {
        return $this->belongsTo(Equipment::class, 'asset_id', 'asset_id');
    }
}