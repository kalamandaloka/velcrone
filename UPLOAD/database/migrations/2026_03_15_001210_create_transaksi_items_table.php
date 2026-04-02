<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaksi_items', function (Blueprint $table) {
            $table->id();
            $table->string('transaksi_id');
            $table->string('barang_kode', 50);
            $table->string('barang_nama');
            $table->unsignedInteger('qty');
            $table->decimal('harga', 14, 2)->default(0);
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->timestamps();

            $table->index('transaksi_id');
            $table
                ->foreign('transaksi_id')
                ->references('id')
                ->on('transaksis')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaksi_items');
    }
};

