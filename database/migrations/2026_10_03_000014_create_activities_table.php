<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('level_id')->constrained()->cascadeOnDelete();
            $table->foreignId('minigame_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('order'); // orden dentro del nivel
            $table->unsignedSmallInteger('difficulty')->default(1); // 1-5, configurable por profesor
            $table->json('config')->nullable(); // tiempo límite, número de letras, pistas, etc.

            // Contenido vinculado (polimórfico ligero: vocabulario o lectura)
            $table->string('content_type')->nullable(); // 'vocabulary' | 'reading' | null (generado)
            $table->unsignedBigInteger('content_id')->nullable();

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['level_id', 'is_active']);
            $table->index(['content_type', 'content_id']);
            $table->unique(['level_id', 'minigame_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
