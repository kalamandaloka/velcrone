<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `barangs` MODIFY `ukuran` VARCHAR(50) NOT NULL DEFAULT 'M'");
            return;
        }

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE barangs ALTER COLUMN ukuran TYPE VARCHAR(50)");
            return;
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `barangs` MODIFY `ukuran` VARCHAR(10) NOT NULL DEFAULT 'M'");
            return;
        }

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE barangs ALTER COLUMN ukuran TYPE VARCHAR(10)");
            return;
        }
    }
};

