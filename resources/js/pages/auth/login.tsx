import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Panel del profesor" description="Ingresa tu correo y tu contraseña para acceder a ABClecto">
            <Head title="Iniciar sesión" />

            <div className="rounded-3xl border-4 border-white bg-white/90 p-6 shadow-xl shadow-violet-100">
                <form className="flex flex-col gap-5" onSubmit={submit}>
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="font-bold text-violet-800">
                            Correo electrónico
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="profesor@correo.com"
                            className="rounded-xl border-2 border-violet-100 bg-violet-50 py-5 font-semibold focus:border-violet-400"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password" className="font-bold text-violet-800">
                                Contraseña
                            </Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="ml-auto text-sm font-semibold text-violet-600" tabIndex={5}>
                                    ¿La olvidaste?
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            className="rounded-xl border-2 border-violet-100 bg-violet-50 py-5 font-semibold focus:border-violet-400"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox id="remember" name="remember" tabIndex={3} />
                        <Label htmlFor="remember" className="font-semibold text-slate-600">
                            Recordarme
                        </Label>
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-5 text-base font-extrabold shadow-lg hover:brightness-110"
                        tabIndex={4}
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Entrar 🚀
                    </Button>
                </form>

                <div className="mt-5 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/60 p-3 text-center text-sm font-semibold text-slate-500">
                    🧒 ¿Eres estudiante?{' '}
                    <TextLink href={route('student.login')} className="font-extrabold text-violet-600" tabIndex={6}>
                        Entra aquí con tu código y PIN
                    </TextLink>
                </div>
            </div>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
