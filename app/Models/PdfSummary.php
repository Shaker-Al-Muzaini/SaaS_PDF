<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
#[Fillable([
    'user_id',
    'filename',
    'filesize',
    'summary',
])]
class PdfSummary extends Model
{
    use HasFactory;

    function user()
    {
        return $this->belongsTo(User::class);

    }

}
