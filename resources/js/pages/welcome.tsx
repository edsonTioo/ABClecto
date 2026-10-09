import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const FEATURES = [
    {
        icon: '🎮',
        title: '6 minijuegos',
        text: 'Sopa de letras, Sombras de Letras, Construcción, Completar, Unir imagen y Comprensión lectora.',
        color: 'from-violet-400 to-fuchsia-500',
    },
    {
        icon: '⭐',
        title: 'XP, monedas y estrellas',
        text: 'Cada partida premia el esfuerzo: sube de nivel, gana monedas y desbloquea nuevas rondas.',
        color: 'from-amber-400 to-orange-500',
    },
    {
        icon: '📈',
        title: 'Panel del profesor',
        text: 'Analítica en vivo, alertas de estudiantes en riesgo y errores comunes de todo el grupo.',
        color: 'from-sky-400 to-blue-500',
    },
    {
        icon: '🔑',
        title: 'Acceso con código + PIN',
        text: 'Los alumnos entran con su código de clase y PIN de 4 dígitos: seguro y sin correos.',
        color: 'from-emerald-400 to-teal-500',
    },
];

const STEPS = [
    { n: '1', title: 'El profesor crea el grupo', text: 'Da de alta alumnos con grado, grupo y turno, y reparte su código + PIN.' },
    { n: '2', title: 'El estudiante entra a jugar', text: 'Entra con su código y PIN, elige un minijuego y completa los niveles.' },
    { n: '3', title: 'Todo se mide solo', text: 'XP, estrellas, rachas y errores quedan registrados para el panel del profesor.' },
];

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="ABClecto — Lectoescritura gamificada">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=baloo-2:600,700,800|nunito:400,600,700,800&display=swap" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-gradient-to-b from-violet-50 via-sky-50 to-emerald-50 text-slate-800">
                {/* ============ NAV ============ */}
                <header className="sticky top-0 z-40 border-b-4 border-white/60 bg-white/80 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                        <Link href={route('home')} className="flex items-center gap-2">
                            <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl shadow-lg">
                                📚
                            </span>
                            <span className="text-2xl font-extrabold tracking-tight text-violet-700">
                                ABC<span className="text-fuchsia-500">lecto</span>
                            </span>
                        </Link>

                        <nav className="flex flex-wrap items-center gap-2 text-sm font-bold">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-full border-2 border-violet-200 bg-white px-5 py-2 text-violet-600 transition hover:bg-violet-50"
                                >
                                    Mi panel
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="rounded-full border-2 border-violet-200 bg-white px-5 py-2 text-violet-600 transition hover:bg-violet-50"
                                >
                                    Soy profesor
                                </Link>
                            )}
                            <Link
                                href={route('student.login')}
                                className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-white shadow-lg transition hover:brightness-110"
                            >
                                🎮 Soy estudiante
                            </Link>
                        </nav>
                    </div>
                </header>

                {/* ============ HERO ============ */}
                <main className="mx-auto max-w-6xl px-4 sm:px-6">
                    <section className="flex flex-col items-center gap-8 py-14 text-center lg:flex-row lg:gap-14 lg:py-20 lg:text-left">
                        <div className="flex-1">
                            <span className="inline-block rounded-full border-2 border-violet-200 bg-white px-4 py-1.5 text-xs font-extrabold tracking-wide text-violet-600 uppercase">
                                Plataforma de lectoescritura gamificada
                            </span>
                            <h1
                                className="mt-4 text-4xl leading-tight font-extrabold text-violet-900 sm:text-5xl lg:text-6xl"
                                style={{ fontFamily: "'Baloo 2', 'Nunito', sans-serif" }}
                            >
                                Aprender a leer y escribir
                                <br />
                                <span className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                                    ¡nunca fue tan divertido!
                                </span>
                            </h1>
                            <p className="mt-4 max-w-xl text-base font-semibold text-slate-500 sm:text-lg">
                                ABClecto convierte las clases en una aventura: minijuegos, niveles, XP y estrellas para los estudiantes, y
                                analítica en tiempo real para el profesor.
                            </p>

                            <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                                <Link
                                    href={route('student.login')}
                                    className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-7 py-4 text-lg font-extrabold text-white shadow-xl shadow-violet-200 transition hover:brightness-110 active:scale-95"
                                >
                                    🎮 Entrar a jugar
                                </Link>
                                <Link
                                    href={auth.user ? route('teacher.dashboard') : route('login')}
                                    className="rounded-2xl border-4 border-violet-200 bg-white px-7 py-4 text-lg font-extrabold text-violet-600 transition hover:border-violet-400 active:scale-95"
                                >
                                    👩‍🏫 Soy profesor
                                </Link>
                            </div>

                            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-bold text-slate-400 lg:justify-start">
                                <span>✅ Sin correos para los niños</span>
                                <span>🔒 Acceso con PIN</span>
                                <span>📊 Panel docente</span>
                            </div>
                        </div>

                        {/* Tarjeta decorativa */}
                        <div className="w-full max-w-sm shrink-0">
                            <div className="rotate-1 rounded-[2rem] border-4 border-white bg-white p-6 shadow-2xl shadow-violet-200">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-500 text-3xl shadow-lg">
                                        🦸
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-violet-900">¡Hola, Diego!</p>
                                        <p className="text-xs font-bold text-slate-400">Nivel 3 · Racha 🔥 1</p>
                                    </div>
                                </div>
                                <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400" />
                                </div>
                                <p className="mt-1 text-right text-xs font-extrabold text-emerald-600">65/100 XP</p>

                                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                    <div className="rounded-2xl bg-amber-50 py-3">
                                        <p className="text-xl">🪙</p>
                                        <p className="text-sm font-extrabold text-amber-600">137</p>
                                    </div>
                                    <div className="rounded-2xl bg-violet-50 py-3">
                                        <p className="text-xl">⭐</p>
                                        <p className="text-sm font-extrabold text-violet-600">45</p>
                                    </div>
                                    <div className="rounded-2xl bg-rose-50 py-3">
                                        <p className="text-xl">🔥</p>
                                        <p className="text-sm font-extrabold text-rose-500">1</p>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/60 p-3 text-center">
                                    <p className="text-sm font-extrabold text-violet-700">🌑 Sombras de Letras</p>
                                    <p className="text-xs font-bold text-slate-400">Mira la sombra y toca la letra</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ============ BENEFICIOS ============ */}
                    <section className="pb-14">
                        <h2 className="text-center text-3xl font-extrabold text-violet-900">Todo en un solo lugar</h2>
                        <p className="mt-2 text-center font-semibold text-slate-500">Hecho para el aula, pensado para los niños.</p>

                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {FEATURES.map((f) => (
                                <div
                                    key={f.title}
                                    className="rounded-3xl border-4 border-white bg-white p-5 shadow-lg shadow-violet-100 transition hover:-translate-y-1"
                                >
                                    <div
                                        className={`mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} text-2xl shadow-md`}
                                    >
                                        {f.icon}
                                    </div>
                                    <h3 className="text-lg font-extrabold text-violet-900">{f.title}</h3>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">{f.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ============ CÓMO FUNCIONA ============ */}
                    <section className="pb-14">
                        <h2 className="text-center text-3xl font-extrabold text-violet-900">¿Cómo funciona?</h2>
                        <div className="mt-8 grid gap-4 md:grid-cols-3">
                            {STEPS.map((s) => (
                                <div key={s.n} className="relative rounded-3xl border-4 border-white bg-white/90 p-6 shadow-lg shadow-sky-100">
                                    <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-lg font-extrabold text-white shadow-md">
                                        {s.n}
                                    </span>
                                    <h3 className="mt-3 text-lg font-extrabold text-violet-900">{s.title}</h3>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">{s.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ============ CTA FINAL ============ */}
                    <section className="pb-16">
                        <div className="rounded-[2.5rem] border-4 border-white bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-500 p-8 text-center text-white shadow-2xl sm:p-12">
                            <h2 className="text-3xl font-extrabold sm:text-4xl">¿Listo para empezar la aventura?</h2>
                            <p className="mt-2 font-semibold text-white/85">
                                Los estudiantes entran con su código de clase, y tú sigues su progreso desde tu panel.
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <Link
                                    href={route('student.login')}
                                    className="rounded-2xl bg-white px-6 py-3.5 font-extrabold text-violet-600 shadow-lg transition hover:bg-violet-50 active:scale-95"
                                >
                                    🎮 Entrar a jugar
                                </Link>
                                <Link
                                    href={auth.user ? route('dashboard') : route('login')}
                                    className="rounded-2xl border-4 border-white/70 px-6 py-3.5 font-extrabold text-white transition hover:bg-white/10 active:scale-95"
                                >
                                    👩‍🏫 Acceso del profesor
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>

                {/* ============ FOOTER ============ */}
                <footer className="border-t-4 border-white bg-white/70 py-6">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm font-bold text-slate-400 sm:px-6">
                        <span>
                            © {new Date().getFullYear()} <span className="text-violet-600">ABClecto</span> · Lectoescritura gamificada
                        </span>
                        <div className="flex gap-4">
                            <Link href={route('login')} className="transition hover:text-violet-600">
                                Profesores
                            </Link>
                            <Link href={route('student.login')} className="transition hover:text-violet-600">
                                Estudiantes
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
