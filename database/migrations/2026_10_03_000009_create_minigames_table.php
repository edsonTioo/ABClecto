<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('minigames', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique(); // sopa-letras, sombras-letras, construccion, completar, match-visual, comprension
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('icon')->nullable(); // ruta de icono o clase Lucide
            $table->unsignedSmallInteger('default_difficulty')->default(1); // 1-5
            $table->json('settings_schema')->nullable(); // opciones que el profesor puede configurar
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minigames');
    }
};
