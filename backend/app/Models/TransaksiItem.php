<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransaksiItem extends Model
{
    protected $table = 'transaksi_items';

    protected $fillable = [
        'transaksi_id',
        'barang_kode',
        'barang_nama',
        'ukuran',
        'warna',
        'qty',
        'harga',
        'subtotal',
    ];

    protected $casts = [
        'qty' => 'int',
        'harga' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function transaksi(): BelongsTo
    {
        return $this->belongsTo(Transaksi::class, 'transaksi_id', 'id');
    }
}
