<?php

namespace Database\Seeders;

use App\Models\Pelanggan;
use Illuminate\Database\Seeder;

class PelangganSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['id' => 'CUST-001', 'nama' => 'Budi Santoso', 'email' => 'budi@example.com', 'no_telepon' => '081234567890', 'alamat' => 'Jl. Pemuda No. 10, Jakarta', 'kategori' => 'umum', 'poin' => 50],
            ['id' => 'CUST-002', 'nama' => 'Speed Tuner Garage', 'email' => 'speed@example.com', 'no_telepon' => '081987654321', 'alamat' => 'Jl. Sirkuit Sentul No. 5, Bogor', 'kategori' => 'vip', 'poin' => 1200],
            ['id' => 'CUST-003', 'nama' => 'Andi Pratama', 'email' => 'andi@example.com', 'no_telepon' => '085678901234', 'alamat' => 'Jl. Merdeka No. 45, Bandung', 'kategori' => 'reseller', 'poin' => 500],
            ['id' => 'CUST-004', 'nama' => 'Rina Kartika', 'email' => 'rina@example.com', 'no_telepon' => '081345678901', 'alamat' => 'Jl. Diponegoro No. 20, Surabaya', 'kategori' => 'umum', 'poin' => 20],
            ['id' => 'CUST-005', 'nama' => 'Fast Lane Club', 'email' => 'fastlane@example.com', 'no_telepon' => '081298765432', 'alamat' => 'Jl. Raya Bogor KM 30, Depok', 'kategori' => 'vip', 'poin' => 2500],
        ];

        foreach ($items as $item) {
            Pelanggan::updateOrCreate(['id' => $item['id']], $item);
        }
    }
}
