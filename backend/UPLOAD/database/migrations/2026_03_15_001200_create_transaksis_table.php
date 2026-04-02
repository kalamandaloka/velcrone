<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaksis', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('invoice')->unique();
            $table->dateTime('tanggal');
            $table->string('pelanggan_id')->nullable();
            $table->string('pelanggan_nama')->nullable();
            $table->decimal('total', 14, 2)->default(0);
            $table->string('status', 20)->default('completed');
            $table->string('metode_pembayaran', 50)->nullable();
            $table->timestamps();

            $table
                ->foreign('pelanggan_id')
                ->references('id')
                ->on('pelanggans')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaksis');
    }
};

