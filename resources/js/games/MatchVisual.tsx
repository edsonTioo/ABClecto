import { playCorrect, playTap, playWrong, speak } from '@/games/audio';
import { type GameProps } from '@/games/types';
import { useMemo, useRef, useState } from 'react';

interface Pair {
    emoji: string;
    word: string;
}

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

/**
 * Match Visual: une imagen ↔ palabra con una línea SVG.
 * Toca una imagen y luego su palabra (o arrastra la palabra sobre la imagen).
 */
export default function MatchVisual({ activity, onFinished }: GameProps) {
    const pairs = useMemo<Pair[]>(() => activity.config.pairs ?? [], [activity.config.pairs]);
    const [left] = useState(() => shuffle(pairs));
    const [right] = useState(() => shuffle(pairs));
    const [selected, setSelected] = useState<Pair | null>(null);
    const [matched, setMatched] = useState<string[]>([]);
    const [wrongPair, setWrongPair] = useState<string | null>(null);
    const [mistakes, setMistakes] = useState(0);
    const [errors, setErrors] = useState<{ type: 'palabra'; value: string }[]>([]);
    const [started, setStarted] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Record<string, HTMLElement | null>>({});

    const lines = useMemo(() => {
        const box = containerRef.current?.getBoundingClientRect();
        if (!box) return [];
        return matched
            .map((word) => {
                const a = itemRefs.current[`left-${word}`]?.getBoundingClientRect();
                const b = itemRefs.current[`right-${word}`]?.getBoundingClientRect();
                if (!a || !b) return null;
                return {
                    word,
                    x1: a.right - box.left,
                    y1: a.top + a.height / 2 - box.top,
                    x2: b.left - box.left,
                    y2: b.top + b.height / 2 - box.top,
                };
            })
            .filter(Boolean) as { word: string; x1: number; y1: number; x2: number; y2: number }[];
        // Se recalcula tras cada render cuando cambia matched (refs ya actualizados).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matched, started]);

    const choose = (pair: Pair) => {
        if (matched.includes(pair.word)) return;
        if (!selected) {
            setSelected(pair);
            playTap();
            speak(pair.word, 0.7);
            return;
        }
        if (selected.word === pair.word) {
            const next = [...matched, pair.word];
            setMatched(next);
            setSelected(null);
            playCorrect();
            setTimeout(() => speak(pair.word, 0.7), 150);
            if (next.length === pairs.length) {
                setTimeout(() => onFinished({ correct: pairs.length, total: pairs.length, mistakes, errors }), 700);
            }
        } else {
            playWrong();
            setMistakes((m) => m + 1);
            setErrors((e) => [...e, { type: 'palabra', value: selected.word.slice(0, 40) }]);
            setWrongPair(pair.word);
            setSelected(null);
            setTimeout(() => setWrongPair(null), 600);
        }
    };

    if (!started) {
        return (
            <div className="flex flex-col items-center gap-6 py-10 text-center">
                <div className="text-7xl">🖼️</div>
                <div>
                    <h3 className="text-3xl font-black text-rose-700">Match Visual</h3>
                    <p className="mt-2 max-w-md text-lg font-semibold text-slate-500">
                        Toca una imagen y luego su palabra: se unirá con una línea mágica.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setStarted(true);
                        playTap();
                    }}
                    className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-12 py-4 text-2xl font-black text-white shadow-lg shadow-rose-300 transition active:scale-95"
                >
                    ¡Jugar!
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative mx-auto flex w-full max-w-2xl items-stretch justify-between gap-8 py-2">
            {/* Líneas conectoras */}
            <svg className="pointer-events-none absolute inset-0 z-10 size-full" style={{ overflow: 'visible' }}>
                {lines.map((l) => (
                    <g key={l.word}>
                        <line
                            x1={l.x1}
                            y1={l.y1}
                            x2={l.x2}
                            y2={l.y2}
                            className="stroke-emerald-400"
                            strokeWidth={6}
                            strokeLinecap="round"
                            strokeDasharray="12 10"
                        >
                            <animate attributeName="stroke-dashoffset" from="44" to="0" dur="0.6s" fill="freeze" />
                        </line>
                        <circle cx={l.x1} cy={l.y1} r={7} className="fill-emerald-500" />
                        <circle cx={l.x2} cy={l.y2} r={7} className="fill-emerald-500" />
                    </g>
                ))}
            </svg>

            {/* Imágenes */}
            <div className="flex flex-col gap-4">
                {left.map((pair) => {
                    const isMatched = matched.includes(pair.word);
                    const isWrong = wrongPair === pair.word;
                    const isSelected = selected?.word === pair.word;
                    return (
                        <button
                            key={`l-${pair.word}`}
                            ref={(el) => {
                                itemRefs.current[`left-${pair.word}`] = el;
                            }}
                            onClick={() => choose(pair)}
                            className={`flex size-24 items-center justify-center rounded-3xl border-4 text-5xl shadow-lg transition active:scale-95 ${
                                isMatched
                                    ? 'border-emerald-300 bg-emerald-100 opacity-60'
                                    : isWrong
                                      ? 'animate-pulse border-red-400 bg-red-100'
                                      : isSelected
                                        ? 'scale-105 border-rose-400 bg-rose-100 ring-4 ring-rose-200'
                                        : 'border-rose-100 bg-white hover:bg-rose-50'
                            }`}
                        >
                            {pair.emoji}
                        </button>
                    );
                })}
            </div>

            {/* Palabras */}
            <div className="flex flex-col gap-4">
                {right.map((pair) => {
                    const isMatched = matched.includes(pair.word);
                    const isWrong = wrongPair === pair.word;
                    const isSelected = selected?.word === pair.word;
                    return (
                        <button
                            key={`r-${pair.word}`}
                            ref={(el) => {
                                itemRefs.current[`right-${pair.word}`] = el;
                            }}
                            onClick={() => choose(pair)}
                            className={`rounded-3xl border-4 px-6 py-4 text-xl font-black tracking-wide transition active:scale-95 ${
                                isMatched
                                    ? 'border-emerald-300 bg-emerald-100 text-emerald-500 opacity-60'
                                    : isWrong
                                      ? 'animate-pulse border-red-400 bg-red-100 text-red-600'
                                      : isSelected
                                        ? 'scale-105 border-rose-400 bg-rose-100 text-rose-700 ring-4 ring-rose-200'
                                        : 'border-rose-100 bg-white text-rose-700 hover:bg-rose-50'
                            }`}
                        >
                            {pair.word}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
