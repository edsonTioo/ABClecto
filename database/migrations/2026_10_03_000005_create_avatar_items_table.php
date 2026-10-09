<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('avatar_items', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // "Gorro de Fuego"
            $table->enum('category', ['gorro', 'capa', 'color', 'accesorio']);
            $table->unsignedInteger('price')->default(0); // monedas virtuales
            $table->unsignedSmallInteger('required_level')->default(1);
            $table->string('image_path'); // SVG/PNG del accesorio
            $table->string('preview_color')->nullable(); // para items de tipo 'color'
            $table->enum('rarity', ['comun', 'raro', 'epico', 'legendario'])->default('comun');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['category', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('avatar_items');
    }
};
