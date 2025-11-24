<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AuditLog;
use Carbon\Carbon;

class AuditLogMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        // Log the action if user is authenticated
        if (Auth::check()) {
            $this->logAction($request, $response);
        }
        
        return $response;
    }
    
    /**
     * Log the user action.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Illuminate\Http\Response  $response
     * @return void
     */
    protected function logAction(Request $request, $response)
    {
        $user = Auth::user();
        
        // Skip logging for GET requests (read-only operations)
        if ($request->isMethod('GET')) {
            return;
        }
        
        // Determine action type based on HTTP method and route
        $actionType = $this->determineActionType($request, $response);
        
        // Skip logging if action type is unknown
        if (!$actionType) {
            return;
        }
        
        // Extract resource information
        $resourceInfo = $this->extractResourceInfo($request);
        
        // Prepare audit log data
        $auditData = [
            'user_id' => (string) $user->_id,
            'username' => $user->username,
            'action_type' => $actionType,
            'resource_type' => $resourceInfo['type'],
            'resource_id' => $resourceInfo['id'],
            'old_values' => $this->getOldValues($request),
            'new_values' => $this->getNewValues($request),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
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
     * Determine the action type based on request and response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Illuminate\Http\Response  $response
     * @return string|null
     */
    protected function determineActionType(Request $request, $response)
    {
        $method = $request->method();
        $route = $request->route();
        $routeName = $route->getName();
        $uri = $route->uri();
        
        // Skip logging if route name is not set or is in skip routes
        if (!$routeName && !$uri) {
            return null;
        }
        
        // Check if it's a RESTful API route
        if (strpos($uri, 'api/') === 0) {
            switch ($method) {
                case 'GET':
                    // Only log GET requests if they're not in skip routes
                    // if ($request->route()->hasParameter('id')) {
                    //     return 'VIEW';
                    // }
                    return null;
                    
                case 'POST':
                    // CREATE operations
                    if (strpos($uri, 'api/inventory') !== false && $method === 'POST') {
                        return 'CREATE';
                    }
                    if (strpos($uri, 'api/events') !== false && $method === 'POST') {
                        return 'CREATE';
                    }
                    if (strpos($uri, 'api/maintenance') !== false && strpos($uri, 'schedule') !== false) {
                        return 'CREATE';
                    }
                    if (strpos($uri, 'api/admin') !== false && strpos($uri, 'register') !== false) {
                        return 'CREATE';
                    }
                    return 'CREATE';
                    
                case 'PUT':
                case 'PATCH':
                    // UPDATE operations
                    if (strpos($uri, 'api/inventory') !== false && $request->route()->hasParameter('id')) {
                        return 'UPDATE';
                    }
                    if (strpos($uri, 'api/events') !== false && $request->route()->hasParameter('id')) {
                        return 'UPDATE';
                    }
                    if (strpos($uri, 'api/maintenance') !== false && strpos($uri, 'status') !== false) {
                        return 'UPDATE';
                    }
                    if (strpos($uri, 'api/admin') !== false && strpos($uri, 'change-password') !== false) {
                        return 'UPDATE';
                    }
                    return 'UPDATE';
                    
                case 'DELETE':
                    // DELETE operations
                    if (strpos($uri, 'api/inventory') !== false && $request->route()->hasParameter('id')) {
                        return 'DELETE';
                    }
                    if (strpos($uri, 'api/events') !== false && $request->route()->hasParameter('id')) {
                        return 'DELETE';
                    }
                    if (strpos($uri, 'api/inventory') !== false && strpos($uri, 'bulk-destroy') !== false) {
                        return 'BULK_DELETE';
                    }
                    if (strpos($uri, 'api/inventory') !== false && strpos($uri, 'bulk-restore') !== false) {
                        return 'BULK_RESTORE';
                    }
                    return 'DELETE';
                    
                case 'LOGIN':
                    return 'LOGIN';
                    
                case 'LOGOUT':
                    return 'LOGOUT';
            }
        }
        
        // Handle other routes
        if ($routeName && strpos($routeName, 'login') !== false) {
            return 'LOGIN';
        }
        
        if ($routeName && strpos($routeName, 'logout') !== false) {
            return 'LOGOUT';
        }
        
        if ($routeName && strpos($routeName, 'register') !== false) {
            return 'REGISTER';
        }
        
        if ($routeName && strpos($routeName, 'password') !== false) {
            return 'PASSWORD_CHANGE';
        }
        
        // Default action type
        return 'ACTION';
    }
    
    /**
     * Extract resource information from the request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    protected function extractResourceInfo(Request $request)
    {
        $route = $request->route();
        $uri = $route->uri();
        
        // Determine resource type from URI
        if (strpos($uri, 'api/inventory') !== false) {
            $type = 'Equipment';
        } elseif (strpos($uri, 'api/maintenance') !== false) {
            $type = 'Maintenance';
        } elseif (strpos($uri, 'api/events') !== false) {
            $type = 'Event';
        } elseif (strpos($uri, 'api/auth') !== false) {
            $type = 'Auth';
        } elseif (strpos($uri, 'api/admin') !== false) {
            $type = 'Admin';
        } elseif (strpos($uri, 'api/service') !== false) {
            $type = 'Service';
        } else {
            $type = 'Unknown';
        }
        
        // Extract resource ID if available
        $resourceId = null;
        if ($request->route()->hasParameter('id')) {
            $resourceId = $request->route()->parameter('id');
        } elseif ($request->isMethod('POST') && $request->has('_id')) {
            $resourceId = $request->input('_id');
        }
        
        return [
            'type' => $type,
            'id' => $resourceId
        ];
    }
    
    /**
     * Get old values for update operations.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|null
     */
    protected function getOldValues(Request $request)
    {
        if (!$request->isMethod('PUT') && !$request->isMethod('PATCH')) {
            return null;
        }
        
        // This would typically involve fetching the existing record
        // For now, we'll return null as this would require additional logic
        return null;
    }
    
    /**
     * Get new values from the request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    protected function getNewValues(Request $request)
    {
        $data = $request->except([
            'password',
            'password_confirmation',
            '_token',
            '_method'
        ]);
        
        // Remove sensitive fields
        $sensitiveFields = [
            'password',
            'remember_token',
            'activation_token'
        ];
        
        foreach ($sensitiveFields as $field) {
            unset($data[$field]);
        }
        
        return $data;
    }
}