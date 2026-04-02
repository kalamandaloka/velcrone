<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_root_route_is_not_serving_frontend(): void
    {
        $this->get('/')->assertNotFound();
    }

    public function test_login_route_is_not_available(): void
    {
        $this->get('/login')->assertNotFound();
        $this->post('/login')->assertNotFound();
    }

    public function test_barang_index_returns_json_array(): void
    {
        $this->getJson('/api/v1/barang')
            ->assertOk()
            ->assertJsonIsArray();
    }
}
