<?php

namespace Database\Seeders;

use App\Models\Barang;
use Illuminate\Database\Seeder;

class BarangSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['kode' => 'VLC-001', 'nama' => 'Paddock Custom Shirt', 'stok' => 50, 'satuan' => 'pcs', 'harga_beli' => 150000, 'harga_jual' => 250000, 'diskon' => 0],
            ['kode' => 'VLC-002', 'nama' => 'Racing Jacket Velcrone', 'stok' => 25, 'satuan' => 'pcs', 'harga_beli' => 350000, 'harga_jual' => 550000, 'diskon' => 5],
            ['kode' => 'VLC-003', 'nama' => 'Velcrone Limited T-Shirt', 'stok' => 100, 'satuan' => 'pcs', 'harga_beli' => 85000, 'harga_jual' => 150000, 'diskon' => 0],
            ['kode' => 'VLC-004', 'nama' => 'Topi Racing Snapback', 'stok' => 30, 'satuan' => 'pcs', 'harga_beli' => 60000, 'harga_jual' => 120000, 'diskon' => 10],
            ['kode' => 'VLC-005', 'nama' => 'Hoodie Oversized Black', 'stok' => 40, 'satuan' => 'pcs', 'harga_beli' => 180000, 'harga_jual' => 350000, 'diskon' => 0],
        ];

        foreach ($items as $item) {
            Barang::updateOrCreate(['kode' => $item['kode']], $item);
        }
    }
}
