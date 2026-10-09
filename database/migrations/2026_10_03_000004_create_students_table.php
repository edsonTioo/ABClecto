<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->unsignedTinyInteger('age');
            $table->string('grade')->nullable(); // "1º" ... "6º" de primaria

            // Login infantil: código de clase + PIN de 4 dígitos (sin email)
            $table->string('login_code', 20)->unique();
            $table->string('pin_hash')->nullable();

            // Gamificación (denormalizado para lecturas rápidas del dashboard)
            $table->unsignedBigInteger('xp')->default(0);
            $table->unsignedInteger('coins')->default(0);
            $table->unsignedSmallInteger('level')->default(1); // nivel del jugador
            $table->unsignedSmallInteger('current_streak')->default(0); // racha de días
            $table->unsignedSmallInteger('longest_streak')->default(0);
            $table->date('last_active_at')->nullable();

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['group_id', 'is_active']);
            $table->index('xp'); // top estudiantes por XP
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
