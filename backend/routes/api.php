<?php

use App\Http\Controllers\Api\BarangController;
use App\Http\Controllers\Api\PelangganController;
use App\Http\Controllers\Api\PemasokController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/barang', [BarangController::class, 'index']);
    Route::post('/barang', [BarangController::class, 'store']);
    Route::get('/barang/{kode}', [BarangController::class, 'show']);
    Route::put('/barang/{kode}', [BarangController::class, 'update']);
    Route::delete('/barang/{kode}', [BarangController::class, 'destroy']);

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
});
