<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pemasok extends Model
{
    protected $table = 'pemasoks';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'nama_perusahaan',
        'kontak_person',
        'no_telepon',
        'alamat',
        'jenis_produk',
    ];
}
