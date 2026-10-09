import { playCorrect, playTap, playWrong, speak } from '@/games/audio';
import { type GameProps } from '@/games/types';
import { useMemo, useState } from 'react';

const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

interface Placement {
    word: string;
    cells: [number, number][];
}

function buildGrid(words: string[], size: number): { grid: string[][]; placements: Placement[] } {
    const grid: string[][] = Array.from({ length: size }, () => Array<string>(size).fill(''));
    const placements: Placement[] = [];
    const directions: [number, number][] = [
        [0, 1],
        [1, 0],
        [1, 1],
    ];

    for (const raw of words) {
        const word = raw.toUpperCase();
        let placed = false;
        for (let attempt = 0; attempt < 120 && !placed; attempt++) {
            const [dr, dc] = directions[Math.floor(Math.random() * directions.length)];
            const r = Math.floor(Math.random() * size);
            const c = Math.floor(Math.random() * size);
            const endR = r + dr * (word.length - 1);
            const endC = c + dc * (word.length - 1);
            if (endR >= size || endC >= size) continue;

            const cells: [number, number][] = [];
            let fits = true;
            for (let i = 0; i < word.length; i++) {
                const rr = r + dr * i;
                const cc = c + dc * i;
                if (grid[rr][cc] && grid[rr][cc] !== word[i]) {
                    fits = false;
                    break;
                }
                cells.push([rr, cc]);
            }
            if (!fits) continue;

            cells.forEach(([rr, cc], i) => {
                grid[rr][cc] = word[i];
            });
            placements.push({ word, cells });
            placed = true;
        }
    }

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (!grid[r][c]) grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        }
    }

    return { grid, placements };
}

