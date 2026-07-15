<?php

namespace App\Http\Controllers;

use App\Http\Requests\TwoFactorAuthenticationRequest;
use Illuminate\Http\Request;

class SecurityController extends Controller
{
    public function enableTwoFactor(TwoFactorAuthenticationRequest $request)
    {
        // Logic to enable two-factor authentication
    }

    public function disableTwoFactor(Request $request)
    {
        // Logic to disable two-factor authentication
    }
}
