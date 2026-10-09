<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Módulo de estudiantes: alta de alumnos con grado, grupo y turno,
 * código de clase + PIN para entrar a los juegos, y su historial básico.
 */
class StudentAdminController extends Controller
{
    /** Lista de grupos y estudiantes del profesor. */
    public function index(Request $request): Response
    {
        $teacherId = $request->user()?->teacher?->id;

        return Inertia::render('teacher/students', [
            'students' => Student::with('group:id,name,shift')
                ->orderBy('name')
                ->get()
                ->map(fn (Student $s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'age' => $s->age,
                    'grade' => $s->grade,
                    'login_code' => $s->login_code,
                    'group_id' => $s->group_id,
                    'group' => $s->group?->name,
                    'shift' => $s->group?->shift,
                    'xp' => $s->xp,
                    'level' => $s->level,
                    'is_active' => $s->is_active,
                    'has_pin' => $s->pin_hash !== null,
                ]),
            'groups' => Group::query()
                ->where('is_active', true)
                ->when($teacherId, fn ($q) => $q->where('teacher_id', $teacherId))
                ->withCount('students')
                ->orderBy('name')
                ->get(['id', 'name', 'shift', 'grade', 'join_code']),
        ]);
    }

    /** Crea un estudiante y le asigna grupo/turno + código + PIN. */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'age' => ['required', 'integer', 'between:4,12'],
            'grade' => ['required', 'string', 'max:30'],
            'group_id' => ['required', 'exists:groups,id'],
            'pin' => ['required', 'string', 'regex:/^[0-9]{4}$/'],
            'login_code' => ['nullable', 'string', 'max:20', 'regex:/^[A-Za-z0-9_-]+$/', 'unique:students,login_code'],
        ], [
            'pin.regex' => 'El PIN debe tener 4 dígitos.',
            'login_code.regex' => 'El código solo puede tener letras, números, guiones o guion bajo.',
            'login_code.unique' => 'Ese código ya está en uso.',
        ]);

        $student = Student::create([
            'group_id' => $data['group_id'],
            'name' => $data['name'],
            'age' => $data['age'],
            'grade' => $data['grade'],
            'login_code' => $data['login_code'] ?? $this->generateCode($data['name']),
            'pin_hash' => Hash::make($data['pin']),
            'xp' => 0,
            'coins' => 0,
            'level' => 1,
            'current_streak' => 0,
            'longest_streak' => 0,
            'is_active' => true,
        ]);

        return back()->with('success', "{$student->name} creado con código {$student->login_code}.");
    }

    /** Actualiza datos, grupo/turno, PIN o estado del estudiante. */
    public function update(Request $request, Student $student): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'age' => ['required', 'integer', 'between:4,12'],
            'grade' => ['required', 'string', 'max:30'],
            'group_id' => ['required', 'exists:groups,id'],
            'is_active' => ['required', 'boolean'],
            'pin' => ['nullable', 'string', 'regex:/^[0-9]{4}$/'],
            'new_code' => ['nullable', 'string', 'max:20', 'regex:/^[A-Za-z0-9_-]+$/', 'unique:students,login_code'],
        ], [
            'pin.regex' => 'El PIN debe tener 4 dígitos.',
            'new_code.unique' => 'Ese código ya está en uso.',
        ]);

        $student->update([
            'name' => $data['name'],
            'age' => $data['age'],
            'grade' => $data['grade'],
            'group_id' => $data['group_id'],
            'is_active' => $data['is_active'],
            'login_code' => $data['new_code'] ?: $student->login_code,
        ]);

        if (! empty($data['pin'])) {
            $student->pin_hash = Hash::make($data['pin']);
            $student->save();
        }

        return back()->with('success', "Datos de {$student->name} actualizados.");
    }

    /**
     * Elimina al estudiante; si ya tiene partidas se desactiva en su lugar
     * para no borrar la analítica del profesor.
     */
    public function destroy(Student $student): RedirectResponse
    {
        if ($student->attempts()->exists()) {
            $student->update(['is_active' => false]);

            return back()->with('success', "{$student->name} tenía historial: se desactivó en lugar de eliminarlo.");
        }

        $student->delete();

        return back()->with('success', 'Estudiante eliminado.');
    }

    /** Crea un grupo/turno nuevo para asignar estudiantes. */
    public function storeGroup(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:40'],
            'shift' => ['required', 'in:matutino,vespertino,nocturno'],
            'grade' => ['required', 'string', 'max:30'],
        ]);

        $group = Group::create([
            'teacher_id' => $request->user()?->teacher?->id,
            'name' => $data['name'],
            'shift' => $data['shift'],
            'grade' => $data['grade'],
            'join_code' => $this->generateJoinCode(),
            'is_active' => true,
        ]);

        return back()->with('success', "Grupo {$group->name} ({$group->shift}) creado con código {$group->join_code}.");
    }

    /** Código de clase legible: primeras letras del nombre + dígitos únicos. */
    private function generateCode(string $name): string
    {
        $base = Str::upper(Str::ascii(Str::limit($name, 4, '')));

        do {
            $code = $base.str_pad((string) random_int(1, 99), 2, '0', STR_PAD_LEFT);
        } while (Student::where('login_code', $code)->exists());

        return $code;
    }

    private function generateJoinCode(): string
    {
        do {
            $code = Str::upper(Str::random(6));
        } while (Group::where('join_code', $code)->exists());

        return $code;
    }
}
