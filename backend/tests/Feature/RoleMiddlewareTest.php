<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_kasir_dilarang_menambah_barang(): void
    {
        $kasir = User::create([
            'name' => 'Kasir',
            'email' => 'kasir@test.local',
            'password' => 'password',
            'role' => 'kasir',
        ]);

        $this->post('/login', ['email' => $kasir->email, 'password' => 'password']);

        $this->post('/barang', [
            'kode' => 'TEST-001',
            'nama' => 'Test Barang',
            'stok' => 1,
            'satuan' => 'pcs',
            'hargaBeli' => 1000,
            'hargaJual' => 2000,
            'diskon' => 0,
        ])->assertStatus(403);
    }

    public function test_administrator_bisa_menambah_barang(): void
    {
        $admin = User::create([
            'name' => 'Administrator',
            'email' => 'admin@test.local',
            'password' => 'password',
            'role' => 'administrator',
        ]);

        $this->post('/login', ['email' => $admin->email, 'password' => 'password']);

        $this->post('/barang', [
            'kode' => 'ADM-001',
            'nama' => 'Barang Admin',
            'stok' => 2,
            'satuan' => 'pcs',
            'hargaBeli' => 1000,
            'hargaJual' => 2000,
            'diskon' => 0,
        ])->assertRedirect('/barang');
    }
}
