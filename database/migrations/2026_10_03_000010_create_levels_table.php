<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('levels', function (Blueprint $table) {
            $table->id();
            $table->enum('module', [
                'abecedario',   // vocales/consonantes y sombras
                'silabas',      // sopa de letras, arrastrar letras
                'palabras',     // construcción de palabras
                'oraciones',    // ordenar palabras en oraciones
                'comprension',  // lectura + trivia
            ]);
            $table->unsignedSmallInteger('number'); // 1, 2, 3...
            $table->string('title');
            $table->string('description')->nullable();
            $table->unsignedInteger('xp_reward')->default(50);
            $table->unsignedInteger('coins_reward')->default(10);
            $table->foreignId('previous_level_id')->nullable()->constrained('levels')->nullOnDelete(); // encadenamiento
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['module', 'number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('levels');
    }
};
