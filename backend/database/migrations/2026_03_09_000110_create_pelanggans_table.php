<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pelanggans', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('nama');
            $table->string('no_telepon', 30)->nullable();
            $table->string('alamat')->nullable();
            $table->string('kategori', 50)->nullable();
            $table->unsignedInteger('poin')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pelanggans');
    }
};
