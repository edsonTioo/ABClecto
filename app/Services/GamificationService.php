<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Attempt;
use App\Models\ErrorLog;
use App\Models\Level;
use App\Models\Student;
use App\Models\StudentProgress;
use Illuminate\Support\Carbon;

/**
 * Otorga XP/monedas, registra intentos, errores y progreso de nivel.
 */
class GamificationService
{
    /**
     * @param  array  $payload  {correct, total, mistakes, errors: [{type, value}], duration_ms}
     * @return array{attempt: Attempt, xp: int, coins: int, level: int, stars: int}
     */
    public function recordAttempt(Student $student, Activity $activity, array $payload): array
    {
        $correct = (int) ($payload['correct'] ?? 0);
        $total = max(1, (int) ($payload['total'] ?? 1));
        $mistakes = (int) ($payload['mistakes'] ?? 0);
        $score = (int) round(($correct / $total) * 100);
        $stars = $this->stars($score, $mistakes);

        // Recompensas proporcionales al nivel (solo si aprueba: >=70%).
        $xp = $score >= 70 ? (int) round($activity->level->xp_reward * ($stars / 3)) : 0;
        $coins = $score >= 70 ? (int) round($activity->level->coins_reward * ($stars / 3)) : 0;

        $attempt = Attempt::create([
            'student_id' => $student->id,
            'activity_id' => $activity->id,
            'score' => $score,
            'correct_count' => $correct,
            'wrong_count' => $total - $correct,
            'duration_ms' => $payload['duration_ms'] ?? null,
            'is_completed' => $score >= 70,
            'xp_earned' => $xp,
            'coins_earned' => $coins,
            'details' => ['mistakes' => $mistakes, 'stars' => $stars],
        ]);

        // Log de errores por letra/sílaba/palabra (alimenta el reporte del profesor).
        foreach ($payload['errors'] ?? [] as $error) {
            ErrorLog::create([
                'student_id' => $student->id,
                'attempt_id' => $attempt->id,
                'activity_id' => $activity->id,
                'target_type' => $error['type'] ?? 'palabra',
                'target_value' => mb_substr($error['value'] ?? '', 0, 40),
                'error_kind' => $error['kind'] ?? 'intento_fallido',
            ]);
        }

        // Actualizar monedas/XP del estudiante.
        $student->increment('xp', $xp);
        $student->increment('coins', $coins);

        // Nivel derivado del XP total (misma fórmula que las semillas):
        // nivel = floor(sqrt(xp / 100)) + 1 → así "sube de nivel" al ganar XP.
        $calculatedLevel = (int) floor(sqrt(max(0, $student->xp) / 100)) + 1;
        if ($calculatedLevel !== $student->level) {
            $student->level = $calculatedLevel;
            $student->save();
        }

        // Racha diaria.
        $today = Carbon::today()->toDateString();
        if ($student->last_active_at?->toDateString() !== $today) {
            $yesterday = Carbon::yesterday()->toDateString();
            $newStreak = $student->last_active_at?->toDateString() === $yesterday
                ? $student->current_streak + 1
                : 1;
            $student->forceFill([
                'current_streak' => $newStreak,
                'longest_streak' => max($student->longest_streak, $newStreak),
                'last_active_at' => Carbon::today(),
            ])->save();
        }

        // Progreso por nivel.
        $progress = StudentProgress::firstOrCreate(
            ['student_id' => $student->id, 'level_id' => $activity->level_id],
            ['status' => 'en_curso'],
        );
        $progress->increment('attempts_count');
        $progress->best_score = max($progress->best_score, $score);
        $progress->total_xp += $xp;
        $progress->last_played_at = now();

        if ($score >= 70) {
            $progress->status = 'completado';
            $progress->completed_at ??= now();
            // Desbloquear el siguiente nivel del mismo módulo.
            $next = Level::where('module', $activity->level->module)
                ->where('number', '>', $activity->level->number)
                ->where('is_active', true)
                ->orderBy('number')
                ->first();
            if ($next) {
                StudentProgress::firstOrCreate(
                    ['student_id' => $student->id, 'level_id' => $next->id],
                    ['status' => 'disponible'],
                );
            }
        } elseif ($progress->status === 'bloqueado') {
            $progress->status = 'en_curso';
        }

        $progress->save();

        return [
            'attempt' => $attempt,
            'xp' => $xp,
            'coins' => $coins,
            'level' => $student->fresh()->level,
            'stars' => $stars,
        ];
    }

    private function stars(int $score, int $mistakes): int
    {
        if ($score >= 100 && $mistakes === 0) {
            return 3;
        }

        return $score >= 70 ? 2 : 1;
    }
}
