<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. تشغيل سيذر الخطط أولاً
        $this->call(PlanSeeder::class);

        // 2. إنشاء مدير النظام
        User::create([
            'name' => 'Test admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);
        User::create([
            'name' => 'user test',
            'email' => 'user@example.com',
            'password' => bcrypt('password'),
            'role' => 'user',
        ]);

        // 3. جلب الخطة الأولى (plan-1) لأنها الموجودة في الـ Seeder لديك
        $basicPlan = Plan::where('slug', 'plan-1')->first();
        User::create([
            'name' => 'Test User 2',
            'email' => 'test2@example.com',
            'password' => bcrypt('password'),
            'role' => 'user',
            'pdf_count'          => 2,
            'plan_id'            => $basicPlan?->id,
            'pdf_count_reset_at' => now()->addMonth()->format('Y-m-d'),
        ]);
    }
}
