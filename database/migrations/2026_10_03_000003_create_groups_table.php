<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // ej. "3º A"
            $table->enum('shift', ['matutino', 'vespertino'])->default('matutino');
            $table->string('grade')->nullable(); // grado escolar asignado
            $table->string('join_code', 12)->unique(); // código para que el niño se una
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['teacher_id', 'shift']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('groups');
    }
};
