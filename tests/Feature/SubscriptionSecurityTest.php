<?php

use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ── Helpers ────────────────────────────────────────────────────────────────────

function makePlan(array $overrides = []): Plan
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

// ── PDF Summarize Route — Authentication ───────────────────────────────────────

test('guests are redirected to login when accessing pdf summarize endpoint', function () {
    $response = $this->post('/pdf/summarize');
    // Laravel web middleware redirects unauthenticated users to login
    $response->assertRedirect('/login');
});

test('unverified users cannot access pdf summarize endpoint', function () {
    $user = User::factory()->unverified()->create();
    $this->actingAs($user);
    $response = $this->post('/pdf/summarize');
    // Unverified users get redirected to email verification page
    $response->assertRedirect();
});

// ── Subscription Routes — Authentication ──────────────────────────────────────

test('guests are redirected to login when cancelling subscription', function () {
    $response = $this->post('/subscription/cancel');
    $response->assertRedirect('/login');
});

test('guests are redirected to login when changing plan', function () {
    $response = $this->post('/subscription/change-plan');
    $response->assertRedirect('/login');
});

test('guests are redirected to login when creating checkout session', function () {
    $plan = makePlan(['slug' => 'standard', 'price' => 10]);
    $response = $this->post("/subscription/create-checkout-session/{$plan->slug}");
    $response->assertRedirect('/login');
});

// ── History Route — Authentication ────────────────────────────────────────────

test('guests cannot access history', function () {
    $response = $this->get('/history');
    $response->assertRedirect('/login');
});

test('authenticated users can access history', function () {
    $plan = makePlan();
    $user = User::factory()->create(['plan_id' => $plan->id]);
    $this->actingAs($user);

    $response = $this->get('/history');
    $response->assertOk();
});

// ── PDF Summarize — Validation ─────────────────────────────────────────────────

test('pdf summarize requires a pdf file', function () {
    $plan = makePlan();
    $user = User::factory()->create(['plan_id' => $plan->id, 'pdf_count' => 0, 'pdf_count_reset_at' => now()->addWeek()]);
    $this->actingAs($user);

    $response = $this->post('/pdf/summarize', []);
    // Without a file, Laravel redirects back with validation errors
    $response->assertStatus(302);
});

test('pdf summarize rejects non-pdf files', function () {
    $plan = makePlan();
    $user = User::factory()->create(['plan_id' => $plan->id, 'pdf_count' => 0, 'pdf_count_reset_at' => now()->addWeek()]);
    $this->actingAs($user);

    $file = \Illuminate\Http\UploadedFile::fake()->create('document.txt', 100, 'text/plain');

    $response = $this->post('/pdf/summarize', ['pdf' => $file]);
    // Non-PDF files fail validation — redirected back
    $response->assertStatus(302);
});

test('pdf summarize returns 403 when user has reached pdf limit', function () {
    $plan = makePlan(['pdf_limit' => 5]);
    $user = User::factory()->create([
        'plan_id'            => $plan->id,
        'pdf_count'          => 5,
        'pdf_count_reset_at' => now()->addWeek(),
    ]);
    $this->actingAs($user);

    $file = \Illuminate\Http\UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $response = $this->postJson('/pdf/summarize', ['pdf' => $file]);
    $response->assertStatus(403)
             ->assertJsonFragment(['message' => 'You have reached your PDF limit for this month. Please upgrade your plan to continue.']);
});
