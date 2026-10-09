<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Student extends Model
{
    protected $fillable = [
        'group_id',
        'name',
        'age',
        'grade',
        'login_code',
        'pin_hash',
        'xp',
        'coins',
        'level',
        'current_streak',
        'longest_streak',
        'last_active_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'last_active_at' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function avatar(): HasOne
    {
        return $this->hasOne(StudentAvatar::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(StudentProgress::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class);
    }
}
