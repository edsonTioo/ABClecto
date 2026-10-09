<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Level extends Model
{
    protected $fillable = [
        'module',
        'number',
        'title',
        'description',
        'xp_reward',
        'coins_reward',
        'previous_level_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function previousLevel(): BelongsTo
    {
        return $this->belongsTo(Level::class, 'previous_level_id');
    }
}
