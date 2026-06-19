<?php

use App\Models\Plan;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    $user = auth()->user();
    $userStats = null;

    if ($user) {
        $user->load('plan');
        $userStats = [
            'pdfCount' => $user->pdf_count ?? 0,
            'pdfLimit' => $user->plan?->pdf_limit ?? 0,
            'canUpload' => $user->canSummarizePdf(),
        ];
    }

    return Inertia::render('User/Views/pages/welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'plans' => Plan::where('is_active', true)->orderBy('price')->get(),
        'auth' => [
            'user' => $user,
        ],
        'userStats' => $userStats,
    ]);
})->name('home');
