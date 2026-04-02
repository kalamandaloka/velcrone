<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pemasok;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PemasokController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Pemasok::query()->orderBy('nama_perusahaan')->get()->map(function ($s) {
            return [
                'id' => $s->id,
                'namaPerusahaan' => $s->nama_perusahaan,
                'kontakPerson' => $s->kontak_person,
                'noTelepon' => $s->no_telepon,
                'alamat' => $s->alamat,
                'jenisProduk' => $s->jenis_produk,
            ];
        });

        return response()->json($data);
    }

    public function show(string $id): JsonResponse
    {
        $s = Pemasok::findOrFail($id);

        return response()->json([
            'id' => $s->id,
            'namaPerusahaan' => $s->nama_perusahaan,
            'kontakPerson' => $s->kontak_person,
            'noTelepon' => $s->no_telepon,
            'alamat' => $s->alamat,
            'jenisProduk' => $s->jenis_produk,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'string'],
            'namaPerusahaan' => ['required', 'string'],
            'kontakPerson' => ['nullable', 'string'],
            'noTelepon' => ['nullable', 'string'],
            'alamat' => ['nullable', 'string'],
            'jenisProduk' => ['nullable', 'string'],
        ]);

        Pemasok::create([
            'id' => $validated['id'],
            'nama_perusahaan' => $validated['namaPerusahaan'],
            'kontak_person' => $validated['kontakPerson'] ?? null,
            'no_telepon' => $validated['noTelepon'] ?? null,
            'alamat' => $validated['alamat'] ?? null,
            'jenis_produk' => $validated['jenisProduk'] ?? null,
        ]);

        return response()->json(['message' => 'Pemasok created'], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $s = Pemasok::findOrFail($id);
        $validated = $request->validate([
            'namaPerusahaan' => ['sometimes', 'string'],
            'kontakPerson' => ['sometimes', 'string'],
            'noTelepon' => ['sometimes', 'string'],
            'alamat' => ['sometimes', 'string'],
            'jenisProduk' => ['sometimes', 'string'],
        ]);

        $s->update([
            'nama_perusahaan' => $validated['namaPerusahaan'] ?? $s->nama_perusahaan,
            'kontak_person' => $validated['kontakPerson'] ?? $s->kontak_person,
            'no_telepon' => $validated['noTelepon'] ?? $s->no_telepon,
            'alamat' => $validated['alamat'] ?? $s->alamat,
            'jenis_produk' => $validated['jenisProduk'] ?? $s->jenis_produk,
        ]);

        return response()->json(['message' => 'Pemasok updated']);
    }

    public function destroy(string $id): JsonResponse
    {
        $s = Pemasok::findOrFail($id);
        $s->delete();

        return response()->json(['message' => 'Pemasok deleted']);
    }
}
