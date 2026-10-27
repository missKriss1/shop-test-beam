<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $user = $this->route('user');
        $userId = $user instanceof User ? $user->id : $user;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => ['sometimes', 'required', 'string', 'min:8'],
            'profile' => ['sometimes', 'array'],
            'profile.phone' => ['nullable', 'string', 'max:30'],
            'profile.address' => ['nullable', 'string', 'max:255'],
        ];
    }
}
