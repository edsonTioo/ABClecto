<?php

namespace Database\Seeders;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Cuenta docente real solicitada por el usuario:
 *   wendy@gmail.com / 123456789 (rol teacher + perfil Teacher).
 *
 * Idempotente: se puede repetir sin duplicar cuentas.
 */
class WendyTeacherSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'wendy@gmail.com'],
            [
                'name' => 'Wendy',
                'password' => '123456789', // User castea password con 'hashed'
                'role' => 'teacher',
                'is_active' => true,
            ],
        );

        Teacher::updateOrCreate(
            ['user_id' => $user->id],
            [
                'school_name' => 'Escuela ABClecto',
                'title' => 'Profesora',
            ],
        );
    }
}
