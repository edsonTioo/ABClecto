<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_avatar_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('avatar_item_id')->constrained()->cascadeOnDelete();
            $table->enum('source', ['tienda', 'recompensa', 'regalo'])->default('tienda');
            $table->timestamp('acquired_at')->useCurrent();
            $table->timestamps();

            $table->unique(['student_id', 'avatar_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_avatar_items');
    }
};
