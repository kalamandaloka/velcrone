<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaksi_items', function (Blueprint $table) {
            $table->string('ukuran', 10)->default('M')->after('barang_nama');
        });
    }

    public function down(): void
    {
        Schema::table('transaksi_items', function (Blueprint $table) {
            $table->dropColumn('ukuran');
        });
    }
};

