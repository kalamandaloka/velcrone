<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bahan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BahanController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Bahan::query()->orderBy('nama')->get()->map(function ($b) {
            return [
                'kode' => $b->kode,
                'nama' => $b->nama,
                'kategori' => $b->kategori,
                'jenisProduk' => $b->jenis_produk,
                'stok' => (float) $b->stok,
                'satuan' => $b->satuan,
                'minStok' => (float) $b->min_stok,
            ];
        });

        return response()->json($data);
    }

    public function show(string $kode): JsonResponse
    {
        $b = Bahan::findOrFail($kode);

        return response()->json([
            'kode' => $b->kode,
            'nama' => $b->nama,
            'kategori' => $b->kategori,
            'jenisProduk' => $b->jenis_produk,
            'stok' => (float) $b->stok,
            'satuan' => $b->satuan,
            'minStok' => (float) $b->min_stok,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode' => ['required', 'string'],
            'nama' => ['required', 'string'],
            'kategori' => ['nullable', 'string'],
            'jenisProduk' => ['nullable', 'string'],
            'stok' => ['nullable', 'numeric'],
            'satuan' => ['nullable', 'string'],
            'minStok' => ['nullable', 'numeric'],
        ]);

        Bahan::create([
            'kode' => $validated['kode'],
            'nama' => $validated['nama'],
            'kategori' => $validated['kategori'] ?? null,
            'jenis_produk' => $validated['jenisProduk'] ?? null,
            'stok' => $validated['stok'] ?? 0,
            'satuan' => $validated['satuan'] ?? 'pcs',
            'min_stok' => $validated['minStok'] ?? 0,
        ]);

        return response()->json(['message' => 'Bahan created'], 201);
    }

    public function update(Request $request, string $kode): JsonResponse
    {
        $b = Bahan::findOrFail($kode);
        $validated = $request->validate([
            'nama' => ['sometimes', 'string'],
            'kategori' => ['sometimes', 'nullable', 'string'],
            'jenisProduk' => ['sometimes', 'nullable', 'string'],
            'stok' => ['sometimes', 'numeric'],
            'satuan' => ['sometimes', 'nullable', 'string'],
            'minStok' => ['sometimes', 'numeric'],
        ]);

        $b->update([
            'nama' => $validated['nama'] ?? $b->nama,
            'kategori' => array_key_exists('kategori', $validated) ? ($validated['kategori'] ?? null) : $b->kategori,
            'jenis_produk' => array_key_exists('jenisProduk', $validated) ? ($validated['jenisProduk'] ?? null) : $b->jenis_produk,
            'stok' => array_key_exists('stok', $validated) ? ($validated['stok'] ?? 0) : $b->stok,
            'satuan' => array_key_exists('satuan', $validated) ? ($validated['satuan'] ?? null) : $b->satuan,
            'min_stok' => array_key_exists('minStok', $validated) ? ($validated['minStok'] ?? 0) : $b->min_stok,
        ]);

        return response()->json(['message' => 'Bahan updated']);
    }

    public function destroy(string $kode): JsonResponse
    {
        $b = Bahan::findOrFail($kode);
        $b->delete();

        return response()->json(['message' => 'Bahan deleted']);
    }
}
