<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('error_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('attempt_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('activity_id')->nullable()->constrained()->nullOnDelete();

            // Qué falló: letra, sílaba o palabra concreta
            $table->string('target_type'); // 'letra' | 'consonante' | 'vocal' | 'silaba' | 'palabra'
            $table->string('target_value', 40); // "r", "rr", "ma", "perro"
            $table->string('error_kind')->nullable(); // 'confusion_visual', 'orden', 'tiempo', 'omite'

            $table->timestamps();

            // Clave para el reporte "errores comunes del grupo"
            $table->index(['target_type', 'target_value']);
            $table->index(['student_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('error_logs');
    }
};
