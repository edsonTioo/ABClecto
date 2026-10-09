<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('duels', function (Blueprint $table) {
            $table->id();
            $table->uuid('public_id')->unique(); // identificador del canal de Reverb
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('challenger_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('opponent_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('activity_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('status', ['esperando', 'en_curso', 'finalizado', 'abandonado'])->default('esperando');
            $table->json('words')->nullable(); // palabra(s) asignadas al duelo
            $table->unsignedSmallInteger('challenger_score')->default(0);
            $table->unsignedSmallInteger('opponent_score')->default(0);
            $table->foreignId('winner_id')->nullable()->constrained('students')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['group_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('duels');
    }
};
