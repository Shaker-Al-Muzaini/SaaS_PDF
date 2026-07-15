<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TwoFactorAuthenticationRequest extends FormRequest
{
    public function rules()
    {
        return [
            'code' => 'required|string',
            // Add other validation rules as needed
        ];
    }
}
