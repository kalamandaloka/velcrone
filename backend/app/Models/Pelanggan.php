<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pelanggan extends Model
{
    protected $table = 'pelanggans';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'nama',
        'email',
        'no_telepon',
        'alamat',
        'provinsi_id',
        'provinsi',
        'kota_kab_id',
        'kota_kab',
        'kecamatan_id',
        'kecamatan',
        'kelurahan_id',
        'kelurahan',
        'kodepos',
        'kategori',
        'poin',
    ];
}
