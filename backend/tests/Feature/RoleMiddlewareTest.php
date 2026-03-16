<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_and_list_pelanggan(): void
    {
        $this->postJson('/api/v1/pelanggan', [
            'id' => 'PLG-001',
            'nama' => 'Pelanggan Test',
            'email' => 'pelanggan@test.com',
            'noTelepon' => '081234567890',
            'alamat' => 'Jl. Contoh',
            'provinsiId' => '11',
            'provinsi' => 'ACEH',
            'kotaKabId' => '1103',
            'kotaKab' => 'KABUPATEN ACEH SELATAN',
            'kecamatanId' => '1103010',
            'kecamatan' => 'TRUMON',
            'kelurahanId' => '1103010001',
            'kelurahan' => 'KUTA PADANG',
            'kodepos' => '23774',
            'kategori' => 'umum',
            'poin' => 10,
        ])->assertStatus(201)->assertJson(['message' => 'Pelanggan created']);

        $this->getJson('/api/v1/pelanggan')
            ->assertOk()
            ->assertJsonFragment([
                'id' => 'PLG-001',
                'nama' => 'Pelanggan Test',
                'email' => 'pelanggan@test.com',
                'provinsiId' => '11',
                'kotaKabId' => '1103',
                'kecamatanId' => '1103010',
                'kelurahanId' => '1103010001',
                'kodepos' => '23774',
            ]);
    }

    public function test_can_create_and_show_pemasok(): void
    {
        $this->postJson('/api/v1/pemasok', [
            'id' => 'PMS-001',
            'namaPerusahaan' => 'PT Test',
            'kontakPerson' => 'Budi',
            'noTelepon' => '0800000000',
            'alamat' => 'Jl. Pemasok',
            'jenisProduk' => 'Bahan baku',
        ])->assertStatus(201)->assertJson(['message' => 'Pemasok created']);

        $this->getJson('/api/v1/pemasok/PMS-001')
            ->assertOk()
            ->assertJsonFragment(['id' => 'PMS-001', 'namaPerusahaan' => 'PT Test']);
    }
}
