<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('level_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['bloqueado', 'disponible', 'en_curso', 'completado'])->default('bloqueado');
            $table->unsignedSmallInteger('best_score')->default(0);
            $table->unsignedSmallInteger('attempts_count')->default(0);
            $table->unsignedInteger('total_xp')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('last_played_at')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'level_id']);
            $table->index(['student_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_progress');
    }
};
