import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type InertiaPayload } from '@/types/inertia';
import { Head, router, usePage } from '@inertiajs/react';
import { Copy, Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface StudentRow {
    id: number;
    name: string;
    age: number;
    grade: string;
    login_code: string;
    group_id: number | null;
    group: string | null;
    shift: string | null;
    xp: number;
    level: number;
    is_active: boolean;
    has_pin: boolean;
}

interface GroupRow {
    id: number;
    name: string;
    shift: string;
    grade: string;
    join_code: string;
    students_count: number;
}

interface StudentsProps {
    students: StudentRow[];
    groups: GroupRow[];
}

interface NewStudent {
    name: string;
    age: number;
    grade: string;
    group_id: string;
    login_code: string;
    pin: string;
}

interface EditStudent {
    id: number;
    name: string;
    age: number;
    grade: string;
    group_id: string;
    is_active: boolean;
    pin: string;
    new_code: string;
}

interface NewGroup {
    name: string;
    shift: string;
    grade: string;
}

const GRADES = ['1º Primaria', '2º Primaria', '3º Primaria', '4º Primaria', '5º Primaria', '6º Primaria'];
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Estudiantes', href: '/profesor/estudiantes' }];
const SHIFTS = [
    { value: 'matutino', label: '☀️ Matutino' },
    { value: 'vespertino', label: '🌆 Vespertino' },
    { value: 'nocturno', label: '🌙 Nocturno' },
];

const emptyStudent: NewStudent = { name: '', age: 7, grade: '2º Primaria', group_id: '', login_code: '', pin: '1234' };

const emptyGroup: NewGroup = { name: '', shift: 'matutino', grade: '2º Primaria' };

const inputCls =
    'w-full rounded-xl border-2 border-violet-100 bg-violet-50 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-violet-400';
const labelCls = 'text-xs font-black uppercase tracking-wide text-violet-700';

export default function Students({ students, groups }: StudentsProps) {
    const { flash } = usePage().props as unknown as { flash?: { success?: string | null } };
    const [showNew, setShowNew] = useState(false);
    const [showGroup, setShowGroup] = useState(false);
    const [edit, setEdit] = useState<EditStudent | null>(null);
    const [filter, setFilter] = useState('all');
    const [query, setQuery] = useState('');
    const [toast, setToast] = useState<string | null>(null);
    const [form, setForm] = useState<NewStudent>(emptyStudent);
    const [group, setGroup] = useState<NewGroup>(emptyGroup);

    useEffect(() => {
        if (!flash?.success) return;
        setToast(flash.success);
        const t = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(t);
    }, [flash?.success]);

    const visible = useMemo(() => {
        return students.filter((s) => {
            const okGroup = filter === 'all' || String(s.group_id) === filter;
            const okQuery = !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.login_code.toLowerCase().includes(query.toLowerCase());
            return okGroup && okQuery;
        });
    }, [students, filter, query]);

    const createStudent = () => {
        if (!form.group_id) return;
        router.post(
            route('teacher.students.store'),
            {
                name: form.name,
                age: form.age,
                grade: form.grade,
                group_id: Number(form.group_id),
                pin: form.pin,
                login_code: form.login_code || null,
            } as unknown as InertiaPayload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setForm(emptyStudent);
                    setShowNew(false);
                },
            },
        );
    };

    const createGroup = () => {
        router.post(
            route('teacher.groups.store'),
            { name: group.name, shift: group.shift, grade: group.grade } as unknown as InertiaPayload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setGroup(emptyGroup);
                    setShowGroup(false);
                },
            },
        );
    };

    const saveEdit = () => {
        if (!edit) return;
        router.put(
            route('teacher.students.update', edit.id),
            {
                name: edit.name,
                age: edit.age,
                grade: edit.grade,
                group_id: Number(edit.group_id),
                is_active: edit.is_active,
                pin: edit.pin || null,
                new_code: edit.new_code || null,
            } as unknown as InertiaPayload,
            { preserveScroll: true, onSuccess: () => setEdit(null) },
        );
    };

    const remove = (s: StudentRow) => {
        if (!confirm(`¿Eliminar a ${s.name}? Si tiene partidas se desactivará en su lugar.`)) return;
        router.delete(route('teacher.students.destroy', s.id), { preserveScroll: true });
    };

    const copy = (text: string) => navigator.clipboard?.writeText(text);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Estudiantes" />

            <div className="mx-auto max-w-6xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-black text-violet-900">👥 Estudiantes</h1>
                        <p className="text-sm font-semibold text-slate-500">
                            Crea alumnos, asígnales grado, grupo y turno, y reparte su código + PIN para entrar a los juegos.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowGroup((v) => !v)}
                            className="flex items-center gap-1.5 rounded-xl border-2 border-violet-200 bg-white px-4 py-2.5 text-sm font-black text-violet-600 transition hover:bg-violet-50"
                        >
                            <Plus className="size-4" /> Nuevo grupo
                        </button>
                        <button
                            onClick={() => setShowNew(true)}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-black text-white shadow-lg transition active:scale-95"
                        >
                            <Plus className="size-4" /> Nuevo estudiante
                        </button>
                    </div>
                </div>

                {/* ====== NUEVO GRUPO ====== */}
                {showGroup && (
                    <div className="mt-4 rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/60 p-4">
                        <p className="mb-3 text-sm font-black text-violet-800">Crear grupo / turno</p>
                        <div className="grid gap-3 sm:grid-cols-4">
                            <input
                                className={inputCls}
                                placeholder="Nombre (ej. 2º B)"
                                value={group.name}
                                onChange={(e) => setGroup({ ...group, name: e.target.value })}
                            />
                            <select className={inputCls} value={group.grade} onChange={(e) => setGroup({ ...group, grade: e.target.value })}>
                                {GRADES.map((g) => (
                                    <option key={g}>{g}</option>
                                ))}
                            </select>
                            <select className={inputCls} value={group.shift} onChange={(e) => setGroup({ ...group, shift: e.target.value })}>
                                {SHIFTS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={createGroup}
                                className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white transition active:scale-95"
                            >
                                Crear grupo
                            </button>
                        </div>
                    </div>
                )}

                {/* ====== FILTROS ====== */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                    <select className={`${inputCls} w-auto`} value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="all">Todos los grupos ({students.length})</option>
                        {groups.map((g) => (
                            <option key={g.id} value={String(g.id)}>
                                {g.name} · {g.shift} ({g.students_count})
                            </option>
                        ))}
                    </select>
                    <input
                        className={`${inputCls} w-56`}
                        placeholder="Buscar por nombre o código…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                {/* ====== LISTA ====== */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((s) => (
                        <div
                            key={s.id}
                            className={`rounded-2xl border-2 bg-white p-4 shadow-sm transition ${
                                s.is_active ? 'border-violet-100 hover:border-violet-300' : 'border-slate-200 opacity-60'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-500 text-xl text-white">
                                    {s.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-black text-slate-800">{s.name}</p>
                                    <p className="text-xs font-bold text-slate-400">
                                        {s.age} años · {s.grade}
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-black text-violet-700">
                                            {s.group ?? 'sin grupo'} · {s.shift ?? '—'}
                                        </span>
                                        {!s.is_active && (
                                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-black text-slate-500">
                                                oculto
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-2">
                                <button
                                    onClick={() => copy(s.login_code)}
                                    title="Copiar código"
                                    className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-sm font-black tracking-widest text-slate-700 transition hover:bg-slate-200"
                                >
                                    {s.login_code}
                                    <Copy className="size-3.5 text-slate-400" />
                                </button>
                                <span className="text-xs font-black text-amber-600">
                                    ⭐ {s.xp} XP · Nv. {s.level}
                                </span>
                            </div>

                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() =>
                                        setEdit({
                                            id: s.id,
                                            name: s.name,
                                            age: s.age,
                                            grade: s.grade,
                                            group_id: String(s.group_id ?? ''),
                                            is_active: s.is_active,
                                            pin: '',
                                            new_code: '',
                                        })
                                    }
                                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-violet-50 py-2 text-xs font-black text-violet-600 transition hover:bg-violet-100"
                                >
                                    <Pencil className="size-3.5" /> Editar
                                </button>
                                <button
                                    onClick={() => remove(s)}
                                    className="flex items-center justify-center rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-500 transition hover:bg-rose-100"
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {visible.length === 0 && (
                        <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center font-black text-slate-400">
                            <Users className="mx-auto mb-2 size-8" /> No hay estudiantes con ese filtro.
                        </div>
                    )}
                </div>

                {/* ====== MODAL: NUEVO ESTUDIANTE ====== */}
                {showNew && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-black text-violet-900">✨ Nuevo estudiante</h2>
                                <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="size-5" />
                                </button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="grid gap-1 sm:col-span-2">
                                    <span className={labelCls}>Nombre</span>
                                    <input
                                        className={inputCls}
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Ej. Lucía"
                                    />
                                </label>
                                <label className="grid gap-1">
                                    <span className={labelCls}>Edad</span>
                                    <input
                                        type="number"
                                        min={4}
                                        max={12}
                                        className={inputCls}
                                        value={form.age}
                                        onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                                    />
                                </label>
                                <label className="grid gap-1">
                                    <span className={labelCls}>Grado</span>
                                    <select className={inputCls} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                                        {GRADES.map((g) => (
                                            <option key={g}>{g}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="grid gap-1 sm:col-span-2">
                                    <span className={labelCls}>Grupo y turno</span>
                                    <select
                                        className={inputCls}
                                        value={form.group_id}
                                        onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                                    >
                                        <option value="">— Selecciona un grupo —</option>
                                        {groups.map((g) => (
                                            <option key={g.id} value={String(g.id)}>
                                                {g.name} · {g.shift} · {g.grade}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="grid gap-1">
                                    <span className={labelCls}>Código de clase (opcional)</span>
                                    <input
                                        className={`${inputCls} font-mono uppercase tracking-widest`}
                                        value={form.login_code}
                                        onChange={(e) => setForm({ ...form, login_code: e.target.value.toUpperCase() })}
                                        placeholder="AUTO"
                                    />
                                </label>
                                <label className="grid gap-1">
                                    <span className={labelCls}>PIN de 4 dígitos</span>
                                    <input
                                        className={`${inputCls} font-mono tracking-[0.4em]`}
                                        inputMode="numeric"
                                        maxLength={4}
                                        value={form.pin}
                                        onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                    />
                                </label>
                            </div>

                            <div className="mt-5 flex gap-3">
                                <button onClick={() => setShowNew(false)} className="flex-1 rounded-xl border-2 border-slate-200 py-3 font-black text-slate-500">
                                    Cancelar
                                </button>
                                <button
                                    onClick={createStudent}
                                    disabled={!form.name || !form.group_id || form.pin.length !== 4}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-black text-white shadow-lg transition active:scale-95 disabled:opacity-50"
                                >
                                    Crear estudiante
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ====== MODAL: EDITAR ESTUDIANTE ====== */}
                {edit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-black text-violet-900">✏️ Editar estudiante</h2>
                                <button onClick={() => setEdit(null)} className="text-slate-400 hover:text-slate-600">
                                    <X className="size-5" />
                                </button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="grid gap-1 sm:col-span-2">
                                    <span className={labelCls}>Nombre</span>
                                    <input className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                                </label>
                                <label className="grid gap-1">
                                    <span className={labelCls}>Edad</span>
                                    <input
                                        type="number"
                                        min={4}
                                        max={12}
                                        className={inputCls}
                                        value={edit.age}
                                        onChange={(e) => setEdit({ ...edit, age: Number(e.target.value) })}
                                    />
                                </label>
                                <label className="grid gap-1">
                                    <span className={labelCls}>Grado</span>
                                    <select className={inputCls} value={edit.grade} onChange={(e) => setEdit({ ...edit, grade: e.target.value })}>
                                        {GRADES.map((g) => (
                                            <option key={g}>{g}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="grid gap-1 sm:col-span-2">
                                    <span className={labelCls}>Grupo y turno</span>
                                    <select
                                        className={inputCls}
                                        value={edit.group_id}
                                        onChange={(e) => setEdit({ ...edit, group_id: e.target.value })}
                                    >
                                        <option value="">— Sin grupo —</option>
                                        {groups.map((g) => (
                                            <option key={g.id} value={String(g.id)}>
                                                {g.name} · {g.shift} · {g.grade}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="grid gap-1">
                                    <span className={labelCls}>Nuevo PIN (vacío = no cambiar)</span>
                                    <input
                                        className={`${inputCls} font-mono tracking-[0.4em]`}
                                        inputMode="numeric"
                                        maxLength={4}
                                        placeholder="••••"
                                        value={edit.pin}
                                        onChange={(e) => setEdit({ ...edit, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                    />
                                </label>
                                <label className="grid gap-1">
                                    <span className={labelCls}>Nuevo código (vacío = mantener)</span>
                                    <input
                                        className={`${inputCls} font-mono uppercase tracking-widest`}
                                        value={edit.new_code}
                                        onChange={(e) => setEdit({ ...edit, new_code: e.target.value.toUpperCase() })}
                                    />
                                </label>
                                <label className="flex items-center gap-2 sm:col-span-2">
                                    <input
                                        type="checkbox"
                                        checked={edit.is_active}
                                        onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })}
                                        className="size-4 accent-violet-600"
                                    />
                                    <span className="text-sm font-black text-slate-600">Visible para entrar a los juegos</span>
                                </label>
                            </div>

                            <div className="mt-5 flex gap-3">
                                <button onClick={() => setEdit(null)} className="flex-1 rounded-xl border-2 border-slate-200 py-3 font-black text-slate-500">
                                    Cancelar
                                </button>
                                <button
                                    onClick={saveEdit}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 font-black text-white shadow-lg transition active:scale-95"
                                >
                                    💾 Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ====== TOAST ====== */}
                {toast && (
                    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-xl">
                        ✅ {toast}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
