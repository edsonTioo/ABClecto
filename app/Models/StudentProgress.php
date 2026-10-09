<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentProgress extends Model
{
    protected $fillable = [
        'student_id',
        'level_id',
        'status',
        'best_score',
        'attempts_count',
        'total_xp',
        'completed_at',
        'last_played_at',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
            'last_played_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }
}
