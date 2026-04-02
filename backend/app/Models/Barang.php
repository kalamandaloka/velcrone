<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Barang extends Model
{
    protected $table = 'barangs';

    protected $primaryKey = 'kode';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'kode',
        'nama',
        'kategori',
        'jenis',
        'ukuran',
        'warna',
        'satuan',
        'harga_beli',
        'harga_jual',
        'diskon',
    ];
}
