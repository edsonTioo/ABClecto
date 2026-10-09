<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Acceso infantil: el estudiante entra con su código de clase + PIN de 4 dígitos.
 */
class StudentLoginController extends Controller
{
    /** Muestra el formulario de acceso a los juegos. */
    public function create(): Response
    {
        return Inertia::render('student/login');
    }

    /** Valida código + PIN y crea la sesión del estudiante. */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'login_code' => ['required', 'string', 'max:20'],
            'pin' => ['required', 'string', 'regex:/^[0-9]{4}$/'],
        ], [
            'login_code.required' => 'Escribe tu código de clase.',
            'pin.required' => 'Escribe tu PIN de 4 dígitos.',
            'pin.regex' => 'El PIN tiene 4 dígitos.',
        ]);

        // Bloqueo temporal por código + IP: frena la fuerza bruta sobre el PIN.
        $throttleKey = 'student-login:'.Str::upper(Str::transliterate($data['login_code'])).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return back()
                ->withErrors(['login_code' => "Demasiados intentos. Espera {$seconds} segundos e inténtalo otra vez."])
                ->onlyInput('login_code');
        }

        $student = Student::query()
            ->where('is_active', true)
            ->whereRaw('upper(login_code) = ?', [strtoupper($data['login_code'])])
            ->first();

        // Mensaje idéntico exista o no el código (evita descubrir usuarios) y
        // hash falso para que el tiempo de respuesta tampoco delate al alumno.
        $hash = $student?->pin_hash ?? '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
        $valid = $student !== null
            && $student->pin_hash !== null
            && Hash::check($data['pin'], $hash);

        if (! $valid) {
            RateLimiter::hit($throttleKey, 60);

            return back()
                ->withErrors(['login_code' => 'Código o PIN incorrecto. Pídele ayuda a tu maestro.'])
                ->onlyInput('login_code');
        }

        RateLimiter::clear($throttleKey);

        $request->session()->regenerate();
        $request->session()->put('student_id', $student->id);
        $request->session()->forget('preview_mode'); // por si el profesor probó juegos antes

        return redirect()->route('games.index');
    }

    /** Cierra la sesión del estudiante. */
    public function destroy(Request $request): RedirectResponse
    {
        // Solo cierra la sesión del estudiante (no la del profesor si comparte navegador).
        $request->session()->forget('student_id');
        $request->session()->regenerate();

        return redirect()->route('student.login');
    }
}
