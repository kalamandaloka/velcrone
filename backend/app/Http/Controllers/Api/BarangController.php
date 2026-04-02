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
    private const JENIS_OPTIONS = ['Atasan', 'Pants'];

    public function index(): JsonResponse
    {
        $data = Barang::query()->orderBy('nama')->get()->map(function ($b) {
            return [
                'kode' => $b->kode,
                'nama' => $b->nama,
                'kategori' => $b->kategori,
                'jenis' => $this->normalizeJenis($b->jenis),
                'ukuran' => $this->normalizeUkuran($b->ukuran),
                'warna' => $this->normalizeWarna($b->warna),
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
            'jenis' => $this->normalizeJenis($b->jenis),
            'ukuran' => $this->normalizeUkuran($b->ukuran),
            'warna' => $this->normalizeWarna($b->warna),
            'hargaBeli' => (float) $b->harga_beli,
            'hargaJual' => (float) $b->harga_jual,
            'diskon' => (float) $b->diskon,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->normalizeUkuranInRequest($request);
        $this->normalizeWarnaInRequest($request);
        $this->normalizeJenisInRequest($request);
        $validated = $request->validate([
            'kode' => ['required', 'string', Rule::unique('barangs', 'kode')],
            'nama' => ['required', 'string'],
            'kategori' => ['nullable', 'string'],
            'jenis' => ['nullable', 'array', 'min:1', 'max:2'],
            'jenis.*' => ['string', Rule::in(self::JENIS_OPTIONS)],
            'ukuran' => ['required', 'array', 'min:1'],
            'ukuran.*' => ['string', Rule::in(self::UKURAN_OPTIONS)],
            'warna' => ['nullable', 'array', 'min:1'],
            'warna.*' => ['string', 'max:50'],
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
            'jenis' => array_key_exists('jenis', $validated) ? implode(',', $validated['jenis']) : null,
            'ukuran' => implode(',', $validated['ukuran']),
            'warna' => array_key_exists('warna', $validated) ? implode(',', $validated['warna']) : null,
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
        $this->normalizeWarnaInRequest($request);
        $this->normalizeJenisInRequest($request);
        $validated = $request->validate([
            'nama' => ['sometimes', 'string'],
            'kategori' => ['sometimes', 'nullable', 'string'],
            'jenis' => ['sometimes', 'nullable', 'array', 'min:1', 'max:2'],
            'jenis.*' => ['string', Rule::in(self::JENIS_OPTIONS)],
            'ukuran' => ['sometimes', 'array', 'min:1'],
            'ukuran.*' => ['string', Rule::in(self::UKURAN_OPTIONS)],
            'warna' => ['sometimes', 'nullable', 'array', 'min:1'],
            'warna.*' => ['string', 'max:50'],
            'hargaBeli' => ['sometimes', 'numeric'],
            'hargaJual' => ['sometimes', 'numeric'],
            'diskon' => ['sometimes', 'numeric'],
        ]);

        $barang->update([
            'nama' => $validated['nama'] ?? $barang->nama,
            'kategori' => array_key_exists('kategori', $validated) ? $validated['kategori'] : $barang->kategori,
            'jenis' => array_key_exists('jenis', $validated)
                ? (($validated['jenis'] !== null && count($validated['jenis']) > 0) ? implode(',', $validated['jenis']) : null)
                : $barang->jenis,
            'ukuran' => array_key_exists('ukuran', $validated) ? implode(',', $validated['ukuran']) : $barang->ukuran,
            'warna' => array_key_exists('warna', $validated)
                ? (($validated['warna'] !== null && count($validated['warna']) > 0) ? implode(',', $validated['warna']) : null)
                : $barang->warna,
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

    private function normalizeWarnaInRequest(Request $request): void
    {
        $value = $request->input('warna');
        if ($value === null) return;

        $normalizeOne = function ($v): array {
            $raw = trim((string) $v);
            if ($raw === '') return [];
            $parts = preg_split('/\s*,\s*/', $raw) ?: [];
            $out = [];
            foreach ($parts as $p) {
                $p = strtolower(trim((string) $p));
                if ($p === '') continue;
                $p = preg_replace('/\s+/', ' ', $p) ?: $p;
                $out[] = $p;
            }
            return $out;
        };

        $list = [];
        if (is_array($value)) {
            foreach ($value as $v) {
                $list = array_merge($list, $normalizeOne($v));
            }
        } elseif (is_string($value)) {
            $list = $normalizeOne($value);
        } else {
            $list = $normalizeOne($value);
        }

        $unique = [];
        foreach ($list as $v) {
            if (! in_array($v, $unique, true)) $unique[] = $v;
        }

        $request->merge(['warna' => $unique]);
    }

    private function normalizeWarna(?string $value): array
    {
        $raw = strtolower(trim((string) $value));
        if ($raw === '') return [];
        $parts = preg_split('/\s*,\s*/', $raw) ?: [];
        $parts = array_values(array_filter(array_map(fn ($v) => strtolower(trim((string) $v)), $parts)));
        $unique = [];
        foreach ($parts as $v) {
            if (! in_array($v, $unique, true)) $unique[] = $v;
        }
        return $unique;
    }

    private function normalizeJenisInRequest(Request $request): void
    {
        $value = $request->input('jenis');
        if ($value === null) return;

        $parts = [];
        if (is_array($value)) {
            $parts = $value;
        } elseif (is_string($value)) {
            $parts = preg_split('/\s*,\s*/', trim($value)) ?: [];
        } else {
            $parts = [(string) $value];
        }

        $map = [];
        foreach (self::JENIS_OPTIONS as $j) {
            $map[strtolower(trim($j))] = $j;
        }

        $unique = [];
        foreach ($parts as $p) {
            $key = strtolower(trim((string) $p));
            if ($key === '') continue;
            if (! array_key_exists($key, $map)) continue;
            $canonical = $map[$key];
            if (! in_array($canonical, $unique, true)) $unique[] = $canonical;
        }

        $request->merge(['jenis' => $unique]);
    }

    private function normalizeJenis(?string $value): array
    {
        $raw = trim((string) $value);
        if ($raw === '') return [];
        $parts = preg_split('/\s*,\s*/', $raw) ?: [];

        $map = [];
        foreach (self::JENIS_OPTIONS as $j) {
            $map[strtolower(trim($j))] = $j;
        }

        $unique = [];
        foreach ($parts as $p) {
            $key = strtolower(trim((string) $p));
            if ($key === '') continue;
            if (! array_key_exists($key, $map)) continue;
            $canonical = $map[$key];
            if (! in_array($canonical, $unique, true)) $unique[] = $canonical;
        }
        return $unique;
    }
}
