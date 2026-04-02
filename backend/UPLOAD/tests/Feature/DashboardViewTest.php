<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardViewTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_update_and_delete_barang_via_api(): void
    {
        $this->postJson('/api/v1/barang', [
            'kode' => 'BRG-001',
            'nama' => 'Barang Test',
            'ukuran' => ['M'],
            'hargaBeli' => 1000,
            'hargaJual' => 2000,
            'diskon' => 0,
        ])
            ->assertStatus(201)
            ->assertJson([
                'message' => 'Barang created',
                'kode' => 'BRG-001',
            ]);

        $this->getJson('/api/v1/barang/BRG-001')
            ->assertOk()
            ->assertJson([
                'kode' => 'BRG-001',
                'nama' => 'Barang Test',
                'ukuran' => ['M'],
                'hargaBeli' => 1000.0,
                'hargaJual' => 2000.0,
                'diskon' => 0.0,
            ]);

        $this->putJson('/api/v1/barang/BRG-001', [
            'ukuran' => ['L', 'XL'],
        ])->assertOk()->assertJson(['message' => 'Barang updated']);

        $this->getJson('/api/v1/barang/BRG-001')
            ->assertOk()
            ->assertJson([
                'kode' => 'BRG-001',
                'ukuran' => ['L', 'XL'],
            ]);

        $this->deleteJson('/api/v1/barang/BRG-001')
            ->assertOk()
            ->assertJson(['message' => 'Barang deleted']);

        $this->getJson('/api/v1/barang/BRG-001')->assertNotFound();
    }

    public function test_can_create_update_and_delete_bahan_via_api(): void
    {
        $this->postJson('/api/v1/bahan', [
            'kode' => 'BHN-001',
            'nama' => 'Bahan Test',
            'kategori' => 'kain',
            'jenisProduk' => 'hoodie',
            'stok' => 10,
            'satuan' => 'm',
            'minStok' => 5,
        ])
            ->assertStatus(201)
            ->assertJson(['message' => 'Bahan created']);

        $this->getJson('/api/v1/bahan/BHN-001')
            ->assertOk()
            ->assertJson([
                'kode' => 'BHN-001',
                'nama' => 'Bahan Test',
                'kategori' => 'kain',
                'jenisProduk' => 'hoodie',
                'stok' => 10.0,
                'satuan' => 'm',
                'minStok' => 5.0,
            ]);

        $this->putJson('/api/v1/bahan/BHN-001', [
            'stok' => 3,
        ])->assertOk()->assertJson(['message' => 'Bahan updated']);

        $this->getJson('/api/v1/bahan/BHN-001')
            ->assertOk()
            ->assertJson([
                'kode' => 'BHN-001',
                'stok' => 3.0,
            ]);

        $this->deleteJson('/api/v1/bahan/BHN-001')
            ->assertOk()
            ->assertJson(['message' => 'Bahan deleted']);

        $this->getJson('/api/v1/bahan/BHN-001')->assertNotFound();
    }

    public function test_can_create_update_and_delete_user_via_api(): void
    {
        $this->postJson('/api/v1/users', [
            'name' => 'User Test',
            'email' => 'user@test.com',
            'role' => 'kasir',
            'status' => 'active',
        ])
            ->assertStatus(201)
            ->assertJson(['message' => 'User created'])
            ->assertJsonStructure(['id']);

        $id = (int) $this->postJson('/api/v1/users', [
            'name' => 'User Test 2',
            'email' => 'user2@test.com',
            'role' => 'manager',
            'status' => 'inactive',
        ])->json('id');

        $this->getJson('/api/v1/users')
            ->assertOk()
            ->assertJsonIsArray()
            ->assertJsonFragment(['email' => 'user2@test.com', 'role' => 'manager', 'status' => 'inactive']);

        $this->putJson("/api/v1/users/{$id}", [
            'status' => 'active',
        ])->assertOk()->assertJson(['message' => 'User updated']);

        $this->getJson("/api/v1/users/{$id}")
            ->assertOk()
            ->assertJsonFragment(['id' => $id, 'status' => 'active']);

        $this->deleteJson("/api/v1/users/{$id}")
            ->assertOk()
            ->assertJson(['message' => 'User deleted']);

        $this->getJson("/api/v1/users/{$id}")->assertNotFound();
    }

    public function test_can_create_and_update_transaksi_via_api(): void
    {
        $this->postJson('/api/v1/barang', [
            'kode' => 'BRG-001',
            'nama' => 'Barang Test',
            'ukuran' => ['M'],
            'hargaBeli' => 1000,
            'hargaJual' => 2000,
            'diskon' => 0,
        ])->assertStatus(201);

        $this->postJson('/api/v1/pelanggan', [
            'id' => 'CUS-001',
            'nama' => 'Budi Santoso',
            'email' => 'budi@test.com',
            'noTelepon' => '08123456789',
            'kategori' => 'umum',
            'poin' => 0,
        ])->assertStatus(201);

        $id = (string) $this->postJson('/api/v1/transaksi', [
            'customerId' => 'CUS-001',
            'paymentMethod' => 'cash',
            'items' => [
                [
                    'productId' => 'BRG-001',
                    'ukuran' => 'M',
                    'qty' => 2,
                ],
            ],
        ])
            ->assertStatus(201)
            ->assertJson(['message' => 'Transaksi created'])
            ->json('id');

        $this->getJson("/api/v1/transaksi/{$id}")
            ->assertOk()
            ->assertJsonFragment([
                'id' => $id,
                'customerId' => 'CUS-001',
                'customerName' => 'Budi Santoso',
                'status' => 'pending',
                'paymentMethod' => 'cash',
            ])
            ->assertJsonFragment([
                'productId' => 'BRG-001',
                'productName' => 'Barang Test',
                'qty' => 2,
            ]);

        $this->putJson("/api/v1/transaksi/{$id}", [
            'productionStatus' => 'selesai',
            'productionDate' => '2026-03-15',
        ])->assertOk()->assertJson(['message' => 'Transaksi updated']);

        $this->putJson("/api/v1/transaksi/{$id}", [
            'payment' => [
                'step' => 5,
                'amount' => 4000,
                'date' => '2026-03-15',
            ],
        ])->assertOk()->assertJson(['message' => 'Transaksi updated']);

        $this->putJson("/api/v1/transaksi/{$id}", [
            'status' => 'cancelled',
            'cancelReason' => 'Batal test',
        ])->assertOk()->assertJson(['message' => 'Transaksi updated']);
    }
}
