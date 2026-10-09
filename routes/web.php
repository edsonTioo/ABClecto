<?php

use App\Models\Activity;
use App\Models\Attempt;
use App\Models\Minigame;
use App\Models\Student;
use App\Http\Controllers\Student\AttemptController;
use App\Http\Controllers\Student\GamesController;
use App\Http\Controllers\Student\StudentLoginController;
use App\Http\Controllers\Teacher\DashboardController;
use App\Http\Controllers\Teacher\StudentAdminController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Acceso infantil: código de clase + PIN.
Route::get('juegos/entrar', [StudentLoginController::class, 'create'])->name('student.login');
// Límite por IP generoso (aula con muchos dispositivos); la fuerza bruta sobre un
// PIN concreto la frena el RateLimiter propio por código dentro del controlador.
Route::post('juegos/entrar', [StudentLoginController::class, 'store'])->middleware('throttle:60,1');
Route::post('juegos/salir', [StudentLoginController::class, 'destroy'])->name('student.logout');

// Módulo del estudiante: hub de minijuegos por pestañas (requiere sesión del estudiante).
Route::middleware('student')->group(function () {
    Route::get('juegos', [GamesController::class, 'index'])->name('games.index');

    // Registra la partida y devuelve XP/monedas actualizadas (JSON).
    Route::post('intentos', [AttemptController::class, 'store'])->name('attempts.store');
});

// Panel del profesor: requiere sesión de usuario con rol teacher.
Route::middleware(['auth', 'teacher'])->prefix('profesor')->name('teacher.')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('niveles', [DashboardController::class, 'levels'])->name('levels');
    Route::post('niveles', [DashboardController::class, 'storeLevel'])->name('levels.store');
    Route::put('niveles/{activity}', [DashboardController::class, 'updateLevel'])->name('levels.update');
    Route::delete('niveles/{activity}', [DashboardController::class, 'destroyLevel'])->name('levels.destroy');

    // Módulo de estudiantes: alta con grado, grupo y turno (código + PIN).
    Route::get('estudiantes', [StudentAdminController::class, 'index'])->name('students');
    Route::post('estudiantes', [StudentAdminController::class, 'store'])->name('students.store');
    Route::put('estudiantes/{student}', [StudentAdminController::class, 'update'])->name('students.update');
    Route::delete('estudiantes/{student}', [StudentAdminController::class, 'destroy'])->name('students.destroy');
    Route::post('grupos', [StudentAdminController::class, 'storeGroup'])->name('groups.store');

    // Catálogo de juegos del profesor + modo prueba (sin persistir partidas).
    Route::get('juegos', [DashboardController::class, 'catalog'])->name('games.catalog');
    Route::get('probar', [GamesController::class, 'preview'])->name('games.preview');
});

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        // Datos reales para las tarjetas del inicio (solo conteos: nada sensible).
        return Inertia::render('dashboard', [
            'stats' => [
                'students' => Student::where('is_active', true)->count(),
                'attempts_today' => Attempt::whereDate('created_at', today())->count(),
                'minigames' => Minigame::where('is_active', true)->count(),
                'levels' => Activity::where('is_active', true)->count(),
            ],
        ]);
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
