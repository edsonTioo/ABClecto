import AppLogo from '@/components/app-logo';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, Gamepad2, Library, LineChart, Sparkles, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inicio',
        href: '/dashboard',
    },
];

interface DashboardStats {
    students: number;
    attempts_today: number;
    minigames: number;
    levels: number;
}

interface DashboardProps {
    stats: DashboardStats;
}

const QUICK_LINKS = [
    {
        title: 'Panel del profesor',
        text: 'Analítica, alertas y estudiantes que necesitan ayuda.',
        href: '/profesor/dashboard',
        icon: LineChart,
        gradient: 'from-sky-400 to-blue-500',
    },
    {
        title: 'Editor de niveles',
        text: 'Crea y ajusta los niveles de cada minijuego.',
        href: '/profesor/niveles',
        icon: Library,
        gradient: 'from-violet-400 to-fuchsia-500',
    },
    {
        title: 'Estudiantes',
        text: 'Alta de alumnos, grupos, códigos y PIN de acceso.',
        href: '/profesor/estudiantes',
        icon: Users,
        gradient: 'from-emerald-400 to-teal-500',
    },
    {
        title: 'Catálogo de juegos',
        text: 'Revisa los 6 minijuegos y pruébalos en modo demo.',
        href: '/profesor/juegos',
        icon: Gamepad2,
        gradient: 'from-amber-400 to-orange-500',
    },
];

export default function Dashboard({ stats }: DashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const firstName = auth.user?.name?.split(' ')[0] ?? '';

    const statCards = [
        { label: 'Estudiantes', value: stats.students, icon: Users, color: 'text-violet-600 bg-violet-100' },
        { label: 'Partidas hoy', value: stats.attempts_today, icon: Sparkles, color: 'text-emerald-600 bg-emerald-100' },
        { label: 'Minijuegos', value: stats.minigames, icon: Gamepad2, color: 'text-amber-600 bg-amber-100' },
        { label: 'Niveles', value: stats.levels, icon: BookOpen, color: 'text-sky-600 bg-sky-100' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inicio" />
            <div className="mx-auto flex h-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* ============ BIENVENIDA ============ */}
                <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-500 p-6 text-white shadow-xl sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-white/80">Bienvenido de vuelta 👋</p>
                            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{firstName ? `¡Hola, ${firstName}!` : '¡Hola!'}</h1>
                            <p className="mt-1 max-w-lg text-sm font-semibold text-white/85">
                                Este es tu centro de mando de ABClecto: revisa el progreso de tu grupo o entra a probar los minijuegos.
                            </p>
                        </div>
                        <div className="hidden rounded-2xl bg-white/15 px-5 py-4 text-center backdrop-blur-sm sm:block">
                            <p className="text-3xl">📚</p>
                            <p className="text-lg font-extrabold">ABClecto</p>
                            <p className="text-xs font-bold text-white/80">Lectoescritura gamificada</p>
                        </div>                    </div>
                </div>

                {/* ============ STATS ============ */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {statCards.map((s) => (
                        <div key={s.label} className="rounded-2xl border-4 border-white bg-white p-4 shadow-lg shadow-slate-100 sm:p-5">
                            <div className={`flex size-10 items-center justify-center rounded-xl ${s.color}`}>
                                <s.icon className="size-5" />
                            </div>
                            <p className="mt-3 text-2xl font-extrabold text-slate-800 sm:text-3xl">{s.value}</p>
                            <p className="text-xs font-bold text-slate-400 sm:text-sm">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* ============ ACCESOS RÁPIDOS ============ */}
                <div>
                    <h2 className="text-lg font-extrabold text-violet-900 dark:text-violet-200">Accesos rápidos</h2>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {QUICK_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="group rounded-2xl border-4 border-white bg-white p-5 shadow-lg shadow-slate-100 transition hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div
                                    className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${link.gradient} text-white shadow-md transition group-hover:scale-110`}
                                >
                                    <link.icon className="size-5" />
                                </div>
                                <h3 className="mt-3 font-extrabold text-slate-800">{link.title}</h3>
                                <p className="mt-1 text-sm font-semibold text-slate-500">{link.text}</p>
                                <span className="mt-3 inline-block text-sm font-extrabold text-violet-600 opacity-0 transition group-hover:opacity-100">
                                    Abrir →
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ============ PIE ============ */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-4 border-dashed border-violet-200 bg-violet-50/60 p-4">
                    <div className="flex items-center gap-3">
                        <AppLogo />
                    </div>
                    <Link
                        href="/juegos"
                        className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg transition hover:brightness-110"
                    >
                        🎮 Ir a Mis Juegos
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
