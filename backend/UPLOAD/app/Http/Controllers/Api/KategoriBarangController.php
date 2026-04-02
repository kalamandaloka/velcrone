<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\KategoriBarang;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KategoriBarangController extends Controller
{
    public function index(): JsonResponse
    {
        $data = KategoriBarang::query()
            ->orderBy('nama')
            ->get()
            ->map(fn ($k) => ['id' => (int) $k->id, 'nama' => (string) $k->nama]);

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', Rule::unique('kategori_barangs', 'nama')],
        ], [
            'nama.unique' => 'Kategori sudah ada',
        ]);

        KategoriBarang::create(['nama' => $validated['nama']]);

        return response()->json(['message' => 'Kategori created'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $kategori = KategoriBarang::findOrFail($id);
        $validated = $request->validate([
            'nama' => ['sometimes', 'string', Rule::unique('kategori_barangs', 'nama')->ignore($kategori->id)],
        ]);

        $namaLama = (string) $kategori->nama;
        $kategori->update([
            'nama' => $validated['nama'] ?? $kategori->nama,
        ]);

        if (array_key_exists('nama', $validated) && $validated['nama'] !== $namaLama) {
            Barang::query()->where('kategori', $namaLama)->update(['kategori' => $validated['nama']]);
        }

        return response()->json(['message' => 'Kategori updated']);
    }

    public function destroy(int $id): JsonResponse
    {
        $kategori = KategoriBarang::findOrFail($id);

        $dipakai = Barang::query()->where('kategori', $kategori->nama)->exists();
        if ($dipakai) {
            return response()->json(['message' => 'Kategori masih dipakai oleh data barang'], 409);
        }

        $kategori->delete();

        return response()->json(['message' => 'Kategori deleted']);
    }
}
