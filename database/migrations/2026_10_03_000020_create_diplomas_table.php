<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diplomas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('achievement_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('description')->nullable();
            $table->string('pdf_path')->nullable(); // storage/app/public/diplomas/...
            $table->timestamp('issued_at')->useCurrent();
            $table->timestamps();

            $table->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diplomas');
    }
};
