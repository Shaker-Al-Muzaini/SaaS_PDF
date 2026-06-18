<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(PlanSeeder::class);

        User::create([
            'name' => 'Test admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        $basicPlan = Plan::where('slug', 'basic')->first();
        User::create([
            'name' => 'Test User 2 ',
            'email' => 'test2@example.com',
            'password' => bcrypt('password'),
            'role' => 'user',
            'plan_count' =>2,
            'plan_id' => $basicPlan?->id,
            'pdf_count_rest_at' => now()->addMonth()->format('Y-m-d'),
        ]);
    }
}
