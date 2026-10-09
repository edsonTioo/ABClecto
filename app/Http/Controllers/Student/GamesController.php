<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Attempt;
use App\Models\Minigame;
use App\Models\StudentProgress;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GamesController extends Controller
{
    /** Hub de minijuegos del estudiante: pestañas por juego + niveles + HUD. */
    public function index(Request $request): Response
    {
        return $this->renderHub($request, preview: false);
    }

    /**
     * Modo prueba del profesor: el mismo hub con todos los niveles abiertos
     * y sin persistir partidas (la sesión marca preview_mode).
     */
    public function preview(Request $request): Response
    {
        $request->session()->put('preview_mode', true);

        $slug = $request->query('juego');

        return $this->renderHub($request, preview: true, initialSlug: is_string($slug) ? $slug : null);
    }

    private function renderHub(Request $request, bool $preview, ?string $initialSlug = null): Response
    {
        $minigames = Minigame::where('is_active', true)
            ->with(['activities' => fn ($query) => $query
                ->where('is_active', true)
                ->orderBy('difficulty')
                ->orderBy('id')
                ->with('level')])
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Minigame $minigame) => [
                'id' => $minigame->id,
                'slug' => $minigame->slug,
                'name' => $minigame->name,
                'description' => $minigame->description,
                'icon' => $minigame->icon,
                'activities' => $minigame->activities
                    ->map(fn ($activity) => [
                        'id' => $activity->id,
                        'level_id' => $activity->level_id,
                        'difficulty' => $activity->difficulty,
                        'level_number' => $activity->level->number,
                        'level_title' => $activity->level->title,
                        'xp_reward' => $activity->level->xp_reward,
                        'coins_reward' => $activity->level->coins_reward,
                        'config' => $activity->config,
                    ])
                    ->values(),
            ])
            ->values();

        // Estudiante autenticado por el middleware "student" (sesión student_id).
        $student = $request->attributes->get('student');

        // Progreso guardado por nivel: con él se reconstruyen los desbloqueos
        // y las estrellas al recargar (antes se perdían y todo volvía a 🔒).
        $progress = $student
            ? StudentProgress::where('student_id', $student->id)->get()->keyBy('level_id')
            : collect();

        $minigames = $minigames->map(function (array $minigame) use ($progress) {
            // Orden estable por número de nivel: los niveles extra creados por el
            // profesor (11, 12, …) aparecen siempre al final de la lista.
            $activities = collect($minigame['activities'])->sortBy('level_number')->values();
            $unlocked = true;

            $minigame['activities'] = $activities->map(function (array $activity) use (&$unlocked, $progress) {
                $best = (int) ($progress->get($activity['level_id'])?->best_score ?? 0);

                $item = $activity + [
                    'best_score' => $best,
                    'unlocked' => $unlocked,
                ];

                // El siguiente nivel se abre cuando éste se aprueba (>= 70).
                $unlocked = $best >= 70;

                return $item;
            })->values();

            return $minigame;
        });

        $player = $student
            ? [
                'id' => $student->id,
                'name' => $student->name,
                'xp' => $student->xp,
                'coins' => $student->coins,
                'level' => $student->level,
                'streak' => $student->current_streak,
            ]
            : ['id' => 0, 'name' => 'Modo prueba', 'xp' => 0, 'coins' => 0, 'level' => 1, 'streak' => 0];

        // Misión diaria: 3 partidas registradas hoy (solo para estudiantes reales).
        $mission = null;
        if (! $preview && $student) {
            $mission = [
                'target' => 3,
                'done' => Attempt::where('student_id', $student->id)->whereDate('created_at', today())->count(),
            ];
        }

        return Inertia::render('student/games', [
            'minigames' => $minigames,
            'player' => $player,
            'preview' => $preview,
            'initialSlug' => $preview ? $initialSlug : null,
            'mission' => $mission,
        ]);
    }
}
