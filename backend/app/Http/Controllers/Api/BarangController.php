<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BarangController extends Controller
{
    private const UKURAN_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

    public function index(): JsonResponse
    {
        $data = Barang::query()->orderBy('nama')->get()->map(function ($b) {
            return [
                'kode' => $b->kode,
                'nama' => $b->nama,
                'kategori' => $b->kategori,
                'ukuran' => $this->normalizeUkuran($b->ukuran),
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
            'kategori' => $b->kategori,
            'ukuran' => $this->normalizeUkuran($b->ukuran),
            'hargaBeli' => (float) $b->harga_beli,
            'hargaJual' => (float) $b->harga_jual,
            'diskon' => (float) $b->diskon,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->normalizeUkuranInRequest($request);
        $validated = $request->validate([
            'kode' => ['required', 'string', Rule::unique('barangs', 'kode')],
            'nama' => ['required', 'string'],
            'kategori' => ['nullable', 'string'],
            'ukuran' => ['required', 'array', 'min:1'],
            'ukuran.*' => ['string', Rule::in(self::UKURAN_OPTIONS)],
            'hargaBeli' => ['required', 'numeric'],
            'hargaJual' => ['required', 'numeric'],
            'diskon' => ['nullable', 'numeric'],
        ], [
            'kode.unique' => 'Kode barang sudah terpakai',
        ]);

        $barang = Barang::create([
            'kode' => $validated['kode'],
            'nama' => $validated['nama'],
            'kategori' => $validated['kategori'] ?? null,
            'ukuran' => implode(',', $validated['ukuran']),
            'satuan' => 'pcs',
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
        $this->normalizeUkuranInRequest($request);
        $validated = $request->validate([
            'nama' => ['sometimes', 'string'],
            'kategori' => ['sometimes', 'nullable', 'string'],
            'ukuran' => ['sometimes', 'array', 'min:1'],
            'ukuran.*' => ['string', Rule::in(self::UKURAN_OPTIONS)],
            'hargaBeli' => ['sometimes', 'numeric'],
            'hargaJual' => ['sometimes', 'numeric'],
            'diskon' => ['sometimes', 'numeric'],
        ]);

        $barang->update([
            'nama' => $validated['nama'] ?? $barang->nama,
            'kategori' => array_key_exists('kategori', $validated) ? $validated['kategori'] : $barang->kategori,
            'ukuran' => array_key_exists('ukuran', $validated) ? implode(',', $validated['ukuran']) : $barang->ukuran,
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

    private function normalizeUkuranInRequest(Request $request): void
    {
        $value = $request->input('ukuran');
        if ($value === null) return;
        if (is_array($value)) {
            $request->merge([
                'ukuran' => array_values(array_filter(array_map(fn ($v) => strtoupper(trim((string) $v)), $value))),
            ]);
            return;
        }
        if (is_string($value)) {
            $parts = preg_split('/\s*,\s*/', strtoupper(trim($value))) ?: [];
            $request->merge(['ukuran' => array_values(array_filter($parts))]);
        }
    }

    private function normalizeUkuran(?string $value): array
    {
        $raw = strtoupper(trim((string) $value));
        if ($raw === '') return [];
        $parts = preg_split('/\s*,\s*/', $raw) ?: [];
        return array_values(array_filter($parts));
    }
}
