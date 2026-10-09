<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reading_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reading_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['opcion_multiple', 'verdadero_falso', 'respuesta_escrita']);
            $table->string('question');
            $table->json('options')->nullable(); // ["perro","gato","pez"]
            $table->string('correct_answer');
            $table->unsignedSmallInteger('xp_reward')->default(20);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['reading_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reading_questions');
    }
};