export default function WordSearch({ activity, onFinished }: GameProps) {
    const words = useMemo(() => (activity.config.words ?? []).map((w) => w.toUpperCase()), [activity.config.words]);
    const size = activity.config.grid ?? 7;
    const [puzzle, setPuzzle] = useState(() => buildGrid(words, size));
    const [found, setFound] = useState<string[]>([]);
    const [path, setPath] = useState<[number, number][]>([]);
    const [mistakes, setMistakes] = useState(0);
    const [errors, setErrors] = useState<{ type: 'palabra'; value: string }[]>([]);
    const [wrongFlash, setWrongFlash] = useState(false);
    const [started, setStarted] = useState(false);

    const foundCells = useMemo(() => {
        const set = new Set<string>();
        puzzle.placements.filter((p) => found.includes(p.word)).forEach((p) => p.cells.forEach(([r, c]) => set.add(`${r}-${c}`)));
        return set;
    }, [found, puzzle]);

    const pathKey = new Set(path.map(([r, c]) => `${r}-${c}`));

    const cellFromPoint = (x: number, y: number): [number, number] | null => {
        const el = document.elementFromPoint(x, y)?.closest('[data-cell]') as HTMLElement | null;
        if (!el) return null;
        return [Number(el.dataset.r), Number(el.dataset.c)];
    };

    const lineBetween = (a: [number, number], b: [number, number]): [number, number][] => {
        const [dr, dc] = [b[0] - a[0], b[1] - a[1]];
        if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return [a];
        const steps = Math.max(Math.abs(dr), Math.abs(dc)) || 1;
        const [sr, sc] = [Math.sign(dr), Math.sign(dc)];
        return Array.from({ length: steps + 1 }, (_, i) => [a[0] + sr * i, a[1] + sc * i] as [number, number]);
    };

    const currentSelection = useMemo(() => (path.length >= 2 ? path.map(([r, c]) => puzzle.grid[r]?.[c] ?? '').join('') : ''), [path, puzzle]);

    const checkSelection = () => {
        if (currentSelection.length < 2) {
            setPath([]);
            return;
        }
        const reversed = [...currentSelection].reverse().join('');
        const hit = words.find((w) => (w === currentSelection || w === reversed) && !found.includes(w));
        if (hit) {
            const next = [...found, hit];
            setFound(next);
            playCorrect();
            speak(hit, 0.8);
            setPath([]);
            if (next.length === words.length) {
                setTimeout(
                    () => onFinished({ correct: words.length, total: words.length, mistakes, errors }),
                    600,
                );
            }
        } else {
            playWrong();
            setMistakes((m) => m + 1);
            setErrors((e) => [...e, { type: 'palabra', value: currentSelection.slice(0, 40) }]);
            setWrongFlash(true);
            setTimeout(() => {
                setWrongFlash(false);
                setPath([]);
            }, 450);
        }
    };

    if (!started) {
        return (
            <div className="flex flex-col items-center gap-6 py-10 text-center">
                <div className="text-7xl">🔍</div>
                <div>
                    <h3 className="text-3xl font-black text-purple-800">Sopa de Letras</h3>
                    <p className="mt-2 max-w-md text-lg font-semibold text-slate-500">
                        Arrastra el dedo o el ratón sobre las letras para encontrar: <strong>{words.join(', ')}</strong>
                    </p>
                </div>
                <button
                    onClick={() => {
                        setStarted(true);
                        playTap();
                    }}
                    className="rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-12 py-4 text-2xl font-black text-white shadow-lg shadow-fuchsia-300 transition active:scale-95"
                >
                    ¡Jugar!
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-5" style={{ touchAction: 'none' }}>
            {/* Palabras por encontrar */}
            <div className="flex flex-wrap justify-center gap-2">
                {words.map((w) => (
                    <span
                        key={w}
                        className={`rounded-full px-4 py-1.5 text-lg font-black tracking-wide transition ${
                            found.includes(w) ? 'bg-emerald-200 text-emerald-700 line-through' : 'bg-white text-slate-600 shadow'
                        }`}
                    >
                        {w}
                    </span>
                ))}
            </div>

            <div
                className={`grid gap-1.5 rounded-3xl border-4 bg-amber-50 p-3 transition ${wrongFlash ? 'animate-pulse border-red-400' : 'border-amber-300'}`}
                style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
                onPointerDown={(e) => {
                    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                    const cell = cellFromPoint(e.clientX, e.clientY);
                    if (cell) setPath([cell]);
                }}
                onPointerMove={(e) => {
                    if (e.buttons === 0 && e.pointerType === 'mouse') return;
                    if (path.length === 0) return;
                    const cell = cellFromPoint(e.clientX, e.clientY);
                    if (!cell) return;
                    setPath(lineBetween(path[0], cell));
                }}
                onPointerUp={() => checkSelection()}
            >
                {puzzle.grid.map((row, r) =>
                    row.map((letter, c) => {
                        const key = `${r}-${c}`;
                        const isFound = foundCells.has(key);
                        const inPath = pathKey.has(key);
                        return (
                            <div
                                key={key}
                                data-cell
                                data-r={r}
                                data-c={c}
                                className={`flex size-10 cursor-pointer items-center justify-center rounded-xl text-xl font-black transition select-none sm:size-11 ${
                                    isFound
                                        ? 'bg-emerald-400 text-white shadow'
                                        : inPath
                                          ? 'scale-110 bg-purple-500 text-white shadow-lg'
                                          : 'bg-white text-slate-700 shadow-sm hover:bg-purple-100'
                                }`}
                            >
                                {letter}
                            </div>
                        );
                    }),
                )}
            </div>

            <button
                onClick={() => {
                    const fresh = buildGrid(words, size);
                    setPuzzle(fresh);
                    setFound([]);
                    setPath([]);
                    setMistakes(0);
                    setErrors([]);
                }}
                className="rounded-full bg-white px-6 py-2 text-sm font-bold text-slate-500 shadow transition hover:text-purple-600"
            >
                🔁 Mezclar de nuevo
            </button>
        </div>
    );
}
