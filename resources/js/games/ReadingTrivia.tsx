import { playCorrect, playTap, playWrong, speak, stopSpeaking } from '@/games/audio';
import { type GameProps } from '@/games/types';
import { useMemo, useState } from 'react';

/**
 * Comprensión Lectora Multimedia:
 * texto en pantalla + "Escuchar lectura" (Web Speech API) + trivia.
 */
export default function ReadingTrivia({ activity, onFinished }: GameProps) {
    const { title, text, questions } = useMemo(
        () => ({
            title: activity.config.title ?? 'Lectura',
            text: activity.config.text ?? '',
            questions: activity.config.questions ?? [],
        }),
        [activity.config],
    );

    const [phase, setPhase] = useState<'intro' | 'read' | 'quiz'>('intro');
    const [current, setCurrent] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [errors, setErrors] = useState<{ type: 'comprension'; value: string }[]>([]);
    const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null);
    const [picked, setPicked] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const question = questions[current];

    const listen = () => {
        if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
            stopSpeaking();
            setIsSpeaking(false);
            return;
        }
        speak(`${title}. ${text}`, 0.8);
        setIsSpeaking(true);
        setTimeout(() => setIsSpeaking(false), Math.max(3000, text.length * 70));
    };

    const pick = (option: string) => {
        setPicked(option);
        speak(option, 0.75);
        const isRight = option === question.correct;
        if (isRight) {
            playCorrect();
            setCorrectCount((c) => c + 1);
            setFeedback('ok');
        } else {
            playWrong();
            setMistakes((m) => m + 1);
            setErrors((e) => [...e, { type: 'comprension', value: question.question.slice(0, 40) }]);
            setFeedback('bad');
        }
        setTimeout(() => {
            setFeedback(null);
            setPicked(null);
            if (current + 1 >= questions.length) {
                const finalCorrect = correctCount + (isRight ? 1 : 0);
                onFinished({ correct: finalCorrect, total: questions.length, mistakes, errors });
            } else {
                setCurrent(current + 1);
            }
        }, 900);
    };

    if (phase === 'intro') {
        return (
            <div className="flex flex-col items-center gap-6 py-10 text-center">
                <div className="text-7xl">📖</div>
                <div>
                    <h3 className="text-3xl font-black text-sky-700">Comprensión Lectora</h3>
                    <p className="mt-2 max-w-md text-lg font-semibold text-slate-500">
                        Lee el texto, escúchalo con el botón 🔊 y responde la trivia al final.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setPhase('read');
                        playTap();
                    }}
                    className="rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-12 py-4 text-2xl font-black text-white shadow-lg shadow-sky-300 transition active:scale-95"
                >
                    ¡Leer!
                </button>
            </div>
        );
    }

    if (phase === 'read') {
        return (
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-4 text-center">
                <h3 className="text-3xl font-black text-sky-800">{title}</h3>

                <button
                    onClick={listen}
                    className={`rounded-full px-8 py-4 text-xl font-black text-white shadow-lg transition active:scale-95 ${
                        isSpeaking ? 'animate-pulse bg-rose-500' : 'bg-sky-500 hover:bg-sky-600'
                    }`}
                >
                    {isSpeaking ? '⏹ Detener lectura' : '🔊 Escuchar lectura'}
                </button>

                <div className="rounded-3xl border-4 border-sky-100 bg-white p-7 text-left shadow-lg">
                    <p className="text-2xl leading-relaxed font-semibold text-slate-700">{text}</p>
                </div>

                <button
                    onClick={() => {
                        stopSpeaking();
                        setPhase('quiz');
                        playTap();
                    }}
                    className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-10 py-4 text-2xl font-black text-white shadow-lg shadow-emerald-300 transition active:scale-95"
                >
                    ¡Ya leí! Responder →
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-7 py-4">
            <div className="flex gap-1.5">
                {questions.map((_, i) => (
                    <span
                        key={i}
                        className={`h-2.5 rounded-full transition-all ${i < current ? 'w-8 bg-sky-400' : i === current ? 'w-8 bg-sky-600' : 'w-2.5 bg-slate-200'}`}
                    />
                ))}
            </div>

            <div
                className={`max-w-xl rounded-3xl border-4 px-7 py-6 text-center transition ${
                    feedback === 'ok'
                        ? 'scale-105 border-emerald-400 bg-emerald-50'
                        : feedback === 'bad'
                          ? 'animate-pulse border-red-300 bg-red-50'
                          : 'border-sky-200 bg-white shadow-lg'
                }`}
            >
                <p className="text-2xl font-black text-slate-700">{question.question}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
                {question.options.map((option) => (
                    <button
                        key={option}
                        onClick={() => pick(option)}
                        className={`rounded-3xl border-4 px-7 py-4 text-2xl font-black shadow-lg transition active:scale-95 ${
                            feedback === 'ok' && option === question.correct
                                ? 'border-emerald-400 bg-emerald-300 text-white'
                                : feedback === 'bad' && picked === option
                                  ? 'border-red-300 bg-red-200 text-red-700'
                                  : 'border-sky-100 bg-white text-sky-700 hover:bg-sky-50'
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <button
                onClick={() => {
                    setPhase('read');
                }}
                className="text-sm font-bold text-slate-400 underline hover:text-sky-600"
            >
                📖 Volver a leer
            </button>
        </div>
    );
}
