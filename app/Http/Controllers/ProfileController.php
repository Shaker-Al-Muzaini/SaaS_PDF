<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\User;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function update(ProfileUpdateRequest $request)
    {
        // Logic to update user profile
    }

    public function delete(Request $request)
    {
        // Logic to delete user profile
    }
}
