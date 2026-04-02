<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaksi extends Model
{
    protected $table = 'transaksis';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'invoice',
        'tanggal',
        'pelanggan_id',
        'pelanggan_nama',
        'total',
        'status',
        'alasan_batal',
        'status_produksi',
        'produksi_detail',
        'status_pembayaran',
        'pembayaran_ke',
        'pembayaran_detail',
        'metode_pembayaran',
    ];

    protected $casts = [
        'tanggal' => 'datetime',
        'total' => 'decimal:2',
        'pembayaran_ke' => 'int',
        'produksi_detail' => 'array',
        'pembayaran_detail' => 'array',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(TransaksiItem::class, 'transaksi_id', 'id');
    }
}
