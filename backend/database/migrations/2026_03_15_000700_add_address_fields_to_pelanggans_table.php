<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pelanggans', function (Blueprint $table) {
            $table->string('provinsi_id', 10)->nullable()->after('alamat');
            $table->string('provinsi', 100)->nullable()->after('provinsi_id');
            $table->string('kota_kab_id', 10)->nullable()->after('provinsi');
            $table->string('kota_kab', 100)->nullable()->after('kota_kab_id');
            $table->string('kecamatan_id', 15)->nullable()->after('kota_kab');
            $table->string('kecamatan', 100)->nullable()->after('kecamatan_id');
            $table->string('kelurahan_id', 20)->nullable()->after('kecamatan');
            $table->string('kelurahan', 100)->nullable()->after('kelurahan_id');
            $table->string('kodepos', 10)->nullable()->after('kelurahan');
        });
    }

    public function down(): void
    {
        Schema::table('pelanggans', function (Blueprint $table) {
            $table->dropColumn([
                'provinsi_id',
                'provinsi',
                'kota_kab_id',
                'kota_kab',
                'kecamatan_id',
                'kecamatan',
                'kelurahan_id',
                'kelurahan',
                'kodepos',
            ]);
        });
    }
};
