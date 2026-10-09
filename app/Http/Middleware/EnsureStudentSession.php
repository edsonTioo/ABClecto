<?php

namespace App\Http\Middleware;

use App\Models\Student;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Exige sesión de estudiante (student_id en la sesión) para los juegos.
 * Guarda el estudiante resuelto en $request->attributes bajo "student".
 */
class EnsureStudentSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $studentId = $request->session()->get('student_id');
        $student = $studentId ? Student::find($studentId) : null;

        if ($student === null || ! $student->is_active) {
            $request->session()->forget('student_id');

            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return response()->json(['message' => 'Sesión de estudiante requerida'], 401);
            }

            return redirect()->route('student.login');
        }

        $request->attributes->set('student', $student);

        return $next($request);
    }
}
