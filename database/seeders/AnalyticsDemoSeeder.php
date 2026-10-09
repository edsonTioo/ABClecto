<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\Attempt;
use App\Models\ErrorLog;
use App\Models\Group;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Datos demo del panel del profesor:
 *  - profesor (profe@abcleto.test / password) con su grupo matutino
 *  - 8 estudiantes con distintos perfiles de rendimiento
 *  - intentos de los últimos 14 días + logs de errores
 *
 * limpia attempts/error_logs/students/groups demo antes de recrear.
 */
class AnalyticsDemoSeeder extends Seeder
{
    public function run(): void
    {
        ErrorLog::query()->delete();
        Attempt::query()->delete();
        Student::query()->delete();
        Group::query()->delete();

        $user = User::updateOrCreate(
            ['email' => 'profe@abcleto.test'],
            ['name' => 'Profe. María', 'password' => Hash::make('password'), 'role' => 'teacher'],
        );

        $teacher = Teacher::updateOrCreate(
            ['user_id' => $user->id],
            ['school_name' => 'Escuela Primaria ABCleto', 'title' => 'Docente de Español'],
        );

        $group = Group::updateOrCreate(
            ['join_code' => 'MATUTINO1'],
            [
                'teacher_id' => $teacher->id,
                'name' => '2º A',
                'shift' => 'matutino',
                'grade' => '2º Primaria',
                'is_active' => true,
            ],
        );

        // Perfil: [nombre, edad, xp base, días activo, precisión 0-1, letras que falla]
        $roster = [
            ['Sofi', 7, 340, 5, 0.92, []],
            ['Diego', 7, 520, 6, 0.95, []],
            ['Valeria', 8, 460, 4, 0.88, ['RR']],
            ['Mateo', 7, 380, 5, 0.85, ['LL']],
            ['Lucía', 7, 300, 3, 0.80, ['B']],
            ['Emiliano', 8, 210, 3, 0.62, ['R', 'RR', 'R']],
            ['Regina', 7, 150, 2, 0.45, ['L', 'L', 'LL', 'B']],
            ['Samuel', 7, 90, 0, 0.40, ['V', 'B', 'V', 'D']],  // inactivo hace 8 días
        ];

        $activities = Activity::with('level')->where('is_active', true)->get();
        if ($activities->isEmpty()) {
            $this->command?->warn('No hay actividades: ejecuta GamesDemoSeeder primero.');

            return;
        }

        foreach ($roster as $index => [$name, $age, $xp, $activeDays, $accuracy, $weakLetters]) {
            $student = Student::create([
                'group_id' => $group->id,
                'name' => $name,
                'age' => $age,
                'grade' => '2º Primaria',
                // Código predecible para la demo (SOFI01, DIEG02, …) y PIN 1234.
                'login_code' => strtoupper(Str::ascii(mb_substr($name, 0, 4))).str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                'pin_hash' => Hash::make('1234'),
                'xp' => $xp,
                'coins' => (int) round($xp / 4),
                'level' => (int) floor(sqrt($xp / 100)) + 1,
                'current_streak' => $activeDays,
                'longest_streak' => $activeDays + 2,
                'last_active_at' => $name === 'Samuel'
                    ? now()->subDays(8)
                    : now()->subDays(max(0, 5 - $activeDays)),
                'is_active' => true,
            ]);

            // Intentos: un intento/día durante los días activos (Samuel: detenido hace 8 días).
            $days = $name === 'Samuel' ? [8, 9, 10] : range(0, max(0, min(6, $activeDays)));
            $weakIdx = 0;

            foreach ($days as $dayOffset) {
                $dailyRounds = random_int(1, 3);
                for ($r = 0; $r < $dailyRounds; $r++) {
                    $activity = $activities->random();
                    $total = random_int(3, 6);
                    $correct = 0;
                    $wrongItems = [];
                    for ($i = 0; $i < $total; $i++) {
                        if (random_int(1, 100) <= (int) round($accuracy * 100)) {
                            $correct++;
                        } else {
                            $wrongItems[] = $i;
                        }
                    }

                    $score = (int) round(($correct / $total) * 100);
                    $xpEarned = $score >= 70 ? (int) round($activity->level->xp_reward / 2) : 0;

                    $attempt = Attempt::create([
                        'student_id' => $student->id,
                        'activity_id' => $activity->id,
                        'score' => $score,
                        'correct_count' => $correct,
                        'wrong_count' => $total - $correct,
                        'duration_ms' => random_int(20000, 90000),
                        'is_completed' => $score >= 70,
                        'xp_earned' => $xpEarned,
                        'coins_earned' => (int) ($xpEarned / 4),
                        'details' => ['stars' => $score >= 100 ? 3 : ($score >= 70 ? 2 : 1)],
                        'created_at' => now()->subDays($dayOffset)->subHours(random_int(1, 6)),
                    ]);

                    // Errores: los estudiantes con dificultades fallan sus letras débiles.
                    foreach ($wrongItems as $i) {
                        $value = $weakLetters
                            ? $weakLetters[($weakIdx++) % count($weakLetters)]
                            : chr(random_int(65, 90));
                        ErrorLog::create([
                            'student_id' => $student->id,
                            'attempt_id' => $attempt->id,
                            'activity_id' => $activity->id,
                            'target_type' => mb_strlen($value) > 1 ? 'silaba' : 'letra',
                            'target_value' => $value,
                            'error_kind' => 'confusion_visual',
                            'created_at' => $attempt->created_at,
                        ]);
                    }
                }
            }

            // Estancamiento para Regina: 5 intentos en la misma actividad con puntaje bajo.
            if ($name === 'Regina') {
                $stuckActivity = $activities->where('level.module', 'silabas')->first() ?? $activities->first();
                for ($i = 0; $i < 5; $i++) {
                    $attempt = Attempt::create([
                        'student_id' => $student->id,
                        'activity_id' => $stuckActivity->id,
                        'score' => random_int(30, 55),
                        'correct_count' => 2,
                        'wrong_count' => 3,
                        'duration_ms' => random_int(60000, 120000),
                        'is_completed' => false,
                        'xp_earned' => 0,
                        'coins_earned' => 0,
                        'details' => ['stuck_demo' => true],
                        'created_at' => now()->subDays($i)->subHours(2),
                    ]);
                    ErrorLog::create([
                        'student_id' => $student->id,
                        'attempt_id' => $attempt->id,
                        'activity_id' => $stuckActivity->id,
                        'target_type' => 'letra',
                        'target_value' => 'L',
                        'error_kind' => 'confusion_visual',
                        'created_at' => $attempt->created_at,
                    ]);
                }
            }
        }
    }
}
