<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Services\GamificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AttemptController extends Controller
{
    /**
     * Registra el resultado de una partida: XP, monedas, errores y progreso.
     * El estudiante viene de la sesión (middleware "student").
     */
    public function store(Request $request, GamificationService $gamification): RedirectResponse
    {
        // Modo prueba del profesor: nunca escribir en la analítica real.
        if ($request->session()->get('preview_mode')) {
            abort(403, 'Estás en modo prueba: las partidas no se guardan.');
        }

        $data = $request->validate([
            'activity_id' => ['required', 'exists:activities,id'],
            'correct' => ['required', 'integer', 'min:0'],
            'total' => ['required', 'integer', 'min:1'],
            'mistakes' => ['required', 'integer', 'min:0'],
            'errors' => ['sometimes', 'array'],
            'errors.*.type' => ['required_with:errors', 'string', 'max:30'],
            'errors.*.value' => ['required_with:errors', 'string', 'max:40'],
            'errors.*.kind' => ['nullable', 'string', 'max:40'],
            'duration_ms' => ['nullable', 'integer', 'min:0'],
        ]);

        $student = $request->attributes->get('student');
        abort_unless($student !== null, 403, 'Sesión de estudiante requerida.');
        $activity = Activity::with('level')->findOrFail($data['activity_id']);

        $gamification->recordAttempt($student, $activity, $data);
        $student->refresh();

        // Inertia exige una respuesta Inertia (redirect o render): devolver JSON
        // aquí rompía la petición con "a plain JSON response was received".
        // El estudiante ve la tarjeta de recompensa que ya pinta el cliente y
        // el HUD se actualiza con los props frescos del servidor al volver.
        return back()->with('reward', [
            'xp' => $student->xp,
            'coins' => $student->coins,
            'level' => $student->level,
            'streak' => $student->current_streak,
        ]);
    }
}
