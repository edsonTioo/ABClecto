<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $this->call([
            GamesDemoSeeder::class,       // 6 minijuegos × 10 niveles
            AnalyticsDemoSeeder::class,   // grupo, estudiantes, intentos y errores demo
            WendyTeacherSeeder::class,    // cuenta docente: wendy@gmail.com / 123456789
        ]);
    }
}
