import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';

interface LoginForm {
    [key: string]: string;
    login_code: string;
    pin: string;
}

/**
 * Acceso infantil: código de clase (ej. SOFI01) + PIN de 4 dígitos.
 * Lo pidió el profesor para que los juegos no estén abiertos a cualquiera.
 */
export default function StudentLogin() {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        login_code: '',
        pin: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('student.login'), {
            onFinish: () => reset('pin'),
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-violet-50 via-sky-50 to-emerald-50 px-4">
            <Head title="Entrar a mis juegos" />

            <div className="w-full max-w-md rounded-3xl border-4 border-white bg-white/90 p-8 shadow-2xl">
                <div className="text-center">
                    <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-500 text-5xl shadow-lg">
                        🦸
                    </div>
                    <h1 className="mt-4 text-2xl font-black text-violet-900">¡Hola, explorador!</h1>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                        Escribe tu código de clase y el PIN de tu usuario para jugar.
                    </p>
                </div>

                <form className="mt-8 flex flex-col gap-5" onSubmit={submit}>
                    <div className="grid gap-2">
                        <label htmlFor="login_code" className="text-sm font-black text-violet-800">
                            Tu código de clase
                        </label>
                        <input
                            id="login_code"
                            type="text"
                            required
                            autoFocus
                            autoComplete="off"
                            autoCapitalize="characters"
                            value={data.login_code}
                            onChange={(e) => setData('login_code', e.target.value.toUpperCase())}
                            placeholder="SOFI01"
                            className="w-full rounded-2xl border-2 border-violet-200 bg-violet-50 px-4 py-3 text-center text-xl font-black tracking-widest text-violet-900 outline-none focus:border-violet-400"
                        />
                        <InputError message={errors.login_code} />
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="pin" className="text-sm font-black text-violet-800">
                            El PIN de tu usuario
                        </label>
                        <span className="-mt-1 text-xs font-bold text-slate-400">Tu contraseña para acceder (4 dígitos)</span>
                        <input
                            id="pin"
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            required
                            autoComplete="off"
                            value={data.pin}
                            onChange={(e) => setData('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="••••"
                            className="w-full rounded-2xl border-2 border-violet-200 bg-violet-50 px-4 py-3 text-center text-2xl font-black tracking-[0.5em] text-violet-900 outline-none focus:border-violet-400"
                        />
                        <InputError message={errors.pin} />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3.5 text-lg font-black text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
                    >
                        {processing && <LoaderCircle className="h-5 w-5 animate-spin" />} Jugar 🎮
                    </button>
                </form>

                <p className="mt-6 text-center text-xs font-bold text-slate-400">
                    ¿Eres profesor?{' '}
                    <TextLink href={route('login')} className="text-violet-600">
                        Entra aquí
                    </TextLink>
                </p>
            </div>
        </div>
    );
}
