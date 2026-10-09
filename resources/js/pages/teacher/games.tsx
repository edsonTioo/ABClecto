import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Play, Pencil } from 'lucide-react';

interface CatalogGame {
    id: number;
    slug: string;
    name: string;
    description: string;
    icon: string;
    levels: number;
    xp: [number, number];
    difficulty: number;
}

interface GamesProps {
    minigames: CatalogGame[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Probar juegos', href: '/profesor/juegos' }];

const CARD_STYLES: Record<string, string> = {
    'sopa-letras': 'from-amber-400 to-orange-500',
    'sombras-letras': 'from-indigo-400 to-violet-500',
    construccion: 'from-orange-400 to-amber-500',
    completar: 'from-teal-400 to-emerald-500',
    'match-visual': 'from-rose-400 to-pink-500',
    comprension: 'from-sky-400 to-blue-500',
};

/**
 * Catálogo de juegos del profesor: desde aquí entra a probar cualquier modo
 * en "modo prueba" (abre los 10 niveles y no guarda partidas).
 */
export default function Games({ minigames }: GamesProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Probar juegos" />

            <div className="mx-auto max-w-6xl p-6">
                <h1 className="text-2xl font-black text-violet-900">🎮 Juegos</h1>
                <p className="text-sm font-semibold text-slate-500">
                    Prueba cada modo como lo haría un estudiante. En <b>modo prueba</b> se abren los 10 niveles y las partidas no se guardan.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {minigames.map((game) => (
                        <div
                            key={game.slug}
                            className="group flex flex-col overflow-hidden rounded-3xl border-2 border-violet-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                        >
                            <div
                                className={`flex h-24 items-center justify-center bg-gradient-to-br text-5xl ${CARD_STYLES[game.slug] ?? 'from-violet-400 to-fuchsia-500'}`}
                            >
                                {game.icon}
                            </div>

                            <div className="flex flex-1 flex-col gap-2 p-4">
                                <h2 className="font-black text-slate-800">{game.name}</h2>
                                <p className="line-clamp-2 text-xs font-semibold text-slate-500">{game.description}</p>

                                <div className="mt-auto flex flex-wrap gap-1.5">
                                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-black text-violet-700">
                                        {game.levels} niveles
                                    </span>
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">
                                        +{game.xp[0]}–{game.xp[1]} XP
                                    </span>
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">
                                        {'●'.repeat(game.difficulty)}
                                        {'○'.repeat(5 - game.difficulty)}
                                    </span>
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <Link
                                        href={`${route('teacher.games.preview')}?juego=${game.slug}`}
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-2.5 text-sm font-black text-white shadow-md transition active:scale-95"
                                    >
                                        <Play className="size-4" /> Jugar
                                    </Link>
                                    <Link
                                        href={route('teacher.levels')}
                                        title="Editar niveles"
                                        className="flex items-center justify-center rounded-xl border-2 border-violet-200 px-3 text-violet-500 transition hover:bg-violet-50"
                                    >
                                        <Pencil className="size-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/60 p-4 text-sm font-bold text-violet-700">
                    👀 <b>Modo prueba:</b> puedes recorrer los 10 niveles sin desbloqueos ni límites. Al salir vuelves al panel y ningún XP o
                    error se registra en los estudiantes.
                </div>
            </div>
        </AppLayout>
    );
}
