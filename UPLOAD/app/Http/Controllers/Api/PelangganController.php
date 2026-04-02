<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pelanggan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PelangganController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Pelanggan::query()->orderBy('nama')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'nama' => $p->nama,
                'email' => $p->email,
                'noTelepon' => $p->no_telepon,
                'alamat' => $p->alamat,
                'provinsiId' => $p->provinsi_id,
                'provinsi' => $p->provinsi,
                'kotaKabId' => $p->kota_kab_id,
                'kotaKab' => $p->kota_kab,
                'kecamatanId' => $p->kecamatan_id,
                'kecamatan' => $p->kecamatan,
                'kelurahanId' => $p->kelurahan_id,
                'kelurahan' => $p->kelurahan,
                'kodepos' => $p->kodepos,
                'kategori' => $p->kategori,
                'poin' => (int) $p->poin,
            ];
        });

        return response()->json($data);
    }

    public function show(string $id): JsonResponse
    {
        $p = Pelanggan::findOrFail($id);

        return response()->json([
            'id' => $p->id,
            'nama' => $p->nama,
            'email' => $p->email,
            'noTelepon' => $p->no_telepon,
            'alamat' => $p->alamat,
            'provinsiId' => $p->provinsi_id,
            'provinsi' => $p->provinsi,
            'kotaKabId' => $p->kota_kab_id,
            'kotaKab' => $p->kota_kab,
            'kecamatanId' => $p->kecamatan_id,
            'kecamatan' => $p->kecamatan,
            'kelurahanId' => $p->kelurahan_id,
            'kelurahan' => $p->kelurahan,
            'kodepos' => $p->kodepos,
            'kategori' => $p->kategori,
            'poin' => (int) $p->poin,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'string'],
            'nama' => ['required', 'string'],
            'email' => ['nullable', 'email'],
            'noTelepon' => ['nullable', 'string'],
            'alamat' => ['nullable', 'string'],
            'provinsiId' => ['nullable', 'string'],
            'provinsi' => ['nullable', 'string'],
            'kotaKabId' => ['nullable', 'string'],
            'kotaKab' => ['nullable', 'string'],
            'kecamatanId' => ['nullable', 'string'],
            'kecamatan' => ['nullable', 'string'],
            'kelurahanId' => ['nullable', 'string'],
            'kelurahan' => ['nullable', 'string'],
            'kodepos' => ['nullable', 'string'],
            'kategori' => ['nullable', 'string'],
            'poin' => ['nullable', 'integer'],
        ]);

        Pelanggan::create([
            'id' => $validated['id'],
            'nama' => $validated['nama'],
            'email' => $validated['email'] ?? null,
            'no_telepon' => $validated['noTelepon'] ?? null,
            'alamat' => $validated['alamat'] ?? null,
            'provinsi_id' => $validated['provinsiId'] ?? null,
            'provinsi' => $validated['provinsi'] ?? null,
            'kota_kab_id' => $validated['kotaKabId'] ?? null,
            'kota_kab' => $validated['kotaKab'] ?? null,
            'kecamatan_id' => $validated['kecamatanId'] ?? null,
            'kecamatan' => $validated['kecamatan'] ?? null,
            'kelurahan_id' => $validated['kelurahanId'] ?? null,
            'kelurahan' => $validated['kelurahan'] ?? null,
            'kodepos' => $validated['kodepos'] ?? null,
            'kategori' => $validated['kategori'] ?? null,
            'poin' => $validated['poin'] ?? 0,
        ]);

        return response()->json(['message' => 'Pelanggan created'], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $p = Pelanggan::findOrFail($id);
        $validated = $request->validate([
            'nama' => ['sometimes', 'string'],
            'email' => ['sometimes', 'nullable', 'email'],
            'noTelepon' => ['sometimes', 'string'],
            'alamat' => ['sometimes', 'string'],
            'provinsiId' => ['sometimes', 'nullable', 'string'],
            'provinsi' => ['sometimes', 'nullable', 'string'],
            'kotaKabId' => ['sometimes', 'nullable', 'string'],
            'kotaKab' => ['sometimes', 'nullable', 'string'],
            'kecamatanId' => ['sometimes', 'nullable', 'string'],
            'kecamatan' => ['sometimes', 'nullable', 'string'],
            'kelurahanId' => ['sometimes', 'nullable', 'string'],
            'kelurahan' => ['sometimes', 'nullable', 'string'],
            'kodepos' => ['sometimes', 'nullable', 'string'],
            'kategori' => ['sometimes', 'string'],
            'poin' => ['sometimes', 'integer'],
        ]);

        $p->update([
            'nama' => $validated['nama'] ?? $p->nama,
            'email' => array_key_exists('email', $validated) ? ($validated['email'] ?? null) : $p->email,
            'no_telepon' => $validated['noTelepon'] ?? $p->no_telepon,
            'alamat' => $validated['alamat'] ?? $p->alamat,
            'provinsi_id' => array_key_exists('provinsiId', $validated) ? ($validated['provinsiId'] ?? null) : $p->provinsi_id,
            'provinsi' => array_key_exists('provinsi', $validated) ? ($validated['provinsi'] ?? null) : $p->provinsi,
            'kota_kab_id' => array_key_exists('kotaKabId', $validated) ? ($validated['kotaKabId'] ?? null) : $p->kota_kab_id,
            'kota_kab' => array_key_exists('kotaKab', $validated) ? ($validated['kotaKab'] ?? null) : $p->kota_kab,
            'kecamatan_id' => array_key_exists('kecamatanId', $validated) ? ($validated['kecamatanId'] ?? null) : $p->kecamatan_id,
            'kecamatan' => array_key_exists('kecamatan', $validated) ? ($validated['kecamatan'] ?? null) : $p->kecamatan,
            'kelurahan_id' => array_key_exists('kelurahanId', $validated) ? ($validated['kelurahanId'] ?? null) : $p->kelurahan_id,
            'kelurahan' => array_key_exists('kelurahan', $validated) ? ($validated['kelurahan'] ?? null) : $p->kelurahan,
            'kodepos' => array_key_exists('kodepos', $validated) ? ($validated['kodepos'] ?? null) : $p->kodepos,
            'kategori' => $validated['kategori'] ?? $p->kategori,
            'poin' => $validated['poin'] ?? $p->poin,
        ]);

        return response()->json(['message' => 'Pelanggan updated']);
    }

    public function destroy(string $id): JsonResponse
    {
        $p = Pelanggan::findOrFail($id);
        $p->delete();

        return response()->json(['message' => 'Pelanggan deleted']);
    }
}
