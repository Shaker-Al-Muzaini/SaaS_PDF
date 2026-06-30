<?php

use App\Models\Plan;
use Controllers\SubscriptionController;
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

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('User/Views/pages/dashboard');
    })->name('dashboard');
});

Route::get('/checkout/{slug}', function ($slug) {
    $plan = Plan::where('slug', $slug)->where('is_active', true)->firstOrFail();

    return Inertia::render('User/Views/pages/checkout', [
        'plan' => $plan,
        'stripeKey' => config('services.stripe.key'),
    ]);
})->name('checkout');

Route::post('/subscription/create-payment-intent', [SubscriptionController::class, 'createPaymentIntent'])
    ->name('subscription.createPaymentIntent');

Route::post('/subscription/subscribe/{slug}', [SubscriptionController::class, 'subscribe'])
    ->name('subscription.subscribe');

Route::post('/subscription/create-checkout-session/{slug}', [SubscriptionController::class,'createCheckoutSession'])
    ->name('subscription.checkout');

Route::get('/subscription/success', [SubscriptionController::class, 'success'])
    ->name('subscription.success');

Route::post('/subscription/cancel', [SubscriptionController::class, 'cancel'])
    ->name('subscription.cancel');

Route::post('/subscription/change-plan', [SubscriptionController::class, 'changePlan'])
    ->name('subscription.changePlan');





