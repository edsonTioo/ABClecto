import { playCorrect, playTap, playWrong, speak } from '@/games/audio';
import { type GameProps } from '@/games/types';
import { useMemo, useState } from 'react';

const DECOYS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

interface Round {
    target: string;
    options: string[];
}

function buildRounds(letters: string[]): Round[] {
    return letters.map((target) => {
        const pool = [...DECOYS]
            .filter((l) => l !== target)
            .sort(() => Math.random() - 0.5)
            .slice(0, 2);
        return { target, options: [...pool, target].sort(() => Math.random() - 0.5) };
    });
}

/** Sombras de letras: identifica la letra a partir de su silueta. */
export default function ShadowLetters({ activity, onFinished }: GameProps) {
    const letters = useMemo(() => activity.config.letters ?? [], [activity.config.letters]);
    const [rounds] = useState(() => buildRounds(letters));
    const [index, setIndex] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [errors, setErrors] = useState<{ type: 'letra'; value: string }[]>([]);
    const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null);
    const [started, setStarted] = useState(false);

    const round = rounds[index];

    const answer = (letter: string) => {
        speak(letter, 0.7);
        if (letter === round.target) {
            playCorrect();
            setFeedback('ok');
            setTimeout(() => {
                setFeedback(null);
                if (index + 1 >= rounds.length) {
                    onFinished({ correct: rounds.length, total: rounds.length, mistakes, errors });
                } else {
                    setIndex(index + 1);
                }
            }, 700);
        } else {
            playWrong();
            setMistakes((m) => m + 1);
            setErrors((e) => [...e, { type: 'letra', value: round.target }]);
            setFeedback('bad');
            setTimeout(() => setFeedback(null), 600);
        }
    };

    if (!started) {
        return (
            <div className="flex flex-col items-center gap-6 py-10 text-center">
                <div className="text-7xl">🌑</div>
                <div>
                    <h3 className="text-3xl font-black text-indigo-800">Sombras de Letras</h3>
                    <p className="mt-2 max-w-md text-lg font-semibold text-slate-500">
                        Mira la sombra y toca la letra que la coincide. Toca la sombra para escucharla.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setStarted(true);
                        playTap();
                    }}
                    className="rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-12 py-4 text-2xl font-black text-white shadow-lg shadow-sky-300 transition active:scale-95"
                >
                    ¡Jugar!
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-7 py-4">
            <div className="flex gap-1.5">
                {rounds.map((_, i) => (
                    <span
                        key={i}
                        className={`h-2.5 rounded-full transition-all ${i < index ? 'w-8 bg-indigo-400' : i === index ? 'w-8 bg-indigo-600' : 'w-2.5 bg-slate-200'}`}
                    />
                ))}
            </div>

            {/* La sombra */}
            <button
                onClick={() => speak(round.target, 0.6)}
                className={`group relative flex h-44 w-44 items-center justify-center rounded-[2.5rem] border-4 transition ${
                    feedback === 'ok'
                        ? 'scale-110 border-emerald-400 bg-emerald-100'
                        : feedback === 'bad'
                          ? 'animate-bounce border-red-300 bg-red-50'
                          : 'border-indigo-200 bg-slate-100'
                }`}
                title="Toca para escuchar"
            >
                <span
                    className="text-9xl font-black text-slate-500/60 blur-[5px] select-none"
                    style={{ textShadow: '0 12px 18px rgba(15,23,42,0.45)' }}
                    aria-hidden
                >
                    {round.target}
                </span>
                <span className="absolute -bottom-3 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">
                    🔊 Toca para oír
                </span>
            </button>

            {/* Opciones */}
            <div className="flex gap-4">
                {round.options.map((letter) => (
                    <button
                        key={letter}
                        onClick={() => answer(letter)}
                        className={`h-24 w-24 rounded-3xl border-4 text-4xl font-black shadow-lg transition active:scale-90 ${
                            feedback === 'ok' && letter === round.target
                                ? 'border-emerald-400 bg-emerald-300 text-white'
                                : 'border-indigo-100 bg-white text-indigo-700 hover:bg-indigo-50'
                        }`}
                    >
                        {letter}
                    </button>
                ))}
            </div>

            <p className="text-sm font-bold text-slate-400">
                Letra {index + 1} de {rounds.length}
            </p>
        </div>
    );
}
