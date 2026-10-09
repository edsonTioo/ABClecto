<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Level;
use App\Models\Minigame;
use App\Services\AnalyticsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /** Panel de analítica: top, alertas de refuerzo y errores comunes. */
    public function index(Request $request, AnalyticsService $analytics): Response
    {
        $teacherId = $request->user()?->teacher?->id;
        $groupId = $request->integer('group') ?: null;

        return Inertia::render('teacher/dashboard', [
            'filters' => [
                'groups' => $analytics->groupsFor($teacherId),
                'activeGroup' => $groupId,
            ],
            'top' => $analytics->topStudents($groupId),
            'alerts' => $analytics->alerts($groupId),
            'commonErrors' => $analytics->commonErrors($groupId),
        ]);
    }

    /** CMS de niveles: pestañas por minijuego con sus niveles editables. */
    public function levels(Request $request): Response
    {
        $minigames = Minigame::where('is_active', true)
            ->with(['activities' => fn ($q) => $q->with('level')->orderBy('order')])
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Minigame $m) => [
                'id' => $m->id,
                'slug' => $m->slug,
                'name' => $m->name,
                'icon' => $m->icon,
                'description' => $m->description,
                'activities' => $m->activities->map(fn ($a) => [
                    'id' => $a->id,
                    'order' => $a->order,
                    'difficulty' => $a->difficulty,
                    'is_active' => $a->is_active,
                    'config' => $a->config,
                    'level' => [
                        'id' => $a->level->id,
                        'number' => $a->level->number,
                        'title' => $a->level->title,
                        'module' => $a->level->module,
                        'xp_reward' => $a->level->xp_reward,
                        'coins_reward' => $a->level->coins_reward,
                    ],
                ]),
            ]);

        return Inertia::render('teacher/levels', ['minigames' => $minigames]);
    }

    /** Catálogo de juegos para probarlos desde el panel del profesor. */
    public function catalog(): Response
    {
        $minigames = Minigame::where('is_active', true)
            ->with(['activities' => fn ($q) => $q->where('is_active', true)->with('level')])
            ->orderBy('sort_order')
            ->get()
            ->map(function (Minigame $m) {
                $levels = $m->activities->count();

                return [
                    'id' => $m->id,
                    'slug' => $m->slug,
                    'name' => $m->name,
                    'description' => $m->description,
                    'icon' => $m->icon,
                    'levels' => $levels,
                    'xp' => $levels ? [
                        $m->activities->min('level.xp_reward'),
                        $m->activities->max('level.xp_reward'),
                    ] : [0, 0],
                    'difficulty' => $levels
                        ? (int) round($m->activities->avg('difficulty'))
                        : 1,
                ];
            })
            ->values();

        return Inertia::render('teacher/games', ['minigames' => $minigames]);
    }

    /** Crea un nivel extra para un minijuego (número = siguiente disponible). */
    public function storeLevel(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'minigame_id' => ['required', 'exists:minigames,id'],
            'module' => ['required', 'string', 'max:30'],
            'title' => ['required', 'string', 'max:120'],
            'difficulty' => ['required', 'integer', 'min:1', 'max:5'],
            'config' => ['required', 'array'],
            'xp_reward' => ['required', 'integer', 'min:0'],
            'coins_reward' => ['required', 'integer', 'min:0'],
        ]);

        $nextNumber = (int) Level::where('module', $data['module'])->max('number') + 1;

        $level = Level::create([
            'module' => $data['module'],
            'number' => $nextNumber,
            'title' => $data['title'],
            'xp_reward' => $data['xp_reward'],
            'coins_reward' => $data['coins_reward'],
            'is_active' => true,
        ]);

        $minigame = Minigame::findOrFail($data['minigame_id']);

        $level->activities()->create([
            'minigame_id' => $minigame->id,
            'order' => $minigame->activities()->count(),
            'difficulty' => $data['difficulty'],
            'config' => $data['config'],
            'is_active' => true,
        ]);

        return back()->with('success', "Nivel {$nextNumber} creado en {$minigame->name}.");
    }

    /** Actualiza dificultad, recompensas, contenido o visibilidad de una actividad. */
    public function updateLevel(Request $request, int $activityId): RedirectResponse
    {
        $data = $request->validate([
            'difficulty' => ['required', 'integer', 'min:1', 'max:5'],
            'config' => ['required', 'array'],
            'is_active' => ['required', 'boolean'],
            'title' => ['sometimes', 'string', 'max:120'],
            'xp_reward' => ['sometimes', 'integer', 'min:0'],
            'coins_reward' => ['sometimes', 'integer', 'min:0'],
        ]);

        $activity = Activity::with('level')->findOrFail($activityId);

        $activity->update([
            'difficulty' => $data['difficulty'],
            'config' => $data['config'],
            'is_active' => $data['is_active'],
        ]);

        $activity->level->update([
            'title' => $data['title'] ?? $activity->level->title,
            'xp_reward' => $data['xp_reward'] ?? $activity->level->xp_reward,
            'coins_reward' => $data['coins_reward'] ?? $activity->level->coins_reward,
        ]);

        return back()->with('success', 'Nivel actualizado.');
    }

    /** Elimina una actividad (nivel extra); los niveles base se desactivan. */
    public function destroyLevel(int $activityId): RedirectResponse
    {
        $activity = Activity::with('level')->findOrFail($activityId);
        $level = $activity->level;

        // Si es la única actividad del nivel, elimina el nivel también.
        if ($level->activities()->count() <= 1) {
            $level->delete();
        } else {
            $activity->delete();
        }

        return back()->with('success', 'Nivel eliminado.');
    }
}
