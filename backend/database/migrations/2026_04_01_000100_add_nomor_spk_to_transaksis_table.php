<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaksis', function (Blueprint $table) {
            $table->string('nomor_spk', 50)->nullable()->after('invoice');
        });
    }

    public function down(): void
    {
        Schema::table('transaksis', function (Blueprint $table) {
            $table->dropColumn('nomor_spk');
        });
    }
};
