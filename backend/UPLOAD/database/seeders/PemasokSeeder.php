<?php

namespace Database\Seeders;

use App\Models\Pemasok;
use Illuminate\Database\Seeder;

class PemasokSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['id' => 'SUP-001', 'nama_perusahaan' => 'CV. Tekstil Jaya', 'kontak_person' => 'Pak Budi', 'no_telepon' => '021-5551234', 'alamat' => 'Jl. Industri No. 1, Bandung', 'jenis_produk' => 'Kain Cotton Combed'],
            ['id' => 'SUP-002', 'nama_perusahaan' => 'Sablon Kilat Pro', 'kontak_person' => 'Mas Arif', 'no_telepon' => '081233445566', 'alamat' => 'Jl. Percetakan Negara No. 10, Jakarta', 'jenis_produk' => 'Jasa Sablon & DTF'],
            ['id' => 'SUP-003', 'nama_perusahaan' => 'PT. Aksesoris Garment', 'kontak_person' => 'Ibu Susi', 'no_telepon' => '021-7778899', 'alamat' => 'Kawasan Industri Pulogadung, Jakarta', 'jenis_produk' => 'Kancing, Resleting, Label'],
            ['id' => 'SUP-004', 'nama_perusahaan' => 'Racing Apparel Vendor', 'kontak_person' => 'Pak Hendi', 'no_telepon' => '081998877665', 'alamat' => 'Jl. Ahmad Yani No. 50, Surabaya', 'jenis_produk' => 'Konveksi Jersey & Jaket'],
            ['id' => 'SUP-005', 'nama_perusahaan' => 'Mitra Packindo', 'kontak_person' => 'Pak Rudi', 'no_telepon' => '021-4445566', 'alamat' => 'Jl. Daan Mogot KM 15, Tangerang', 'jenis_produk' => 'Plastik & Kardus Packaging'],
        ];

        foreach ($items as $item) {
            Pemasok::updateOrCreate(['id' => $item['id']], $item);
        }
    }
}
