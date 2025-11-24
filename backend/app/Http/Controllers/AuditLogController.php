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
        if ($request->has('action_type') && strlen($request->input('action_type')) > 0) {
            $query->actionType($request->input('action_type'));
        }
        
        if ($request->has('resource_type') && strlen($request->input('resource_type')) > 0) {
            $query->resourceType($request->input('resource_type'));
        }
        
        if ($request->has('user_id') && strlen($request->input('user_id')) > 0) {
            $query->user($request->input('user_id'));
        }
        
        if ($request->has('start_date') && $request->has('end_date') &&
            strlen($request->input('start_date')) > 0 && strlen($request->input('end_date')) > 0) {
            $query->dateRange(
                $request->input('start_date'),
                $request->input('end_date')
            );
        }
        
        if ($request->has('search') && strlen($request->input('search')) > 0) {
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
        \Log::info(['id' => $id]);
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
        // Build the base aggregation pipeline
        $matchStage = [];
        
        // Apply date filter if provided
        if ($request->has('start_date') && $request->has('end_date') &&
            strlen($request->input('start_date')) > 0 && strlen($request->input('end_date')) > 0) {
            $startDate = Carbon::parse($request->input('start_date'))->startOfDay()->toDateTimeString();
            $endDate = Carbon::parse($request->input('end_date'))->endOfDay()->toDateTimeString();
            $matchStage['timestamp'] = ['$gte' => $startDate, '$lte' => $endDate];
        } else {
            // Default to last 30 days
            $startDate = now()->subDays(30)->startOfDay()->toDateTimeString();
            $endDate = now()->endOfDay()->toDateTimeString();
            $matchStage['timestamp'] = ['$gte' => $startDate, '$lte' => $endDate];
        }
        
        // Get action type statistics
        $actionStats = AuditLog::raw(function($collection) use ($matchStage) {
            return $collection->aggregate([
                ['$match' => $matchStage],
                ['$group' => [
                    '_id' => '$action_type',
                    'count' => ['$sum' => 1]
                ]]
            ]);
        });
        
        // Get resource type statistics
        $resourceStats = AuditLog::raw(function($collection) use ($matchStage) {
            return $collection->aggregate([
                ['$match' => $matchStage],
                ['$group' => [
                    '_id' => '$resource_type',
                    'count' => ['$sum' => 1]
                ]]
            ]);
        });
        
        // Get daily activity for the last 30 days
        $dailyActivity = AuditLog::raw(function($collection) use ($matchStage) {
            return $collection->aggregate([
                ['$match' => $matchStage],
                [
                    '$group' => [
                        '_id' => [
                            'year' => ['$year' => '$timestamp'],
                            'month' => ['$month' => '$timestamp'],
                            'day' => ['$dayOfMonth' => '$timestamp']
                        ],
                        'count' => ['$sum' => 1]
                    ]
                ],
                [
                    '$project' => [
                        '_id' => 0,
                        'date' => [
                            '$concat' => [
                                ['$toString' => '$_id.year'],
                                '-',
                                ['$toString' => '$_id.month'],
                                '-',
                                ['$toString' => '$_id.day']
                            ]
                        ],
                        'count' => 1
                    ]
                ],
                ['$sort' => ['date' => -1]],
                ['$limit' => 30]
            ]);
        });
        
        // Get top users by activity
        $topUsers = AuditLog::raw(function($collection) use ($matchStage) {
            return $collection->aggregate([
                ['$match' => $matchStage],
                ['$group' => [
                    '_id' => [
                        'user_id' => '$user_id',
                        'username' => '$username'
                    ],
                    'activity_count' => ['$sum' => 1]
                ]],
                ['$sort' => ['activity_count' => -1]],
                ['$limit' => 10],
                ['$project' => [
                    '_id' => 0,
                    'user_id' => '$_id.user_id',
                    'username' => '$_id.username',
                    'activity_count' => 1
                ]]
            ]);
        });
        
        // Get total logs count
        $totalLogs = AuditLog::raw(function($collection) use ($matchStage) {
            return $collection->countDocuments($matchStage);
        });
        
        return response()->json([
            'success' => true,
            'data' => [
                'action_statistics' => $actionStats,
                'resource_statistics' => $resourceStats,
                'daily_activity' => $dailyActivity,
                'top_users' => $topUsers,
                'total_logs' => $totalLogs
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
        if ($request->has('action_type') && strlen($request->input('action_type')) > 0) {
            $query->actionType($request->input('action_type'));
        }
        
        if ($request->has('resource_type') && strlen($request->input('resource_type')) > 0) {
            $query->resourceType($request->input('resource_type'));
        }
        
        if ($request->has('user_id') && strlen($request->input('user_id')) > 0) {
            $query->user($request->input('user_id'));
        }
        
        if ($request->has('start_date') && $request->has('end_date') &&
            strlen($request->input('start_date')) > 0 && strlen($request->input('end_date')) > 0) {
            $query->dateRange(
                $request->input('start_date'),
                $request->input('end_date')
            );
        }
        
        if ($request->has('search') && strlen($request->input('search')) > 0) {
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
                $log->getFormattedTimestampAttribute(),
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