<?php

use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Eloquent\Model;

class CreateAuditLogsCollection extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // This migration creates the audit_logs collection in MongoDB
        // The actual schema is defined in the AuditLog model
        // This file is kept for consistency with Laravel migration structure
        
        // Create indexes for better query performance
        $db = app('mongodb')->connection()->db;
        $collection = $db->audit_logs;
        
        // Create index on timestamp for date range queries
        $collection->createIndex(['timestamp' => -1]);
        
        // Create index on user_id for user-specific queries
        $collection->createIndex(['user_id' => 1]);
        
        // Create index on action_type for filtering
        $collection->createIndex(['action_type' => 1]);
        
        // Create index on resource_type for filtering
        $collection->createIndex(['resource_type' => 1]);
        
        // Create compound index for common queries
        $collection->createIndex([
            'user_id' => 1,
            'action_type' => 1,
            'timestamp' => -1
        ]);
        
        // Create text index for search functionality
        $collection->createIndex([
            'username' => 'text',
            'resource_id' => 'text',
            'resource_type' => 'text'
        ], {
            'weights' => [
                'username' => 10,
                'resource_id' => 5,
                'resource_type' => 3
            ],
            'name' => 'audit_search_index'
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Drop the audit_logs collection
        $db = app('mongodb')->connection()->db;
        $db->audit_logs->drop();
        
        // Drop indexes if they exist
        $db->command([
            'dropIndexes' => 'audit_logs',
            'index' => '*'
        ]);
    }
}