<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

trait LogsAuditable
{
    /**
     * Boot the trait.
     *
     * @return void
     */
    protected static function bootLogsAuditable()
    {
        static::created(function ($model) {
            static::logActivity($model, 'CREATE');
        });
        
        static::updated(function ($model) {
            static::logActivity($model, 'UPDATE');
        });
        
        static::deleted(function ($model) {
            static::logActivity($model, 'DELETE');
        });
    }
    
    /**
     * Log the activity for the model.
     *
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @param  string  $actionType
     * @return void
     */
    protected static function logActivity($model, $actionType)
    {
        if (!Auth::check()) {
            return;
        }
        
        $user = Auth::user();
        
        // Prepare audit log data
        $auditData = [
            'user_id' => (string) $user->_id,
            'username' => $user->username,
            'action_type' => $actionType,
            'resource_type' => class_basename($model),
            'resource_id' => (string) $model->_id,
            'old_values' => $actionType === 'UPDATE' ? static::getOldValues($model) : null,
            'new_values' => $actionType === 'UPDATE' ? static::getNewValues($model) : $model->getAttributes(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'timestamp' => Carbon::now(),
        ];
        
        // Create audit log entry
        try {
            AuditLog::create($auditData);
        } catch (\Exception $e) {
            // Log error but don't fail the request
            \Log::error('Failed to create audit log: ' . $e->getMessage());
        }
    }
    
    /**
     * Get old values for update operations.
     *
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @return array
     */
    protected static function getOldValues($model)
    {
        $oldValues = [];
        
        // Get the original attributes before update
        $original = $model->getOriginal();
        
        // Get the updated attributes
        $attributes = $model->getAttributes();
        
        // Compare and get changed values
        foreach ($attributes as $key => $value) {
            if (isset($original[$key]) && $original[$key] != $value) {
                $oldValues[$key] = $original[$key];
            }
        }
        
        return $oldValues;
    }
    
    /**
     * Get new values for update operations.
     *
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @return array
     */
    protected static function getNewValues($model)
    {
        $newValues = [];
        
        // Get the updated attributes
        $attributes = $model->getAttributes();
        
        // Get the original attributes before update
        $original = $model->getOriginal();
        
        // Compare and get changed values
        foreach ($attributes as $key => $value) {
            if (!isset($original[$key]) || $original[$key] != $value) {
                // Skip sensitive fields
                if (in_array($key, ['password', 'remember_token', 'activation_token'])) {
                    continue;
                }
                
                $newValues[$key] = $value;
            }
        }
        
        return $newValues;
    }
    
    /**
     * Log a custom action for the model.
     *
     * @param  string  $actionType
     * @param  array  $additionalData
     * @return void
     */
    public function logCustomAction($actionType, $additionalData = [])
    {
        if (!Auth::check()) {
            return;
        }
        
        $user = Auth::user();
        
        // Prepare audit log data
        $auditData = array_merge([
            'user_id' => (string) $user->_id,
            'username' => $user->username,
            'action_type' => $actionType,
            'resource_type' => class_basename($this),
            'resource_id' => (string) $this->_id,
            'old_values' => null,
            'new_values' => null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'timestamp' => Carbon::now(),
        ], $additionalData);
        
        // Create audit log entry
        try {
            AuditLog::create($auditData);
        } catch (\Exception $e) {
            // Log error but don't fail the request
            \Log::error('Failed to create audit log: ' . $e->getMessage());
        }
    }
}