<?php


use App\Models\PdfSummary;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        $user = auth()->user();

        $data = [
            'user' => $user->load('plan'),
        ];

        // Add admin statistics if user is admin
        if ($user->isAdmin()) {
            $data['adminStats'] = [
                'totalUsers' =>User::count(),
                'activeSubscriptions' =>User::whereNotNull('stripe_subscription_id')->count(),
                'totalPdfs' =>PdfSummary::count(),
                'plans' =>Plan::withCount('users')->get(),
            ];
        } else {
            // Add user statistics
            $data['userStats'] = [
                'pdfCount' => $user->pdf_count ?? 0,
                'pdfLimit' => $user->plan?->pdf_limit ?? 0,
                'planName' => $user->plan?->name ?? 'No Plan',
                'totalSummaries' => $user->pdfSummaries()->count(),
            ];
        }

        return Inertia::render('User/Views/pages/dashboard', $data);
    })->name('dashboard');
});
