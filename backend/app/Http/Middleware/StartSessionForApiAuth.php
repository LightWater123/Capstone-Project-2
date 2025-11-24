<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Session\SessionManager;

class StartSessionForApiAuth
{
    /**
     * The session manager instance.
     *
     * @var \Illuminate\Session\SessionManager
     */
    protected $sessionManager;

    /**
     * Create a new middleware instance.
     *
     * @param  \Illuminate\Session\SessionManager  $sessionManager
     * @return void
     */
    public function __construct(SessionManager $sessionManager)
    {
        $this->sessionManager = $sessionManager;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        // Start session if not already started
        if (!$request->hasSession()) {
            $session = $this->sessionManager->driver();
            $session->start();
            $request->setLaravelSession($session);
        }
        
        return $next($request);
    }
}