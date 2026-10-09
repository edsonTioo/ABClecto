<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('content');
            $table->unsignedSmallInteger('difficulty')->default(1);
            $table->string('grade_target')->nullable();
            $table->foreignId('image_media_id')->nullable()->constrained('media_assets')->nullOnDelete();
            $table->foreignId('audio_media_id')->nullable()->constrained('media_assets')->nullOnDelete(); // audio grabado; si es null se usa Web Speech API
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['teacher_id', 'group_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('readings');
    }
};
