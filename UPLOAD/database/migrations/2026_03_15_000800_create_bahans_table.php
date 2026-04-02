<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bahans', function (Blueprint $table) {
            $table->string('kode')->primary();
            $table->string('nama');
            $table->string('kategori', 50)->nullable();
            $table->string('jenis_produk', 50)->nullable();
            $table->decimal('stok', 12, 2)->default(0);
            $table->string('satuan', 50)->default('pcs');
            $table->decimal('min_stok', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bahans');
    }
};
