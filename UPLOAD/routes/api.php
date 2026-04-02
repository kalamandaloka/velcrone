<?php

use App\Http\Controllers\Api\BarangController;
use App\Http\Controllers\Api\BahanController;
use App\Http\Controllers\Api\KategoriBarangController;
use App\Http\Controllers\Api\PelangganController;
use App\Http\Controllers\Api\PemasokController;
use App\Http\Controllers\Api\TransaksiController;
use App\Http\Controllers\Api\UserController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json(['status' => 'ok']));

    Route::post('/auth/login', function (Request $request) {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $validated['email'])->first();
        if (! $user || ! Hash::check($validated['password'], (string) $user->password)) {
            return response()->json(['message' => 'Email atau password salah'], 401);
        }

        return response()->json([
            'user' => [
                'id' => (string) $user->id,
                'name' => (string) $user->name,
                'email' => (string) $user->email,
                'role' => (string) ($user->role ?? ''),
            ],
        ]);
    });

    Route::get('/barang', [BarangController::class, 'index']);
    Route::post('/barang', [BarangController::class, 'store']);
    Route::get('/barang/{kode}', [BarangController::class, 'show']);
    Route::put('/barang/{kode}', [BarangController::class, 'update']);
    Route::delete('/barang/{kode}', [BarangController::class, 'destroy']);

    Route::get('/bahan', [BahanController::class, 'index']);
    Route::post('/bahan', [BahanController::class, 'store']);
    Route::get('/bahan/{kode}', [BahanController::class, 'show']);
    Route::put('/bahan/{kode}', [BahanController::class, 'update']);
    Route::delete('/bahan/{kode}', [BahanController::class, 'destroy']);

    Route::get('/kategori-barang', [KategoriBarangController::class, 'index']);
    Route::post('/kategori-barang', [KategoriBarangController::class, 'store']);
    Route::put('/kategori-barang/{id}', [KategoriBarangController::class, 'update']);
    Route::delete('/kategori-barang/{id}', [KategoriBarangController::class, 'destroy']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    Route::get('/pelanggan', [PelangganController::class, 'index']);
    Route::post('/pelanggan', [PelangganController::class, 'store']);
    Route::get('/pelanggan/{id}', [PelangganController::class, 'show']);
    Route::put('/pelanggan/{id}', [PelangganController::class, 'update']);
    Route::delete('/pelanggan/{id}', [PelangganController::class, 'destroy']);

    Route::get('/pemasok', [PemasokController::class, 'index']);
    Route::post('/pemasok', [PemasokController::class, 'store']);
    Route::get('/pemasok/{id}', [PemasokController::class, 'show']);
    Route::put('/pemasok/{id}', [PemasokController::class, 'update']);
    Route::delete('/pemasok/{id}', [PemasokController::class, 'destroy']);

    Route::get('/transaksi', [TransaksiController::class, 'index']);
    Route::post('/transaksi', [TransaksiController::class, 'store']);
    Route::get('/transaksi/{id}', [TransaksiController::class, 'show']);
    Route::put('/transaksi/{id}', [TransaksiController::class, 'update']);
});
