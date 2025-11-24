<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AuditLogController extends Controller
{
    /**
     * Display a listing of the audit logs.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = AuditLog::with('user');
        
        // Apply filters
        if ($request->has('action_type')) {
            $query->actionType($request->input('action_type'));
        }
        
        if ($request->has('resource_type')) {
            $query->resourceType($request->input('resource_type'));
        }
        
        if ($request->has('user_id')) {
            $query->user($request->input('user_id'));
        }
        
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange(
                $request->input('start_date'),
                $request->input('end_date')
            );
        }
        
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->searchByUsername($search)
                  ->orWhere('resource_id', 'like', '%' . $search . '%')
                  ->orWhere('resource_type', 'like', '%' . $search . '%');
            });
        }
        
        // Apply sorting
        $query->orderBy('timestamp', 'desc');
        
        // Paginate results
        $perPage = $request->input('per_page', 50);
        $logs = $query->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $logs,
            'message' => 'Audit logs retrieved successfully'
        ]);
    }
    
    /**
     * Display the specified audit log.
     *
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $log = AuditLog::with('user')->find($id);
        
        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Audit log not found'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $log,
            'message' => 'Audit log retrieved successfully'
        ]);
    }
    
    /**
     * Get statistics about audit logs.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function statistics(Request $request)
    {
        $query = AuditLog::query();
        
        // Apply date filter if provided
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange(
                $request->input('start_date'),
                $request->input('end_date')
            );
        } else {
            // Default to last 30 days
            $query->dateRange(
                now()->subDays(30)->format('Y-m-d'),
                now()->format('Y-m-d')
            );
        }
        
        // Get action type statistics
        $actionStats = $query->select('action_type', DB::raw('count(*) as count'))
            ->groupBy('action_type')
            ->get();
        
        // Get resource type statistics
        $resourceStats = $query->select('resource_type', DB::raw('count(*) as count'))
            ->groupBy('resource_type')
            ->get();
        
        // Get daily activity for the last 30 days
        $dailyActivity = $query->select(
                DB::raw('DATE(timestamp) as date'),
                DB::raw('count(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->limit(30)
            ->get();
        
        // Get top users by activity
        $topUsers = $query->select(
                'user_id',
                'username',
                DB::raw('count(*) as activity_count')
            )
            ->groupBy('user_id', 'username')
            ->orderBy('activity_count', 'desc')
            ->limit(10)
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'action_statistics' => $actionStats,
                'resource_statistics' => $resourceStats,
                'daily_activity' => $dailyActivity,
                'top_users' => $topUsers,
                'total_logs' => $query->count()
            ],
            'message' => 'Audit log statistics retrieved successfully'
        ]);
    }
    
    /**
     * Export audit logs to CSV format.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function export(Request $request)
    {
        $query = AuditLog::with('user');
        
        // Apply filters
        if ($request->has('action_type')) {
            $query->actionType($request->input('action_type'));
        }
        
        if ($request->has('resource_type')) {
            $query->resourceType($request->input('resource_type'));
        }
        
        if ($request->has('user_id')) {
            $query->user($request->input('user_id'));
        }
        
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange(
                $request->input('start_date'),
                $request->input('end_date')
            );
        }
        
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->searchByUsername($search)
                  ->orWhere('resource_id', 'like', '%' . $search . '%')
                  ->orWhere('resource_type', 'like', '%' . $search . '%');
            });
        }
        
        $logs = $query->orderBy('timestamp', 'desc')->get();
        
        // Generate CSV content
        $headers = [
            'ID',
            'Username',
            'Action Type',
            'Resource Type',
            'Resource ID',
            'Timestamp',
            'IP Address',
            'Changes'
        ];
        
        $csvContent = implode(',', $headers) . "\n";
        
        foreach ($logs as $log) {
            $changes = json_encode($log->changes);
            $row = [
                $log->_id,
                $log->username,
                $log->action_type,
                $log->resource_type,
                $log->resource_id,
                $log->formatted_timestamp,
                $log->ip_address,
                $changes
            ];
            
            $csvContent .= implode(',', array_map(function ($item) {
                return '"' . str_replace('"', '""', $item) . '"';
            }, $row)) . "\n";
        }
        
        // Generate filename
        $filename = 'audit_logs_' . date('Y-m-d_H-i-s') . '.csv';
        
        return response($csvContent)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }
    
    /**
     * Get available filter options.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function filterOptions()
    {
        $actionTypes = AuditLog::distinct('action_type')->pluck('action_type');
        $resourceTypes = AuditLog::distinct('resource_type')->pluck('resource_type');
        
        return response()->json([
            'success' => true,
            'data' => [
                'action_types' => $actionTypes,
                'resource_types' => $resourceTypes
            ],
            'message' => 'Filter options retrieved successfully'
        ]);
    }
}