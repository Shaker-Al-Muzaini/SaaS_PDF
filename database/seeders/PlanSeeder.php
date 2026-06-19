<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Plan::query()->delete();
        Plan::create([
            'name' => 'Plan 1',
            'slug' => 'plan-1',
            'des' => 'Plan 1 description',
            'price' => 0,
            'pdf_limit' => 10,
            'features' => json_encode([
                '10 PDF summaries per month',
                '30 PDF summaries per month',
                '60 PDF summaries per month',
            ]),
            'is_active' => true,
        ]);
        Plan::create([
            'name' => 'Plan 2',
            'slug' => 'plan-2',
            'des' => 'Plan 2 description',
            'price' => 12,
            'pdf_limit' => 40,
            'features' => json_encode([
                '7 PDF summaries per month',
                '90 PDF summaries per month',
                '20 PDF summaries per month',
            ]),
            'is_active' => true,
        ]);
    }
}
