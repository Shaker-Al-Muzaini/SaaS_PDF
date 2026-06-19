<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'slug',
    'des',
    'price',
    'pdf_limit',
    'features',
    'is_active',
])]

class Plan extends Model
{
    use HasFactory;

    public function users():HasMany
    {
        return $this->hasMany(User::class);
    }

}
