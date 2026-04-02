<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaksis', function (Blueprint $table) {
            $table->string('status_produksi', 30)->default('order_masuk')->after('status');
            $table->string('status_pembayaran', 20)->default('belum_lunas')->after('status_produksi');
            $table->unsignedTinyInteger('pembayaran_ke')->default(0)->after('status_pembayaran');
        });
    }

    public function down(): void
    {
        Schema::table('transaksis', function (Blueprint $table) {
            $table->dropColumn(['status_produksi', 'status_pembayaran', 'pembayaran_ke']);
        });
    }
};

