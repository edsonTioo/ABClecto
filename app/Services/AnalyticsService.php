<?php

namespace App\Services;

use App\Models\Attempt;
use App\Models\ErrorLog;
use App\Models\Group;
use App\Models\Student;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function topStudents(?int $groupId = null, int $limit = 10): Collection
    {
        return Student::query()
            ->when($groupId, fn ($q) => $q->where('group_id', $groupId))
            ->where('is_active', true)
            ->with('group:id,name,shift')
            ->orderByDesc('xp')
            ->limit($limit)
            ->get()
            ->map(fn ($student, $index) => [
                'rank' => $index + 1,
                'id' => $student->id,
                'name' => $student->name,
                'xp' => (int) ($student->xp ?? 0),
                'level' => (int) ($student->level ?? 1),
                'streak' => (int) ($student->current_streak ?? 0),
                'group' => $student->group?->name,
                'shift' => $student->group?->shift,
            ])
            ->values();
    }

    public function alerts(?int $groupId = null): Collection
    {
        $since = Carbon::now()->subDays(14);

        $stats = Attempt::query()
            ->when($groupId, function ($q) use ($groupId) {
                $q->whereHas('student', function ($studentQuery) use ($groupId) {
                    $studentQuery->where('group_id', $groupId);
                });
            })
            ->where('created_at', '>=', $since)
            ->groupBy('student_id')
            ->select([
                'student_id',
                DB::raw('COALESCE(SUM(correct_count), 0) as correct'),
                DB::raw('COALESCE(SUM(correct_count + wrong_count), 0) as answered'),
                DB::raw('COUNT(*) as attempts'),
                DB::raw('MAX(created_at) as last_attempt'),
            ])
            ->get()
            ->keyBy('student_id');

        $stuck = Attempt::query()
            ->when($groupId, function ($q) use ($groupId) {
                $q->whereHas('student', function ($studentQuery) use ($groupId) {
                    $studentQuery->where('group_id', $groupId);
                });
            })
            ->where('created_at', '>=', $since)
            ->groupBy([
                'student_id',
                'activity_id',
            ])
            ->havingRaw('COUNT(*) >= 4')
            ->havingRaw('AVG(score) < 70')
            ->select([
                'student_id',
                'activity_id',
                DB::raw('COUNT(*) as attempts'),
                DB::raw('AVG(score) as avg_score'),
            ])
            ->get()
            ->groupBy('student_id');

        return Student::query()
            ->when($groupId, fn ($q) => $q->where('group_id', $groupId))
            ->where('is_active', true)
            ->with('group:id,name,shift')
            ->get()
            ->map(function ($student) use ($stats, $stuck) {

                $stat = $stats->get($student->id);

                $correct = (int) ($stat?->correct ?? 0);
                $answered = (int) ($stat?->answered ?? 0);
                $attempts = (int) ($stat?->attempts ?? 0);

                $accuracy = $answered > 0
                    ? (int) round(($correct / $answered) * 100)
                    : null;

                $lastAttempt = !empty($stat?->last_attempt)
                    ? Carbon::parse($stat->last_attempt)
                    : null;

                $daysInactive = $lastAttempt
                    ? (int) round($lastAttempt->diffInDays(now()))
                    : null;

                $reasons = [];
                $priority = null;

                if (
                    $attempts >= 3 &&
                    $accuracy !== null &&
                    $accuracy < 50
                ) {
                    $reasons[] = "Tasa de acierto baja ({$accuracy}%)";
                    $priority = 'alta';
                }

                $studentStuck = $stuck->get($student->id);

                $stuckRow = $studentStuck
                    ? $studentStuck->sortByDesc('attempts')->first()
                    : null;

                if ($stuckRow) {
                    $avgScore = (int) round((float) ($stuckRow->avg_score ?? 0));
                    $stuckAttempts = (int) ($stuckRow->attempts ?? 0);

                    $reasons[] = sprintf(
                        'Estancado en una actividad (%d%% promedio, %d intentos)',
                        $avgScore,
                        $stuckAttempts
                    );

                    $priority = 'alta';
                }

                if (
                    $daysInactive !== null &&
                    $daysInactive >= 5
                ) {
                    $reasons[] = "Sin jugar desde hace {$daysInactive} días";
                    $priority = $priority ?? 'media';
                } elseif (
                    $attempts >= 3 &&
                    $accuracy !== null &&
                    $accuracy < 70
                ) {
                    $reasons[] = "Precisión mejorable ({$accuracy}%)";
                    $priority = $priority ?? 'media';
                }

                if (empty($reasons)) {
                    return null;
                }

                $weakAreas = ErrorLog::query()
                    ->where('student_id', $student->id)
                    ->where(
                        'created_at',
                        '>=',
                        Carbon::now()->subDays(14)
                    )
                    ->groupBy([
                        'target_type',
                        'target_value',
                    ])
                    ->select([
                        'target_type',
                        'target_value',
                        DB::raw('COUNT(*) as fails'),
                    ])
                    ->orderByDesc('fails')
                    ->limit(4)
                    ->get()
                    ->map(fn ($error) => [
                        'type' => $error->target_type,
                        'value' => $error->target_value,
                        'fails' => (int) ($error->fails ?? 0),
                    ])
                    ->values();

                return [
                    'student_id' => $student->id,
                    'name' => $student->name,
                    'group' => $student->group?->name,
                    'shift' => $student->group?->shift,
                    'level' => (int) ($student->level ?? 1),
                    'xp' => (int) ($student->xp ?? 0),
                    'priority' => $priority,
                    'reasons' => $reasons,
                    'accuracy' => $accuracy,
                    'attempts' => $attempts,
                    'days_inactive' => $daysInactive,
                    'weak_areas' => $weakAreas,
                ];
            })
            ->filter()
            ->sort(function ($a, $b) {

                $priorityOrder = [
                    'alta' => 1,
                    'media' => 2,
                    'baja' => 3,
                    null => 4,
                ];

                $priorityA = $priorityOrder[$a['priority']] ?? 4;
                $priorityB = $priorityOrder[$b['priority']] ?? 4;

                if ($priorityA !== $priorityB) {
                    return $priorityA <=> $priorityB;
                }

                $accuracyA = $a['accuracy'] ?? 101;
                $accuracyB = $b['accuracy'] ?? 101;

                if ($accuracyA !== $accuracyB) {
                    return $accuracyA <=> $accuracyB;
                }

                return ($b['attempts'] ?? 0) <=> ($a['attempts'] ?? 0);
            })
            ->values();
    }

    public function commonErrors(
        ?int $groupId = null,
        int $days = 30,
        int $limit = 15
    ): Collection {
        $days = max(1, $days);
        $limit = max(1, $limit);

        return ErrorLog::query()
            ->when($groupId, function ($q) use ($groupId) {
                $q->whereHas('student', function ($studentQuery) use ($groupId) {
                    $studentQuery->where('group_id', $groupId);
                });
            })
            ->where(
                'created_at',
                '>=',
                Carbon::now()->subDays($days)
            )
            ->groupBy([
                'target_type',
                'target_value',
            ])
            ->select([
                'target_type',
                'target_value',
                DB::raw('COUNT(*) as fails'),
                DB::raw('COUNT(DISTINCT student_id) as students'),
            ])
            ->orderByDesc('fails')
            ->limit($limit)
            ->get()
            ->map(fn ($error) => [
                'type' => $error->target_type,
                'value' => $error->target_value,
                'fails' => (int) ($error->fails ?? 0),
                'students' => (int) ($error->students ?? 0),
            ])
            ->values();
    }

    public function groupsFor(?int $teacherId): Collection
    {
        return Group::query()
            ->when(
                $teacherId,
                fn ($q) => $q->where('teacher_id', $teacherId)
            )
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'shift',
            ]);
    }
}