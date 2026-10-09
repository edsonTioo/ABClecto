import { playCorrect, playTap, playWrong, speak } from '@/games/audio';
import { type GameProps } from '@/games/types';
import { useTileDrag } from '@/games/useTileDrag';
import { useMemo, useState } from 'react';

interface Slot {
    id: string;
    letter: string | null;
}

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

/**
 * Construcción Progresiva:
 * Etapa 1 — arrastra letras para formar la palabra.
 * Etapa 2 — arrastra palabras para formar la oración.
 */
export default function LetterBuilder({ activity, onFinished }: GameProps) {
    const word = (activity.config.word ?? '').toUpperCase();
    const sentence = (activity.config.sentence ?? '').toUpperCase();

    const [stage, setStage] = useState<'word' | 'sentence' | 'done'>('word');
    const [mistakes, setMistakes] = useState(0);
    const [errors, setErrors] = useState<{ type: 'palabra'; value: string }[]>([]);
    const [shake, setShake] = useState(false);
    const [started, setStarted] = useState(false);

    const letterTiles = useMemo(() => shuffle([...word].map((l, i) => ({ id: `L${i}`, label: l }))), [word]);
    const wordTiles = useMemo(() => shuffle(sentence.split(' ').map((w, i) => ({ id: `W${i}`, label: w }))), [sentence]);

    const answer = stage === 'word' ? [...word] : sentence.split(' ');
    const zone = stage === 'word' ? 'word-zone' : 'sentence-zone';

    const [pool, setPool] = useState<Record<string, string | null>>(() => Object.fromEntries(letterTiles.map((t) => [t.id, t.label])));
    const [slots, setSlots] = useState<Slot[]>(() => word.split('').map((_, i) => ({ id: `S${i}`, letter: null })));

    const [wordPool, setWordPool] = useState<Record<string, string | null>>(() => Object.fromEntries(wordTiles.map((t) => [t.id, t.label])));
    const [wordSlots, setWordSlots] = useState<Slot[]>(() => sentence.split(' ').map((_, i) => ({ id: `WS${i}`, letter: null })));

    const activePool = stage === 'word' ? pool : wordPool;
    const activeSlots = stage === 'word' ? slots : wordSlots;
    const activeTiles = stage === 'word' ? letterTiles : wordTiles;

    const setActiveSlots = stage === 'word' ? setSlots : setWordSlots;
    const setActivePool = stage === 'word' ? setPool : setWordPool;

    const validate = (nextSlots: Slot[]) => {
        const filled = nextSlots.map((s) => s.letter);
        if (filled.some((f) => f === null)) return;
        const attempt = filled.join(stage === 'word' ? '' : ' ');
        const expected = answer.join(stage === 'word' ? '' : ' ');
        if (attempt === expected) {
            playCorrect();
            speak(expected, 0.75);
            setTimeout(() => {
                if (stage === 'word' && sentence) {
                    setStage('sentence');
                } else {
                    setStage('done');
                    onFinished({ correct: answer.length, total: answer.length, mistakes, errors });
                }
            }, 800);
        } else {
            playWrong();
            setMistakes((m) => m + 1);
            setErrors((e) => [...e, { type: 'palabra', value: expected.slice(0, 40) }]);
            setShake(true);
            setTimeout(() => {
                setShake(false);
                setActiveSlots((prev) => prev.map((s) => ({ ...s, letter: null })));
            }, 600);
        }
    };

    const { tileProps, draggingId, overZone, Ghost } = useTileDrag({
        onTap: (id) => {
            playTap();
            const label = activePool[id];
            if (label == null) return;
            const empty = activeSlots.find((s) => s.letter === null);
            if (!empty) return;
            const next = activeSlots.map((s) => (s.id === empty.id ? { ...s, letter: label } : s));
            setActivePool((p) => ({ ...p, [id]: null }));
            setActiveSlots(next);
            validate(next);
        },
        onDrop: (id, targetZone) => {
            if (targetZone !== zone) return;
            const label = activePool[id] ?? activeTiles.find((t) => t.id === id)?.label;
            if (label == null) return;
            const empty = activeSlots.find((s) => s.letter === null);
            if (!empty) return;
            playTap();
            const next = activeSlots.map((s) => (s.id === empty.id ? { ...s, letter: label } : s));
            setActivePool((p) => ({ ...p, [id]: label === activePool[id] ? null : p[id] }));
            setActiveSlots(next);
            validate(next);
        },
    });

    if (!started) {
        return (
            <div className="flex flex-col items-center gap-6 py-10 text-center">
                <div className="text-7xl">🧩</div>
                <div>
                    <h3 className="text-3xl font-black text-orange-700">Construcción</h3>
                    <p className="mt-2 max-w-md text-lg font-semibold text-slate-500">
                        Arrastra las letras para formar la palabra{sentence ? ' y luego las palabras para formar la oración' : ''}.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setStarted(true);
                        playTap();
                    }}
                    className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-12 py-4 text-2xl font-black text-white shadow-lg shadow-amber-300 transition active:scale-95"
                >
                    ¡Jugar!
                </button>
            </div>
        );
    }

    if (stage === 'done') {
        return (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="text-7xl">🎉</div>
                <h3 className="text-3xl font-black text-orange-700">{stage === 'done' ? sentence || word : ''}</h3>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-8 py-2" style={{ touchAction: 'none' }}>
            <div className="flex items-center gap-3 rounded-full bg-orange-100 px-5 py-2 text-sm font-black text-orange-600">
                <span className={stage === 'word' ? 'opacity-100' : 'opacity-40'}>1️⃣ Palabra</span>
                <span>→</span>
                <span className={stage === 'sentence' ? 'opacity-100' : 'opacity-40'}>2️⃣ Oración</span>
            </div>

            {/* Zona de construcción */}
            <div
                data-drop={zone}
                className={`flex min-h-24 flex-wrap items-center justify-center gap-3 rounded-3xl border-4 border-dashed p-5 transition ${
                    shake
                        ? 'animate-pulse border-red-400 bg-red-50'
                        : overZone === zone
                          ? 'scale-105 border-orange-400 bg-orange-100'
                          : 'border-orange-300 bg-orange-50'
                }`}
            >
                {activeSlots.map((slot) => (
                    <button
                        key={slot.id}
                        data-drop={zone}
                        onClick={() => {
                            if (!slot.letter) return;
                            playTap();
                            const next = activeSlots.map((s) => (s.id === slot.id ? { ...s, letter: null } : s));
                            const freeId = activeTiles.find((t) => t.label === slot.letter && activePool[t.id] === null)?.id;
                            if (freeId) setActivePool((p) => ({ ...p, [freeId]: slot.letter }));
                            setActiveSlots(next);
                        }}
                        className={`flex items-center justify-center rounded-2xl border-b-4 font-black shadow-md transition ${
                            stage === 'word'
                                ? 'h-16 w-14 border-orange-500 bg-white text-3xl text-orange-700'
                                : 'min-h-14 border-amber-500 bg-white px-4 text-xl text-amber-800'
                        } ${slot.letter ? '' : 'border-dashed bg-orange-100/60 text-orange-200'}`}
                    >
                        {slot.letter ?? (stage === 'word' ? '▢' : '▢▢')}
                    </button>
                ))}
            </div>

            {/* Fichas disponibles */}
            <div className="flex flex-wrap justify-center gap-3">
                {activeTiles
                    .filter((t) => activePool[t.id] !== null)
                    .map((tile) => (
                        <button
                            key={tile.id}
                            {...tileProps(tile.id, tile.label)}
                            className={`rounded-2xl border-b-4 border-amber-500 bg-gradient-to-b from-amber-200 to-amber-300 font-black text-amber-900 shadow-lg transition select-none active:translate-y-1 active:border-b-0 ${
                                stage === 'word' ? 'h-16 w-14 text-3xl' : 'px-5 py-3 text-xl'
                            } ${draggingId === tile.id ? 'opacity-30' : ''} ${overZone === zone ? 'ring-4 ring-orange-300' : ''}`}
                        >
                            {tile.label}
                        </button>
                    ))}
            </div>

            <p className="text-sm font-bold text-slate-400">Toca o arrastra las fichas hasta la zona punteada</p>
            {Ghost}
        </div>
    );
}
