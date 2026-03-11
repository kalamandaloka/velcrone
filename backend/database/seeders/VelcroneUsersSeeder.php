<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class VelcroneUsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Administrator', 'email' => 'admin@admin.com', 'role' => 'administrator', 'password' => 'admin'],
            ['name' => 'Owner', 'email' => 'owner@owner.com', 'role' => 'owner', 'password' => 'owner'],
            ['name' => 'Manager', 'email' => 'manager@manager.com', 'role' => 'manager', 'password' => 'manager'],
            ['name' => 'Kasir', 'email' => 'kasir@kasir.com', 'role' => 'kasir', 'password' => 'kasir'],
            ['name' => 'Pengguna', 'email' => 'pengguna@pengguna.com', 'role' => 'pengguna', 'password' => 'pengguna'],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'password' => Hash::make($user['password']),
                ]
            );
        }
    }
}
