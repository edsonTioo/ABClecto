import { playCorrect, playTap, playWrong, speak } from '@/games/audio';
import { type GameProps } from '@/games/types';
import { useMemo, useState } from 'react';

interface Item {
    prompt: string;
    answer: string;
    options: string[];
}

/** Completar Desafíos: rellena el hueco en palabras y oraciones. */
export default function FillBlank({ activity, onFinished }: GameProps) {
    const items = useMemo<Item[]>(() => activity.config.items ?? [], [activity.config.items]);
    const [index, setIndex] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [errors, setErrors] = useState<{ type: 'palabra'; value: string }[]>([]);
    const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null);
    const [picked, setPicked] = useState<string | null>(null);
    const [started, setStarted] = useState(false);

    const item = items[index];

    const answer = (option: string) => {
        setPicked(option);
        speak(option, 0.75);
        if (option === item.answer) {
            playCorrect();
            setFeedback('ok');
            setTimeout(() => {
                setFeedback(null);
                setPicked(null);
                if (index + 1 >= items.length) {
                    onFinished({ correct: items.length, total: items.length, mistakes, errors });
                } else {
                    setIndex(index + 1);
                }
            }, 800);
        } else {
            playWrong();
            setMistakes((m) => m + 1);
            setErrors((e) => [...e, { type: 'palabra', value: item.answer.slice(0, 40) }]);
            setFeedback('bad');
            setTimeout(() => {
                setFeedback(null);
                setPicked(null);
            }, 700);
        }
    };

    if (!started) {
        return (
            <div className="flex flex-col items-center gap-6 py-10 text-center">
                <div className="text-7xl">✏️</div>
                <div>
                    <h3 className="text-3xl font-black text-teal-700">Completar Desafíos</h3>
                    <p className="mt-2 max-w-md text-lg font-semibold text-slate-500">
                        Mira la palabra u oración incompleta y elige la pieza que falta.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setStarted(true);
                        playTap();
                    }}
                    className="rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-12 py-4 text-2xl font-black text-white shadow-lg shadow-emerald-300 transition active:scale-95"
                >
                    ¡Jugar!
                </button>
            </div>
        );
    }

    const parts = item.prompt.split('___');

    return (
        <div className="flex flex-col items-center gap-8 py-4">
            <div className="flex gap-1.5">
                {items.map((_, i) => (
                    <span
                        key={i}
                        className={`h-2.5 rounded-full transition-all ${i < index ? 'w-8 bg-teal-400' : i === index ? 'w-8 bg-teal-600' : 'w-2.5 bg-slate-200'}`}
                    />
                ))}
            </div>

            <div
                className={`flex max-w-xl items-center justify-center gap-1 rounded-3xl border-4 px-7 py-6 text-center transition ${
                    feedback === 'ok'
                        ? 'scale-105 border-emerald-400 bg-emerald-50'
                        : feedback === 'bad'
                          ? 'animate-pulse border-red-300 bg-red-50'
                          : 'border-teal-200 bg-white shadow-lg'
                }`}
            >
                {parts.map((part, i) => (
                    <span key={i} className="text-3xl font-black text-slate-700">
                        {part}
                        {i < parts.length - 1 && (
                            <span className="mx-1 inline-block min-w-16 border-b-4 border-teal-400 text-teal-400">
                                {feedback === 'ok' ? item.answer : ''}
                            </span>
                        )}
                    </span>
                ))}
            </div>

            <div className="flex flex-wrap justify-center gap-4">
                {item.options.map((option) => (
                    <button
                        key={option}
                        onClick={() => answer(option)}
                        className={`min-w-24 rounded-3xl border-4 px-7 py-4 text-2xl font-black shadow-lg transition active:scale-95 ${
                            feedback === 'ok' && option === item.answer
                                ? 'border-emerald-400 bg-emerald-300 text-white'
                                : feedback === 'bad' && picked === option
                                  ? 'border-red-300 bg-red-200 text-red-700'
                                  : 'border-teal-100 bg-white text-teal-700 hover:bg-teal-50'
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <p className="text-sm font-bold text-slate-400">
                Desafío {index + 1} de {items.length}
            </p>
        </div>
    );
}
