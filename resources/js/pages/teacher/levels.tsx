import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type InertiaPayload } from '@/types/inertia';
import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface LevelInfo {
    id: number;
    number: number;
    title: string;
    module: string;
    xp_reward: number;
    coins_reward: number;
}

interface Activity {
    id: number;
    order: number;
    difficulty: number;
    is_active: boolean;
    config: Record<string, unknown>;
    level: LevelInfo;
}

interface Minigame {
    id: number;
    slug: string;
    name: string;
    icon: string;
    description: string;
    activities: Activity[];
}

interface LevelsProps {
    minigames: Minigame[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Niveles de juegos', href: '/profesor/niveles' },
];

/** Módulo al que pertenece cada minijuego (para crear niveles extra). */
const MODULE_BY_SLUG: Record<string, string> = {
    'sombras-letras': 'abecedario',
    'sopa-letras': 'silabas',
    'match-visual': 'palabras',
    construccion: 'oraciones',
    completar: 'oraciones',
    comprension: 'comprension',
};

/** Formato de texto ↔ config JSON según el minijuego. */
function configToText(slug: string, config: Record<string, unknown>): string {
    switch (slug) {
        case 'sopa-letras':
            return ((config.words as string[]) ?? []).join('\n');
        case 'sombras-letras':
            return ((config.letters as string[]) ?? []).join('\n');
        case 'construccion':
            return [config.word ?? '', config.sentence ?? ''].join('\n');
        case 'completar':
            return ((config.items as { prompt: string; answer: string; options: string[] }[]) ?? [])
                .map((i) => `${i.prompt} | ${i.answer} | ${i.options.join(',')}`)
                .join('\n');
        case 'match-visual':
            return ((config.pairs as { emoji: string; word: string }[]) ?? [])
                .map((p) => `${p.emoji} | ${p.word}`)
                .join('\n');
        case 'comprension':
            return [
                `TÍTULO: ${config.title ?? ''}`,
                String(config.text ?? ''),
                ...((config.questions as { question: string; options: string[]; correct: string }[]) ?? []).map(
                    (q) => `${q.question} | ${q.options.join(',')} | ${q.correct}`,
                ),
            ].join('\n');
        default:
            return JSON.stringify(config, null, 2);
    }
}

function textToConfig(slug: string, text: string, extra: Record<string, unknown>): Record<string, unknown> {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    switch (slug) {
        case 'sopa-letras':
            return { ...extra, words: lines.map((w) => w.toUpperCase()) };
        case 'sombras-letras':
            return { ...extra, letters: lines.map((l) => l.toUpperCase()) };
        case 'construccion': {
            const cfg: Record<string, unknown> = { ...extra, word: (lines[0] ?? '').toUpperCase() };
            if (lines[1]) cfg.sentence = lines[1].toUpperCase();
            return cfg;
        }
        case 'completar':
            return {
                ...extra,
                items: lines.map((line) => {
                    const [prompt, answer, options] = line.split('|').map((s) => s.trim());
                    return {
                        prompt,
                        answer,
                        options: (options ?? '').split(',').map((s) => s.trim()).filter(Boolean),
                    };
                }),
            };
        case 'match-visual':
            return {
                ...extra,
                pairs: lines.map((line) => {
                    const [emoji, word] = line.split('|').map((s) => s.trim());
                    return { emoji, word: (word ?? '').toUpperCase() };
                }),
            };
        case 'comprension': {
            const titleLine = lines.find((l) => l.startsWith('TÍTULO:'));
            const title = titleLine ? titleLine.replace('TÍTULO:', '').trim() : (extra.title as string);
            const questionLines = lines.filter((l) => l.includes('|') && !l.startsWith('TÍTULO:'));
            // La lectura es el primer bloque sin '|' después del título.
            const textIndex = lines.findIndex((l) => !l.includes('|') && !l.startsWith('TÍTULO:'));
            const reading = textIndex >= 0 ? lines[textIndex] : '';
            return {
                ...extra,
                title,
                text: reading,
                questions: questionLines.map((line) => {
                    const [question, options, correct] = line.split('|').map((s) => s.trim());
                    return {
                        question,
                        options: (options ?? '').split(',').map((s) => s.trim()).filter(Boolean),
                        correct,
                    };
                }),
            };
        }
        default:
            return extra;
    }
}

function hintFor(slug: string): string {
    switch (slug) {
        case 'sopa-letras':
            return 'Una palabra por línea (se colocan en el rompecabezas).';
        case 'sombras-letras':
            return 'Una letra por línea (la sombra de cada una es una ronda).';
        case 'construccion':
            return 'Línea 1: palabra a formar. Línea 2 (opcional): oración con las palabras.';
        case 'completar':
            return 'Formato: enunciado | respuesta | op1,op2,op3  (usa ___ para el hueco)';
        case 'match-visual':
            return 'Formato: emoji | PALABRA';
        case 'comprension':
            return 'Línea 1: TÍTULO: ... · Línea 2: lectura · Después: pregunta | op1,op2,op3 | correcta';
        default:
            return '';
    }
}

interface Draft {
    activityId: number | null; // null = crear nivel nuevo
    title: string;
    difficulty: number;
    xp: number;
    coins: number;
    isActive: boolean;
    text: string;
    grid: number;
}

export default function Levels({ minigames }: LevelsProps) {
    const [activeSlug, setActiveSlug] = useState(minigames[0]?.slug ?? '');
    const [draft, setDraft] = useState<Draft | null>(null);
    const [creating, setCreating] = useState(false);

    const active = minigames.find((m) => m.slug === activeSlug) ?? minigames[0];
    const activities = useMemo(
        () => [...(active?.activities ?? [])].sort((a, b) => a.level.number - b.level.number),
        [active],
    );

    const openEdit = (a: Activity) => {
        setCreating(false);
        setDraft({
            activityId: a.id,
            title: a.level.title,
            difficulty: a.difficulty,
            xp: a.level.xp_reward,
            coins: a.level.coins_reward,
            isActive: a.is_active,
            text: configToText(active.slug, a.config),
            grid: (a.config.grid as number) ?? 8,
        });
    };

    const openCreate = () => {
        setCreating(true);
        setDraft({
            activityId: null,
            title: `${active.name} - Nivel extra`,
            difficulty: 3,
            xp: 80,
            coins: 20,
            isActive: true,
            text: '',
            grid: 8,
        });
    };

    const save = () => {
        if (!draft || !active) return;
        const extra: Record<string, unknown> = {};
        if (active.slug === 'sopa-letras') extra.grid = draft.grid;
        if (active.slug === 'construccion' && draft.text.split('\n')[1]) {
            extra.sentence = draft.text.split('\n')[1].toUpperCase();
        }
        const config = textToConfig(active.slug, draft.text, extra);

        if (draft.activityId !== null) {
            router.put(
                route('teacher.levels.update', draft.activityId),
                {
                    difficulty: draft.difficulty,
                    config,
                    is_active: draft.isActive,
                    title: draft.title,
                    xp_reward: draft.xp,
                    coins_reward: draft.coins,
                } as unknown as InertiaPayload,
                { preserveScroll: true, onSuccess: () => setDraft(null) },
            );
        } else {
            router.post(
                route('teacher.levels.store'),
                {
                    minigame_id: active.id,
                    module: MODULE_BY_SLUG[active.slug] ?? 'palabras',
                    title: draft.title,
                    difficulty: draft.difficulty,
                    config,
                    xp_reward: draft.xp,
                    coins_reward: draft.coins,
                } as unknown as InertiaPayload,
                { preserveScroll: true, onSuccess: () => setDraft(null) },
            );
        }
    };

    const remove = (a: Activity) => {
        if (!confirm(`¿Eliminar el nivel ${a.level.number}?`)) return;
        router.delete(route('teacher.levels.destroy', a.id), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Niveles de juegos" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">📚 Editor de niveles</h1>
                        <p className="text-sm font-semibold text-slate-500">
                            10 niveles por modo de juego · edita palabras, letras, lecturas y dificultad.
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-black text-white shadow-lg transition active:scale-95"
                    >
                        <Plus className="size-4" /> Agregar nivel extra
                    </button>
                </div>

                {/* Pestañas por minijuego */}
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {minigames.map((g) => (
                        <button
                            key={g.slug}
                            onClick={() => setActiveSlug(g.slug)}
                            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition ${
                                g.slug === activeSlug
                                    ? 'bg-slate-900 text-white shadow'
                                    : 'bg-white text-slate-500 shadow-sm hover:bg-slate-50'
                            }`}
                        >
                            <span>{g.icon}</span> {g.name}
                            <span className={`rounded-full px-2 py-0.5 text-xs ${g.slug === activeSlug ? 'bg-white/20' : 'bg-slate-100'}`}>
                                {g.activities.length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Lista de niveles */}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {activities.map((a) => (
                        <div
                            key={a.id}
                            className={`rounded-2xl border bg-white p-4 shadow-sm transition ${a.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <span className="inline-flex size-9 items-center justify-center rounded-xl bg-violet-100 text-base font-black text-violet-700">
                                        {a.level.number}
                                    </span>
                                    <p className="mt-2 font-bold text-slate-800">{a.level.title}</p>
                                    <p className="text-xs font-semibold text-slate-400">
                                        {a.level.module} · dificultad {'●'.repeat(a.difficulty)}
                                        {!a.is_active && ' · oculto'}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openEdit(a)}
                                        className="rounded-lg bg-slate-100 p-2 text-slate-500 transition hover:bg-violet-100 hover:text-violet-600"
                                        title="Editar"
                                    >
                                        <Pencil className="size-4" />
                                    </button>
                                    <button
                                        onClick={() => remove(a)}
                                        className="rounded-lg bg-slate-100 p-2 text-slate-500 transition hover:bg-red-100 hover:text-red-600"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-bold">
                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                                    +{a.level.xp_reward} XP
                                </span>
                                <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                                    +{a.level.coins_reward} 🪙
                                </span>
                                <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">
                                    {previewOf(active.slug, a.config)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal de edición */}
            {draft && active && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
                        <h2 className="text-xl font-black text-slate-800">
                            {creating ? `➕ Nuevo nivel en ${active.name}` : `✏️ Editar nivel · ${active.name}`}
                        </h2>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <label className="flex flex-col gap-1 text-sm font-bold text-slate-600">
                                Título del nivel
                                <input
                                    value={draft.title}
                                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                    className="rounded-xl border border-slate-200 px-3 py-2 font-semibold"
                                />
                            </label>
                            <label className="flex flex-col gap-1 text-sm font-bold text-slate-600">
                                Dificultad (1-5)
                                <select
                                    value={draft.difficulty}
                                    onChange={(e) => setDraft({ ...draft, difficulty: Number(e.target.value) })}
                                    className="rounded-xl border border-slate-200 px-3 py-2 font-semibold"
                                >
                                    {[1, 2, 3, 4, 5].map((d) => (
                                        <option key={d} value={d}>
                                            {'●'.repeat(d)} {d}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1 text-sm font-bold text-slate-600">
                                Recompensa XP
                                <input
                                    type="number"
                                    value={draft.xp}
                                    onChange={(e) => setDraft({ ...draft, xp: Number(e.target.value) })}
                                    className="rounded-xl border border-slate-200 px-3 py-2 font-semibold"
                                />
                            </label>
                            <label className="flex flex-col gap-1 text-sm font-bold text-slate-600">
                                Monedas 🪙
                                <input
                                    type="number"
                                    value={draft.coins}
                                    onChange={(e) => setDraft({ ...draft, coins: Number(e.target.value) })}
                                    className="rounded-xl border border-slate-200 px-3 py-2 font-semibold"
                                />
                            </label>
                            {active.slug === 'sopa-letras' && (
                                <label className="flex flex-col gap-1 text-sm font-bold text-slate-600">
                                    Tamaño del tablero
                                    <input
                                        type="number"
                                        min={5}
                                        max={14}
                                        value={draft.grid}
                                        onChange={(e) => setDraft({ ...draft, grid: Number(e.target.value) })}
                                        className="rounded-xl border border-slate-200 px-3 py-2 font-semibold"
                                    />
                                </label>
                            )}
                            <label className="flex flex-col gap-1 text-sm font-bold text-slate-600">
                                Visibilidad
                                <select
                                    value={draft.isActive ? '1' : '0'}
                                    onChange={(e) => setDraft({ ...draft, isActive: e.target.value === '1' })}
                                    className="rounded-xl border border-slate-200 px-3 py-2 font-semibold"
                                >
                                    <option value="1">Visible para estudiantes</option>
                                    <option value="0">Oculto</option>
                                </select>
                            </label>
                        </div>

                        <label className="mt-4 flex flex-col gap-1 text-sm font-bold text-slate-600">
                            Contenido del nivel
                            <span className="text-xs font-semibold text-slate-400">{hintFor(active.slug)}</span>
                            <textarea
                                value={draft.text}
                                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                                rows={10}
                                spellCheck={false}
                                className="rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm"
                                placeholder={hintFor(active.slug)}
                            />
                        </label>

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                onClick={() => setDraft(null)}
                                className="rounded-full border-2 border-slate-200 px-6 py-2.5 font-bold text-slate-500 transition hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={save}
                                className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2.5 font-black text-white shadow-lg transition active:scale-95"
                            >
                                💾 Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

function previewOf(slug: string, config: Record<string, unknown>): string {
    switch (slug) {
        case 'sopa-letras':
            return `${((config.words as string[]) ?? []).length} palabras`;
        case 'sombras-letras':
            return `${((config.letters as string[]) ?? []).length} letras`;
        case 'construccion':
            return String(config.word ?? '');
        case 'completar':
            return `${((config.items as unknown[]) ?? []).length} desafíos`;
        case 'match-visual':
            return `${((config.pairs as unknown[]) ?? []).length} parejas`;
        case 'comprension':
            return `${((config.questions as unknown[]) ?? []).length} preguntas`;
        default:
            return '';
    }
}
