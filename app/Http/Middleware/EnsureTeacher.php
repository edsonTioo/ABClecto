<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe el panel /profesor a usuarios con rol "teacher".
 * Se usa junto con el middleware "auth" del starter.
 */
class EnsureTeacher
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return redirect()->route('login');
        }

        if ($user->role !== 'teacher' || ! $user->is_active) {
            abort(403, 'Esta cuenta no tiene acceso al panel del profesor.');
        }

        return $next($request);
    }
}
