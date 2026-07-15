<?php

use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ── Helpers ────────────────────────────────────────────────────────────────────

function createPlan(array $overrides = []): Plan
{
    return Plan::create(array_merge([
        'name'      => 'Basic',
        'slug'      => 'basic',
        'des'       => 'Free plan',
        'price'     => 0,
        'pdf_limit' => 5,
        'features'  => json_encode(['5 PDFs/month']),
        'is_active' => true,
    ], $overrides));
}

function createUser(array $overrides = []): User
{
    return User::factory()->create($overrides);
}

// ── canSummarizePdf() ──────────────────────────────────────────────────────────

test('canSummarizePdf returns false when user has no plan', function () {
    $user = createUser(['plan_id' => null]);
    expect($user->canSummarizePdf())->toBeFalse();
});

test('canSummarizePdf returns true when pdf_limit is negative (unlimited)', function () {
    $plan = createPlan(['slug' => 'premium', 'pdf_limit' => -1, 'price' => 20]);
    $user = createUser(['plan_id' => $plan->id, 'pdf_count' => 999]);
    expect($user->canSummarizePdf())->toBeTrue();
});

test('canSummarizePdf returns true when user is under the limit', function () {
    $plan = createPlan(['pdf_limit' => 10]);
    $user = createUser(['plan_id' => $plan->id, 'pdf_count' => 5, 'pdf_count_reset_at' => now()->addWeek()]);
    expect($user->canSummarizePdf())->toBeTrue();
});

test('canSummarizePdf returns false when user has reached the limit', function () {
    $plan = createPlan(['pdf_limit' => 5]);
    $user = createUser(['plan_id' => $plan->id, 'pdf_count' => 5, 'pdf_count_reset_at' => now()->addWeek()]);
    expect($user->canSummarizePdf())->toBeFalse();
});

test('canSummarizePdf resets counter when reset date has passed', function () {
    $plan = createPlan(['pdf_limit' => 5]);
    $user = createUser([
        'plan_id'            => $plan->id,
        'pdf_count'          => 5,
        'pdf_count_reset_at' => now()->subDay(), // reset date in the past
    ]);

    // After calling canSummarizePdf, the counter should be reset to 0
    $result = $user->canSummarizePdf();
    expect($result)->toBeTrue();
    expect($user->fresh()->pdf_count)->toBe(0);
});

// ── getRemainingPdfs() ─────────────────────────────────────────────────────────

test('getRemainingPdfs returns Unlimited for unlimited plan', function () {
    $plan = createPlan(['slug' => 'premium', 'pdf_limit' => -1, 'price' => 20]);
    $user = createUser(['plan_id' => $plan->id, 'pdf_count' => 50]);
    expect($user->getRemainingPdfs())->toBe('Unlimited');
});

test('getRemainingPdfs returns correct remaining count', function () {
    $plan = createPlan(['pdf_limit' => 10]);
    $user = createUser(['plan_id' => $plan->id, 'pdf_count' => 3]);
    expect($user->getRemainingPdfs())->toBe(7);
});

test('getRemainingPdfs returns 0 when user is over the limit', function () {
    $plan = createPlan(['pdf_limit' => 5]);
    $user = createUser(['plan_id' => $plan->id, 'pdf_count' => 10]);
    expect($user->getRemainingPdfs())->toBe(0);
});

// ── hasActiveSubscription() ────────────────────────────────────────────────────

test('hasActiveSubscription returns false when no stripe subscription', function () {
    $user = createUser(['stripe_subscription_id' => null]);
    expect($user->hasActiveSubscription())->toBeFalse();
});

test('hasActiveSubscription returns false when subscription has expired', function () {
    $user = createUser([
        'stripe_subscription_id' => 'sub_test123',
        'subscription_ends_at'   => now()->subDay(),
    ]);
    expect($user->hasActiveSubscription())->toBeFalse();
});

test('hasActiveSubscription returns true for active subscription', function () {
    $user = createUser([
        'stripe_subscription_id' => 'sub_test123',
        'subscription_ends_at'   => now()->addMonth(),
    ]);
    expect($user->hasActiveSubscription())->toBeTrue();
});

// ── isAdmin() ──────────────────────────────────────────────────────────────────

test('isAdmin returns true for admin role', function () {
    $user = createUser(['role' => 'admin']);
    expect($user->isAdmin())->toBeTrue();
});

test('isAdmin returns false for regular user', function () {
    $user = createUser(['role' => 'user']);
    expect($user->isAdmin())->toBeFalse();
});
