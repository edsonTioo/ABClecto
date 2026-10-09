<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained()->cascadeOnDelete();
            $table->enum('kind', ['image', 'audio']);
            $table->string('path'); // ruta en disco público (storage)
            $table->string('original_name');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->timestamps();

            $table->index(['teacher_id', 'kind']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_assets');
    }
};
