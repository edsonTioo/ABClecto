import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Flame, Trophy } from 'lucide-react';
import { useState } from 'react';

interface TopStudent {
    rank: number;
    id: number;
    name: string;
    xp: number;
    level: number;
    streak: number;
    group: string | null;
    shift: string | null;
}

interface WeakArea {
    type: string;
    value: string;
    fails: number;
}

interface Alert {
    student_id: number;
    name: string;
    group: string | null;
    shift: string | null;
    level: number;
    xp: number;
    priority: 'alta' | 'media';
    reasons: string[];
    accuracy: number | null;
    attempts: number;
    days_inactive: number | null;
    weak_areas: WeakArea[];
}

interface CommonError {
    type: string;
    value: string;
    fails: number;
    students: number;
}

interface GroupOption {
    id: number;
    name: string;
    shift: string;
}

interface DashboardProps {
    filters: { groups: GroupOption[]; activeGroup: number | null };
    top: TopStudent[];
    alerts: Alert[];
    commonErrors: CommonError[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Panel del profesor', href: '/profesor/dashboard' }];

const TYPE_LABEL: Record<string, string> = {
    letra: 'Letra',
    vocal: 'Vocal',
    consonante: 'Consonante',
    silaba: 'Sílaba',
    palabra: 'Palabra',
    comprension: 'Comprensión',
};

export default function Dashboard({ filters, top, alerts, commonErrors }: DashboardProps) {
    const [group, setGroup] = useState<number | null>(filters.activeGroup);

    const applyGroup = (value: number | null) => {
        setGroup(value);
        router.get(
            route('teacher.dashboard'),
            value ? { group: value } : {},
            { preserveScroll: true, preserveState: true },
        );
    };

    const maxFails = Math.max(1, ...commonErrors.map((e) => e.fails));
    const alta = alerts.filter((a) => a.priority === 'alta');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Panel del profesor" />
            <div className="flex h-full flex-1 flex-col gap-5 p-4">
                {/* Encabezado + filtro */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">📊 Monitoreo de aprendizaje</h1>
                        <p className="text-sm font-semibold text-slate-500">
                            {top.length} estudiantes activos · {alerts.length} con alertas de refuerzo ({alta.length} prioritarias)
                        </p>
                    </div>
                    <select
                        value={group ?? ''}
                        onChange={(e) => applyGroup(e.target.value ? Number(e.target.value) : null)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm"
                    >
                        <option value="">Todos los grupos</option>
                        {filters.groups.map((g) => (
                            <option key={g.id} value={g.id}>
                                {g.name} · {g.shift}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                    {/* ============ ALERTAS DE REFUERZO ============ */}
                    <section className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
                        <h2 className="flex items-center gap-2 text-lg font-black text-red-600">
                            <AlertTriangle className="size-5" />
                            Top necesita ayuda
                        </h2>
                        <p className="mb-4 text-xs font-semibold text-slate-400">
                            Detectados por baja tasa de acierto, estancamiento o inactividad (14 días).
                        </p>

                        {alerts.length === 0 ? (
                            <p className="rounded-2xl bg-emerald-50 p-6 text-center font-bold text-emerald-600">
                                🎉 ¡Sin alertas! Todo el grupo avanza bien.
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {alerts.map((a) => (
                                    <li
                                        key={a.student_id}
                                        className={`rounded-2xl border-2 p-4 ${
                                            a.priority === 'alta' ? 'border-red-200 bg-red-50/60' : 'border-amber-200 bg-amber-50/60'
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${
                                                        a.priority === 'alta'
                                                            ? 'bg-red-500 text-white'
                                                            : 'bg-amber-400 text-amber-950'
                                                    }`}
                                                >
                                                    {a.priority}
                                                </span>
                                                <span className="font-black text-slate-800">{a.name}</span>
                                                <span className="text-xs font-bold text-slate-400">
                                                    Nv.{a.level} · {a.group ?? '—'} {a.shift === 'vespertino' ? '🌅' : '☀️'}
                                                </span>
                                            </div>
                                            <span className="text-xs font-black text-slate-500">
                                                {a.accuracy !== null ? `${a.accuracy}% acierto` : '—'} · {a.attempts} intentos
                                                {a.days_inactive !== null && a.days_inactive >= 5 ? ` · inactivo ${a.days_inactive}d` : ''}
                                            </span>
                                        </div>

                                        <ul className="mt-2 flex flex-col gap-0.5 text-sm font-semibold text-slate-600">
                                            {a.reasons.map((r, i) => (
                                                <li key={i}>• {r}</li>
                                            ))}
                                        </ul>

                                        {a.weak_areas.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                <span className="text-xs font-black text-slate-400">Reforzar:</span>
                                                {a.weak_areas.map((w, i) => (
                                                    <span
                                                        key={i}
                                                        className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-red-500 shadow-sm"
                                                        title={`${TYPE_LABEL[w.type] ?? w.type}: ${w.fails} errores`}
                                                    >
                                                        {w.value} · {w.fails}✗
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <div className="flex flex-col gap-5">
                        {/* ============ TOP ESTUDIANTES ============ */}
                        <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
                            <h2 className="flex items-center gap-2 text-lg font-black text-amber-600">
                                <Trophy className="size-5" /> Top estudiantes con mayor progreso
                            </h2>
                            <ol className="mt-4 flex flex-col gap-2">
                                {top.map((s) => (
                                    <li
                                        key={s.id}
                                        className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${
                                            s.rank === 1
                                                ? 'bg-gradient-to-r from-amber-100 to-yellow-50 ring-2 ring-amber-300'
                                                : 'bg-slate-50'
                                        }`}
                                    >
                                        <span className="w-7 text-center font-black text-slate-400">
                                            {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : s.rank}
                                        </span>
                                        <span className="flex-1 font-bold text-slate-700">{s.name}</span>
                                        <span className="text-xs font-black text-violet-500">Nv.{s.level}</span>
                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-700">
                                            {s.xp} XP
                                        </span>
                                        {s.streak > 0 && (
                                            <span className="flex items-center gap-0.5 text-xs font-black text-orange-500">
                                                <Flame className="size-3.5" />
                                                {s.streak}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </section>

                        {/* ============ ERRORES COMUNES ============ */}
                        <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
                            <h2 className="flex items-center gap-2 text-lg font-black text-sky-600">
                                📈 Reporte visual de errores comunes
                            </h2>
                            <p className="mb-4 text-xs font-semibold text-slate-400">
                                Con qué letras/sílabas tropieza el grupo (últimos 30 días).
                            </p>

                            {commonErrors.length === 0 ? (
                                <p className="rounded-2xl bg-sky-50 p-6 text-center font-bold text-sky-500">
                                    Todavía no hay errores registrados.
                                </p>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {commonErrors.map((e, i) => (
                                        <li key={i}>
                                            <div className="mb-1 flex items-baseline justify-between text-sm">
                                                <span className="font-black text-slate-700">
                                                    <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-slate-400">
                                                        {TYPE_LABEL[e.type] ?? e.type}
                                                    </span>
                                                    “{e.value}”
                                                </span>
                                                <span className="font-bold text-slate-400">
                                                    {e.fails} errores · {e.students} niños
                                                </span>
                                            </div>
                                            <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-700"
                                                    style={{ width: `${Math.max(8, (e.fails / maxFails) * 100)}%` }}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
