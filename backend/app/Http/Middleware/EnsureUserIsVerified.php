<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EnsureUserIsVerified
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
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Authentication required.'], 401);
        }
        
        if (!$user->is_verified) {
            return response()->json([
                'message' => 'Please verify your email address before accessing this resource.',
                'is_verified' => false
            ], 403);
        }
        
        return $next($request);
    }
}