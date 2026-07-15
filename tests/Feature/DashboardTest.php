<?php

use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    // Create the basic plan so the User model's boot() method can find it
    Plan::create([
        'name'      => 'Basic',
        'slug'      => 'basic',
        'des'       => 'Free plan',
        'price'     => 0,
        'pdf_limit' => 5,
        'features'  => json_encode(['5 PDFs/month']),
        'is_active' => true,
    ]);

    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});