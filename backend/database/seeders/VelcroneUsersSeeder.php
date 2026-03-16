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
            ['name' => 'Admin Velcrone', 'email' => 'admin@velcrone.com', 'role' => 'superadmin', 'status' => 'active', 'password' => '123456'],
            ['name' => 'Owner Velcrone', 'email' => 'owner@velcrone.com', 'role' => 'owner', 'status' => 'active', 'password' => '123456'],
            ['name' => 'Manager Velcrone', 'email' => 'manager@velcrone.com', 'role' => 'manager', 'status' => 'active', 'password' => '123456'],
            ['name' => 'Kasir Velcrone', 'email' => 'kasir@velcrone.com', 'role' => 'kasir', 'status' => 'active', 'password' => '123456'],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'status' => $user['status'] ?? 'active',
                    'password' => Hash::make($user['password']),
                ]
            );
        }
    }
}
