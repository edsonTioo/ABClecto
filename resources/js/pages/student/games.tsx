import { playTap, playVictory } from '@/games/audio';
import FillBlank from '@/games/FillBlank';
import LetterBuilder from '@/games/LetterBuilder';
import MatchVisual from '@/games/MatchVisual';
import ReadingTrivia from '@/games/ReadingTrivia';
import ShadowLetters from '@/games/ShadowLetters';
import { type Activity, type GameResult, type Minigame, type Player } from '@/games/types';
import WordSearch from '@/games/WordSearch';
import { type InertiaPayload } from '@/types/inertia';
import { Head, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface GamesProps {
    minigames: Minigame[];
    player: Player;
    /** Modo prueba del profesor: no persiste partidas y abre todo. */
    preview?: boolean;
    initialSlug?: string | null;
    /** Progreso de la misión diaria (solo estudiantes reales). */
    mission?: { target: number; done: number } | null;
}

const GAME_COMPONENTS: Record<string, React.ComponentType<{ activity: Activity; onFinished: (r: GameResult) => void }>> = {
    'sopa-letras': WordSearch,
    'sombras-letras': ShadowLetters,
    construccion: LetterBuilder,
    completar: FillBlank,
    'match-visual': MatchVisual,
    comprension: ReadingTrivia,
};

const TAB_STYLES: Record<string, string> = {
    'sopa-letras': 'from-amber-400 to-orange-500 shadow-amber-300',
    'sombras-letras': 'from-indigo-400 to-violet-500 shadow-indigo-300',
    construccion: 'from-orange-400 to-amber-500 shadow-orange-300',
    completar: 'from-teal-400 to-emerald-500 shadow-teal-300',
    'match-visual': 'from-rose-400 to-pink-500 shadow-rose-300',
    comprension: 'from-sky-400 to-blue-500 shadow-sky-300',
};

/** Estrellas ganadas según precisión y errores. */
function starsFor(result: GameResult): number {
    const accuracy = result.total > 0 ? result.correct / result.total : 0;
    if (accuracy >= 1 && result.mistakes === 0) return 3;
    if (accuracy >= 0.7) return 2;
    return 1;
}

/** Nivel del jugador derivado del XP total (misma fórmula que el servidor). */
function levelFromXp(xp: number): number {
    return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}

/** Estrellas guardadas a partir del mejor puntaje registrado. */
function starsFromScore(best: number): number {
    if (best >= 100) return 3;
    if (best >= 70) return 2;
    if (best > 0) return 1;
    return 0;
}

/** Frases motivacionales que rotan cada día. */
const CHEERS = [
    '¡Tú puedes! 💪',
    'Cada intento te hace más fuerte ⭐',
    'Lo importante es seguir practicando 🚀',
    'Hoy es un gran día para aprender 🌈',
    'Eres valiente: atrévete a equivocarte 🦁',
    'Paso a paso se llega lejos 🐢',
    'Tu esfuerzo se nota, ¡sigue así! 🎈',
];

/** Elogio según las estrellas ganadas. */
const PRAISE: Record<number, { title: string; line: string }> = {
    3: { title: '¡PERFECTO! 🌟', line: '¡No fallaste ni una, eres increíble!' },
    2: { title: '¡Muy bien! 🎉', line: '¡Casi perfecto! Una más y lo logras.' },
    1: { title: '¡Buen intento! 💪', line: 'Los errores también enseñan: ¡inténtalo otra vez!' },
};

export default function Games({ minigames, player, preview = false, initialSlug, mission }: GamesProps) {
    const [activeSlug, setActiveSlug] = useState(initialSlug && minigames.some((g) => g.slug === initialSlug) ? initialSlug : minigames[0]?.slug ?? '');
    const [activityIndex, setActivityIndex] = useState(0);
    const [gameKey, setGameKey] = useState(0);
    const [result, setResult] = useState<{ stars: number; xp: number; coins: number; result: GameResult } | null>(null);
    const [hud, setHud] = useState({ xp: player.xp, coins: player.coins, streak: player.streak });
    const [levelUp, setLevelUp] = useState<number | null>(null);

    // Aviso de subida de nivel cuando el XP cruza el umbral (100 XP por nivel).
    const computedLevel = levelFromXp(hud.xp);
    const prevLevel = useRef(computedLevel);
    useEffect(() => {
        if (computedLevel > prevLevel.current) setLevelUp(computedLevel);
        prevLevel.current = computedLevel;
    }, [computedLevel]);
    useEffect(() => {
        if (levelUp === null) return;
        const timer = setTimeout(() => setLevelUp(null), 4000);
        return () => clearTimeout(timer);
    }, [levelUp]);

    const active = minigames.find((g) => g.slug === activeSlug) ?? minigames[0];
    const activities = active?.activities ?? [];
    const current: Activity | undefined = activities[activityIndex];

    // Nivel desbloqueado = se completó el anterior (o es el primero).
    // En modo prueba del profesor todos están abiertos.
    // El servidor envía `unlocked` por actividad: así la progresión sobrevive a la recarga.
    const [completed, setCompleted] = useState<Record<string, number>>(() => {
        const map: Record<string, number> = {};
        for (const game of minigames) {
            game.activities.forEach((act, i) => {
                const stars = starsFromScore(act.best_score ?? 0);
                if (stars > 0) map[`${game.slug}:${i}`] = stars;
            });
        }
        return map;
    });
    const isUnlocked = (index: number) => {
        if (preview) return true;
        const act = activities[index];
        if (act && typeof act.unlocked === 'boolean') return act.unlocked;
        return index === 0 || (completed[`${activeSlug}:${index - 1}`] ?? 0) > 0;
    };

    useEffect(() => {
        setActivityIndex(0);
        setResult(null);
        setGameKey((k) => k + 1);
    }, [activeSlug]);

    // Tras registrar un intento, Inertia re-renderiza con player real del servidor.
    useEffect(() => {
        setHud({ xp: player.xp, coins: player.coins, streak: player.streak });
    }, [player.xp, player.coins, player.streak]);

    const Game = active ? GAME_COMPONENTS[active.slug] : null;

    const handleFinished = (gameResult: GameResult) => {
        if (!current || result) return;
        const stars = starsFor(gameResult);
        const xp = current.xp_reward;
        const coins = current.coins_reward;
        playVictory();
        setHud((h) => ({ ...h, xp: h.xp + xp, coins: h.coins + coins }));
        setCompleted((c) => ({ ...c, [`${activeSlug}:${activityIndex}`]: Math.max(c[`${activeSlug}:${activityIndex}`] ?? 0, stars) }));
        setResult({ stars, xp, coins, result: gameResult });

        // Persiste la partida: intento, XP real, monedas, progreso y errores
        // (error_logs alimenta el panel "Top necesita ayuda" del profesor).
        if (!preview) {
            router.post(
                route('attempts.store'),
                {
                    activity_id: current.id,
                    correct: gameResult.correct,
                    total: gameResult.total,
                    mistakes: gameResult.mistakes,
                    errors: gameResult.errors ?? [],
                } as unknown as InertiaPayload,
                { preserveScroll: true },
            );
        }
    };

    const goNext = () => {
        playTap();
        setResult(null);
        if (activityIndex + 1 < activities.length) {
            setActivityIndex(activityIndex + 1);
        } else {
            setActivityIndex(0);
        }
        setGameKey((k) => k + 1);
    };

    const xpIntoLevel = hud.xp % 100;

    return (
        <div className="min-h-screen bg-gradient-to-b from-violet-50 via-sky-50 to-emerald-50">
            <Head title="Mis Juegos" />

            {/* ============ HUD ============ */}
            <header className="sticky top-0 z-30 border-b-4 border-white/60 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
                    <div className="relative">
                        <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-500 text-3xl shadow-lg">
                            🦸
                        </div>
                        <span className="absolute -top-1 -right-1 rounded-full bg-amber-400 px-1.5 text-xs font-black text-amber-950">
                            {levelFromXp(hud.xp)}
                        </span>
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-violet-900">¡Hola, {player.name}! 👋</p>
                        <div className="mt-1 flex items-center gap-2">
                            <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-200">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400"
                                    initial={false}
                                    animate={{ width: `${xpIntoLevel}%` }}
                                    transition={{ type: 'spring', stiffness: 60 }}
                                />
                            </div>
                            <span className="text-xs font-black text-emerald-600">{xpIntoLevel}/100 XP</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <motion.span
                            key={hud.coins}
                            initial={{ scale: 1.4 }}
                            animate={{ scale: 1 }}
                            className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-black text-amber-700"
                        >
                            🪙 {hud.coins}
                        </motion.span>
                        <span className="rounded-full bg-rose-100 px-3 py-1.5 text-sm font-black text-rose-600">🔥 {hud.streak}</span>
                        <button
                            onClick={() => router.post(route('student.logout'))}
                            title="Salir"
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-500 transition hover:bg-slate-200"
                        >
                            ⬅️ Salir
                        </button>
                    </div>
                </div>
            </header>

            {/* ============ MOTIVACIÓN: frase del día, misión y modo prueba ============ */}
            <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 pt-4">
                <span className="rounded-full border-2 border-violet-100 bg-white px-3 py-1.5 text-xs font-black text-violet-600">
                    💬 {CHEERS[new Date().getDate() % CHEERS.length]}
                </span>
                {preview && (
                    <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-700">
                        👁️ MODO PRUEBA · no se guarda
                    </span>
                )}
                {mission &&
                    (mission.done >= mission.target ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">
                            🎯 ¡Misión cumplida! 🏆
                        </span>
                    ) : (
                        <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-black text-sky-700">
                            🎯 Misión de hoy: {mission.done}/{mission.target} partidas
                        </span>
                    ))}
            </div>

            {/* ============ AVISO DE SUBIDA DE NIVEL ============ */}
            <AnimatePresence>
                {levelUp !== null && (
                    <motion.div
                        key={levelUp}
                        initial={{ opacity: 0, y: -24, scale: 0.6 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                        className="fixed top-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-lg font-black text-white shadow-2xl"
                    >
                        🎉 ¡Subiste al nivel {levelUp}!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ============ PESTAÑAS ============ */}
            <nav className="mx-auto max-w-5xl px-4 pt-5">
                <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    {minigames.map((game) => {
                        const isActive = game.slug === activeSlug;
                        const done = game.activities.filter((_, i) => (completed[`${game.slug}:${i}`] ?? 0) > 0).length;
                        return (
                            <button
                                key={game.slug}
                                onClick={() => {
                                    playTap();
                                    setActiveSlug(game.slug);
                                }}
                                className={`relative flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-base font-black transition ${
                                    isActive
                                        ? `bg-gradient-to-r ${TAB_STYLES[game.slug]} text-white shadow-lg`
                                        : 'bg-white text-slate-500 shadow hover:bg-slate-50'
                                }`}
                            >
                                <span className="text-xl">{game.icon}</span>
                                {game.name}
                                {done > 0 && (
                                    <span
                                        className={`ml-1 rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-600'}`}
                                    >
                                        {done}/{game.activities.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* ============ SELECTOR DE NIVELES ============ */}
            <div className="mx-auto max-w-5xl px-4 pt-4">
                {/* En móvil: descripción arriba y niveles en su propia fila ancho
                    completo (desplazable, botones shrink-0 = nunca se aplastan). */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-black tracking-wider text-slate-400 uppercase">{active?.description}</p>
                    <div
                        className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 py-1 sm:mx-0 sm:justify-end sm:px-0"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {activities.map((act, i) => {
                            const unlocked = isUnlocked(i);
                            const stars = completed[`${activeSlug}:${i}`] ?? 0;
                            return (
                                <button
                                    key={act.id}
                                    disabled={!unlocked}
                                    onClick={() => {
                                        playTap();
                                        setActivityIndex(i);
                                        setResult(null);
                                        setGameKey((k) => k + 1);
                                    }}
                                    className={`flex h-14 w-14 shrink-0 snap-start flex-col items-center justify-center rounded-2xl border-4 text-sm font-black transition touch-manipulation select-none ${
                                        i === activityIndex && unlocked
                                            ? 'scale-105 border-violet-500 bg-violet-500 text-white shadow-lg'
                                            : unlocked
                                              ? 'border-violet-200 bg-white text-violet-500 hover:border-violet-400'
                                              : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300'
                                    }`}
                                    title={act.level_title}
                                >
                                    {unlocked ? act.level_number : '🔒'}
                                    {stars > 0 && <span className="text-[9px] leading-none">{'⭐'.repeat(stars)}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ============ ZONA DE JUEGO ============ */}
            <main className="mx-auto max-w-5xl px-4 pt-5 pb-24">
                <div className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-white/90 p-5 shadow-xl shadow-violet-100">
                    {/* Decoración de fondo */}
                    <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-violet-200/40 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-16 size-56 rounded-full bg-emerald-200/40 blur-2xl" />

                    <div className="relative">
                        {Game && current ? (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${activeSlug}-${current.id}-${gameKey}`}
                                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -16, scale: 0.98 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <Game activity={current} onFinished={handleFinished} />
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <div className="py-16 text-center text-xl font-black text-slate-400">Pronto habrá juegos aquí 🚧</div>
                        )}

                        {/* ============ OVERLAY DE RESULTADO ============ */}
                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-20 flex items-center justify-center rounded-[2rem] bg-white/85 backdrop-blur-sm"
                                >
                                    <motion.div
                                        initial={{ scale: 0.6, y: 30 }}
                                        animate={{ scale: 1, y: 0 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                                        className="mx-4 flex w-full max-w-sm flex-col items-center gap-4 rounded-[2rem] border-4 border-violet-200 bg-white p-7 text-center shadow-2xl"
                                    >
                                        <div className="flex gap-2 text-5xl">
                                            {[0, 1, 2].map((i) => (
                                                <motion.span
                                                    key={i}
                                                    initial={{ scale: 0, rotate: -40 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    transition={{ delay: 0.15 * i, type: 'spring', stiffness: 300 }}
                                                >
                                                    {i < result.stars ? '⭐' : '☆'}
                                                </motion.span>
                                            ))}
                                        </div>

                                        <h3 className="text-3xl font-black text-violet-800">
                                            {PRAISE[result.stars]?.title ?? '¡Bien hecho! 🎉'}
                                        </h3>
                                        <p className="font-semibold text-slate-500">
                                            {result.result.correct} de {result.result.total} correctas
                                        </p>
                                        <p className="text-sm font-bold text-violet-500">{PRAISE[result.stars]?.line}</p>

                                        <div className="flex gap-3">
                                            <motion.span
                                                initial={{ y: -14, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.4 }}
                                                className="rounded-full bg-emerald-100 px-4 py-2 font-black text-emerald-700"
                                            >
                                                +{result.xp} XP
                                            </motion.span>
                                            <motion.span
                                                initial={{ y: -14, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.55 }}
                                                className="rounded-full bg-amber-100 px-4 py-2 font-black text-amber-700"
                                            >
                                                +{result.coins} 🪙
                                            </motion.span>
                                        </div>

                                        <div className="flex w-full gap-3">
                                            <button
                                                onClick={() => {
                                                    playTap();
                                                    setResult(null);
                                                    setGameKey((k) => k + 1);
                                                }}
                                                className="flex-1 rounded-2xl border-4 border-violet-200 py-3 font-black text-violet-500 transition active:scale-95"
                                            >
                                                🔁 Repetir
                                            </button>
                                            <button
                                                onClick={goNext}
                                                className="flex-1 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-black text-white shadow-lg transition active:scale-95"
                                            >
                                                {activityIndex + 1 < activities.length ? 'Siguiente →' : 'Menú 🎮'}
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
