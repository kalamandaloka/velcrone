<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardViewTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_admin_masuk_ke_dashboard_administrator(): void
    {
        $user = User::create([
            'name' => 'Administrator',
            'email' => 'administrator@test.local',
            'password' => 'password',
            'role' => 'administrator',
        ]);

        $this->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect('/dashboard');

        $this->get('/dashboard')
            ->assertSee('Activity');
    }

    public function test_login_kasir_masuk_ke_dashboard_kasir(): void
    {
        $user = User::create([
            'name' => 'Kasir',
            'email' => 'kasir@test.local',
            'password' => 'password',
            'role' => 'kasir',
        ]);

        $this->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect('/dashboard');

        $this->get('/dashboard')
            ->assertSee('Dashboard Kasir');
    }
}
