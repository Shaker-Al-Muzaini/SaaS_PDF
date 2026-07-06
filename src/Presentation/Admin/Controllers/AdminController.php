<?php

namespace Presentation\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    use AuthorizesRequests;

    public function users()
    {
        $users = User::with('plan')
            ->withCount('pdfSummaries')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Admin/Views/pages/users', [
            'users' => $users,
        ]);
    }

    public function updateUserPlan(Request $request, User $user)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        $user->update([
            'plan_id' => $request->plan_id,
            'pdf_count' => 0,
            'pdf_count_reset_at' => now()->addMonth(),
        ]);

        return back()->with('success', 'User plan updated successfully');
    }
}
