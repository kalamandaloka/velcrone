<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pemasoks', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('nama_perusahaan');
            $table->string('kontak_person')->nullable();
            $table->string('no_telepon', 30)->nullable();
            $table->string('alamat')->nullable();
            $table->string('jenis_produk', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pemasoks');
    }
};
