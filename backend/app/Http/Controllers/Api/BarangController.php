<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BarangController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Barang::query()->orderBy('nama')->get()->map(function ($b) {
            return [
                'kode' => $b->kode,
                'nama' => $b->nama,
                'stok' => (int) $b->stok,
                'satuan' => $b->satuan,
                'hargaBeli' => (float) $b->harga_beli,
                'hargaJual' => (float) $b->harga_jual,
                'diskon' => (float) $b->diskon,
            ];
        });

        return response()->json($data);
    }

    public function show(string $kode): JsonResponse
    {
        $b = Barang::findOrFail($kode);

        return response()->json([
            'kode' => $b->kode,
            'nama' => $b->nama,
            'stok' => (int) $b->stok,
            'satuan' => $b->satuan,
            'hargaBeli' => (float) $b->harga_beli,
            'hargaJual' => (float) $b->harga_jual,
            'diskon' => (float) $b->diskon,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode' => ['required', 'string'],
            'nama' => ['required', 'string'],
            'stok' => ['nullable', 'integer'],
            'satuan' => ['required', 'string'],
            'hargaBeli' => ['required', 'numeric'],
            'hargaJual' => ['required', 'numeric'],
            'diskon' => ['nullable', 'numeric'],
        ]);

        $barang = Barang::create([
            'kode' => $validated['kode'],
            'nama' => $validated['nama'],
            'stok' => $validated['stok'] ?? 0,
            'satuan' => $validated['satuan'],
            'harga_beli' => $validated['hargaBeli'],
            'harga_jual' => $validated['hargaJual'],
            'diskon' => $validated['diskon'] ?? 0,
        ]);

        return response()->json([
            'message' => 'Barang created',
            'kode' => $barang->kode,
        ], 201);
    }

    public function update(Request $request, string $kode): JsonResponse
    {
        $barang = Barang::findOrFail($kode);
        $validated = $request->validate([
            'nama' => ['sometimes', 'string'],
            'stok' => ['sometimes', 'integer'],
            'satuan' => ['sometimes', 'string'],
            'hargaBeli' => ['sometimes', 'numeric'],
            'hargaJual' => ['sometimes', 'numeric'],
            'diskon' => ['sometimes', 'numeric'],
        ]);

        $barang->update([
            'nama' => $validated['nama'] ?? $barang->nama,
            'stok' => $validated['stok'] ?? $barang->stok,
            'satuan' => $validated['satuan'] ?? $barang->satuan,
            'harga_beli' => $validated['hargaBeli'] ?? $barang->harga_beli,
            'harga_jual' => $validated['hargaJual'] ?? $barang->harga_jual,
            'diskon' => $validated['diskon'] ?? $barang->diskon,
        ]);

        return response()->json(['message' => 'Barang updated']);
    }

    public function destroy(string $kode): JsonResponse
    {
        $barang = Barang::findOrFail($kode);
        $barang->delete();

        return response()->json(['message' => 'Barang deleted']);
    }
}
