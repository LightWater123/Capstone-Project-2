<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\PdfParserController;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\PasswordController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\PasswordReset;
use App\Http\Controllers\EventController;

// PUBLIC
Route::post('/login',    [AuthenticatedSessionController::class, 'store'])->middleware('api.auth.session');
Route::post('/logout',   [AuthenticatedSessionController::class, 'destroy'])->middleware('api.auth.session');
Route::get('/verifyUser',   [AuthenticatedSessionController::class, 'verify'])->middleware('api.auth.session');
Route::post('/register', [RegisterController::class, 'register'])->middleware('api.auth.session');
Route::post('/forgot-password',  fn(Request $r) => … )->middleware('api.auth.session');
Route::post('/reset-password',   fn(Request $r) => … )->middleware('api.auth.session');


// AUTHENTICATED - Admin routes
Route::middleware(['api.auth.session', 'auth:admin'])->group(function () {
    // user & password
    Route::get('/user', fn(Request $r) => $r->user());
    
    Route::post('/admin/change-password', [PasswordController::class, 'change']);

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
        Route::post('/equipment/{id}/predictive-maintenance', [
            MaintenanceController::class, 'predictiveMaintenance'
        ]);
        Route::get('/inventory/due-soon', [EquipmentController::class, 'dueSoon']);
    });
});

// AUTHENTICATED - Service user routes
Route::middleware(['api.auth.session', 'auth:service'])->group(function () {
    Route::get('/service/user', fn(Request $r) => $r->user());
    Route::get('/my-messages', [MaintenanceController::class,'messages']);
    Route::patch('/maintenance-jobs/{job}/status', [MaintenanceController::class, 'updateStatus']);
    Route::put('/maintenance/{id}/done-details', [MaintenanceController::class, 'setPickupDetails']);
    Route::post('/service/change-password', [PasswordController::class, 'change']);
    Route::post( '/upload/report',      [MaintenanceController::class, 'uploadReport'] );
    Route::patch('/maintenance/{id}/report', [MaintenanceController::class, 'updateReport'] );
    
    Route::get('/service/inventory',                    [MaintenanceController::class, 'serviceIndex']);
    Route::get('/service/inventory/{id}/maintenance',   [EquipmentController::class, 'serviceMaintenance']);
    Route::get('/service/serviceReminder', [MaintenanceController::class, 'getDueForMaintenance']);
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
Route::get('/verify',      [EmailController::class, 'verify']);