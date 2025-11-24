<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Support\Carbon;

class AuditLog extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'audit_logs';
    
    protected $primaryKey = '_id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'username',
        'action_type',
        'resource_type',
        'resource_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'timestamp',
    ];
    
    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'timestamp' => 'datetime',
    ];
    
    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = ['timestamp'];
    
    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;
    
    /**
     * Get the user that performed the action.
     */
    public function user()
    {
        return $this->morphTo();
    }
    
    /**
     * Scope a query to only include logs of a given action type.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $actionType
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActionType($query, $actionType)
    {
        return $query->where('action_type', $actionType);
    }
    
    /**
     * Scope a query to only include logs of a given resource type.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $resourceType
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeResourceType($query, $resourceType)
    {
        return $query->where('resource_type', $resourceType);
    }
    
    /**
     * Scope a query to only include logs of a given user.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $userId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
    
    /**
     * Scope a query to only include logs within a given date range.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $startDate
     * @param  string  $endDate
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('timestamp', [
            Carbon::parse($startDate)->startOfDay(),
            Carbon::parse($endDate)->endOfDay()
        ]);
    }
    
    /**
     * Scope a query to search by username.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $search
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeSearchByUsername($query, $search)
    {
        return $query->where('username', 'like', '%' . $search . '%');
    }
    
    /**
     * Scope a query to search by resource ID.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $search
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeSearchByResourceId($query, $search)
    {
        return $query->where('resource_id', 'like', '%' . $search . '%');
    }
    
    /**
     * Get the formatted timestamp attribute.
     *
     * @param  string  $value
     * @return string
     */
    public function getFormattedTimestampAttribute()
    {
        return $this->timestamp->format('Y-m-d H:i:s');
    }
    
    /**
     * Get the action type with proper formatting.
     *
     * @param  string  $value
     * @return string
     */
    public function getFormattedActionTypeAttribute()
    {
        return ucfirst(strtolower(str_replace('_', ' ', $this->action_type)));
    }
    
    /**
     * Get the difference between old and new values.
     *
     * @return array
     */
    public function getChangesAttribute()
    {
        $changes = [];
        
        if ($this->old_values && $this->new_values) {
            foreach ($this->old_values as $key => $oldValue) {
                if (isset($this->new_values[$key]) && $oldValue != $this->new_values[$key]) {
                    $changes[$key] = [
                        'old' => $oldValue,
                        'new' => $this->new_values[$key]
                    ];
                }
            }
        }
        
        return $changes;
    }
}