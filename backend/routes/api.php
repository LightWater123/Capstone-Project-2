<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\PdfParserController;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\ActivationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\PasswordReset;
use App\Http\Controllers\EventController;
use App\Http\Middleware\EnsureUserIsVerified;

// PUBLIC
Route::post('/login',    [AuthenticatedSessionController::class, 'store'])->middleware('api.auth.session');
Route::post('/logout',   [AuthenticatedSessionController::class, 'destroy'])->middleware('api.auth.session');
Route::get('/verifyUser',   [AuthenticatedSessionController::class, 'verify'])->middleware('api.auth.session');
Route::post('/register', [RegisterController::class, 'register'])->middleware('api.auth.session');
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->middleware('api.auth.session');
Route::post('/reset-password', [NewPasswordController::class, 'store'])->middleware('api.auth.session');
Route::post('/validate-reset-token', [PasswordResetLinkController::class, 'showResetForm'])->middleware('api.auth.session');
Route::get('/validate-reset-token', [PasswordResetLinkController::class, 'showResetForm'])->middleware('api.auth.session');


// AUTHENTICATED - Admin routes
Route::middleware(['api.auth.session', 'auth:admin', EnsureUserIsVerified::class])->group(function () {
    // user & password
    Route::get('/user', fn(Request $r) => $r->user());
    
    Route::post('/admin/change-password', [PasswordController::class, 'change']);
    
    // Audit log routes
    Route::prefix('audit')->group(function () {
        Route::get('/logs', [\App\Http\Controllers\AuditLogController::class, 'index']);
        Route::get('/logs/{id}', [\App\Http\Controllers\AuditLogController::class, 'show']);
        Route::get('/logs/statistics', [\App\Http\Controllers\AuditLogController::class, 'statistics']);
        Route::get('/logs/filter-options', [\App\Http\Controllers\AuditLogController::class, 'filterOptions']);
        Route::get('/logs/export', [\App\Http\Controllers\AuditLogController::class, 'export']);
    });

    // calendar
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);
    Route::put('/events/{id}', [EventController::class, 'update']);
    Route::get('/events/maintenance', [EventController::class, 'maintenanceEvents']);
    Route::get('/events/reminders', [EventController::class, 'reminderEvents']);

    // inventory
    Route::apiResource('inventory', EquipmentController::class)
         ->only(['index','store','update','destroy']);

    // pdf parse
    Route::post('parse-pdf', [PdfParserController::class, 'parse']);
    // bulk delete
    Route::post('inventory/bulk-destroy', [EquipmentController::class, 'bulkDestroy']);
    Route::post('inventory/bulk-restore', [EquipmentController::class, 'bulkRestore']);

    // admin maintenance
    Route::prefix('maintenance')->group(function () {
        Route::get('/schedule',      [MaintenanceController::class, 'index']);
        Route::post('/schedule',     [MaintenanceController::class, 'store']);
        Route::get('/not-done-schedule',     [MaintenanceController::class, 'notDone']);
        Route::get('/admin/messages',[MaintenanceController::class, 'sent']);
        Route::get('/due-for-maintenance', [MaintenanceController::class, 'getDueForMaintenance']);
        Route::get('/overdue', [MaintenanceController::class, 'getOverdue']);
        Route::post('/equipment/{id}/predictive-maintenance', [
            MaintenanceController::class, 'predictiveMaintenance'
        ]);
        Route::get('/inventory/due-soon', [EquipmentController::class, 'dueSoon']);
    });
});

// AUTHENTICATED - Service user routes
Route::middleware(['api.auth.session', 'auth:service', EnsureUserIsVerified::class])->group(function () {
    Route::get('/service/user', fn(Request $r) => $r->user());
    Route::get('/my-messages', [MaintenanceController::class,'messages']);
    Route::put('/maintenance/{id}/done-details', [MaintenanceController::class, 'setPickupDetails']);
    Route::post('/service/change-password', [PasswordController::class, 'change']);
    Route::post( '/upload/report',      [MaintenanceController::class, 'uploadReport'] );
    Route::patch('/maintenance/{id}/report', [MaintenanceController::class, 'updateReport'] );
    
    Route::get('/service/inventory',                    [MaintenanceController::class, 'serviceIndex']);
    Route::get('/service/inventory/{id}/maintenance',   [EquipmentController::class, 'serviceMaintenance']);
    Route::get('/service/serviceReminder', [MaintenanceController::class, 'getDueForMaintenance']);
});

// Route that allows both admin and service users
Route::middleware(['api.auth.session'])->group(function () {
    Route::patch('/maintenance-jobs/{job}/status', [MaintenanceController::class, 'updateStatus']);
    Route::patch('/maintenance-jobs/{job}/condition', [MaintenanceController::class, 'updateCondition']);
    Route::delete('/maintenance-jobs/{job}', [MaintenanceController::class, 'destroy']);
});

// PUBLIC - No authentication required

// admin and service user view report
Route::middleware(['api.auth.session'])->group(function () {
    Route::get('pdf/{id}/{t?}', [MaintenanceController::class, 'showPdf'])->name('pdf.view');
    Route::get("/inventory/gen", [EquipmentController::class, 'buildPdf']);
});

// // SERVICE-ONLY INVENTORY VIEWS (protected by auth:service middleware)
// Route::prefix('service')->group(function () {
//     Route::get('inventory',                    [MaintenanceController::class, 'serviceIndex']);
//     Route::get('inventory/{id}/maintenance',   [EquipmentController::class, 'serviceMaintenance']);
//     Route::get('/serviceReminder', [MaintenanceController::class, 'getDueForMaintenance']);
// })->middleware(['auth:service']);

// EMAIL
Route::post('/send-email', [EmailController::class, 'sendEmail']);
Route::post('/send-followup-email', [EmailController::class, 'sendFollowupEmail']);
Route::get('/verify',      [EmailController::class, 'verify']);

// ACCOUNT ACTIVATION
Route::get('/activate', [ActivationController::class, 'verify']);
Route::post('/resend-activation', [ActivationController::class, 'resend']);
