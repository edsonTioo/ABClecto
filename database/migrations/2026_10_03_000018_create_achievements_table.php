<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // dominar_vocales, primera_palabra, racha_7...
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('icon')->nullable();
            $table->enum('type', ['hito', 'racha', 'dominio', 'social'])->default('hito');
            $table->json('criteria')->nullable(); // {"module":"abecedario","required_score":90}
            $table->unsignedInteger('xp_reward')->default(0);
            $table->unsignedInteger('coins_reward')->default(0);
            $table->boolean('generates_diploma')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('student_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('achievement_id')->constrained()->cascadeOnDelete();
            $table->timestamp('unlocked_at')->useCurrent();
            $table->timestamps();

            $table->unique(['student_id', 'achievement_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_achievements');
        Schema::dropIfExists('achievements');
    }
};
