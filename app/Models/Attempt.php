<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attempt extends Model
{
    protected $fillable = [
        'student_id',
        'activity_id',
        'score',
        'correct_count',
        'wrong_count',
        'duration_ms',
        'is_completed',
        'xp_earned',
        'coins_earned',
        'details',
    ];

    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
            'details' => 'array',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }
}
