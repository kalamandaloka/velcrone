<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login_for_dashboard(): void
    {
        $this->get('/')->assertRedirect('/login');
    }

    public function test_user_can_login_and_access_dashboard(): void
    {
        $user = User::create([
            'name' => 'Administrator',
            'email' => 'admin@admin.com',
            'password' => 'admin',
            'role' => 'administrator',
        ]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'admin',
        ])->assertRedirect('/dashboard');

        $this->get('/dashboard')->assertOk();
    }
}
