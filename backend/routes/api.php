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
use Illuminate\Support\Str;

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

    Route::post('/uploads/spk', function (Request $request) {
        $validated = $request->validate([
            'invoice' => ['required', 'string', 'max:100'],
            'productId' => ['required', 'string', 'max:100'],
            'warna' => ['nullable', 'string', 'max:50'],
            'type' => ['required', 'string', 'in:design,sponsor'],
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $uploadsPath = env('SPK_UPLOADS_PATH');
        $websiteUploads = is_string($uploadsPath) && trim($uploadsPath) !== ''
            ? rtrim(trim($uploadsPath), DIRECTORY_SEPARATOR)
            : base_path('../website/public/uploads');
        if (! is_dir($websiteUploads)) {
            if (! @mkdir($websiteUploads, 0755, true) && ! is_dir($websiteUploads)) {
                return response()->json(['message' => 'Gagal membuat folder uploads'], 500);
            }
        }

        $invoice = (string) $validated['invoice'];
        $productId = (string) $validated['productId'];
        $warna = array_key_exists('warna', $validated) ? (string) ($validated['warna'] ?? '') : '';
        $type = (string) $validated['type'];

        $safe = fn (string $v) => preg_replace('/[^A-Za-z0-9_-]+/', '_', $v);
        $ext = strtolower((string) $request->file('file')->getClientOriginalExtension());
        if ($ext === '') $ext = 'png';

        $filename = sprintf(
            'spk_%s_%s_%s_%s_%s.%s',
            $safe($invoice),
            $safe($productId),
            $safe($warna),
            $safe($type),
            Str::random(8),
            $ext
        );

        try {
            $request->file('file')->move($websiteUploads, $filename);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Gagal menyimpan file upload'], 500);
        }

        $url = rtrim($request->getSchemeAndHttpHost(), '/') . '/api/v1/uploads/spk/' . rawurlencode($filename);

        return response()->json([
            'path' => "/uploads/{$filename}",
            'url' => $url,
        ], 201);
    });

    Route::get('/uploads/spk/{filename}', function (string $filename) {
        $filename = (string) $filename;
        if ($filename === '' || str_contains($filename, '..') || str_contains($filename, '/') || str_contains($filename, '\\')) {
            return response()->json(['message' => 'Filename tidak valid'], 400);
        }
        if (! preg_match('/^[A-Za-z0-9_.-]+$/', $filename)) {
            return response()->json(['message' => 'Filename tidak valid'], 400);
        }

        $uploadsPath = env('SPK_UPLOADS_PATH');
        $websiteUploads = is_string($uploadsPath) && trim($uploadsPath) !== ''
            ? rtrim(trim($uploadsPath), DIRECTORY_SEPARATOR)
            : base_path('../website/public/uploads');
        $fullPath = $websiteUploads . DIRECTORY_SEPARATOR . $filename;
        if (! is_file($fullPath)) {
            return response()->json(['message' => 'File tidak ditemukan'], 404);
        }

        return response()->file($fullPath);
    })->where('filename', '.*');
});
