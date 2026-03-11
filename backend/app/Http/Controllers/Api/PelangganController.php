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
                'noTelepon' => $p->no_telepon,
                'alamat' => $p->alamat,
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
            'noTelepon' => $p->no_telepon,
            'alamat' => $p->alamat,
            'kategori' => $p->kategori,
            'poin' => (int) $p->poin,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'string'],
            'nama' => ['required', 'string'],
            'noTelepon' => ['nullable', 'string'],
            'alamat' => ['nullable', 'string'],
            'kategori' => ['nullable', 'string'],
            'poin' => ['nullable', 'integer'],
        ]);

        Pelanggan::create([
            'id' => $validated['id'],
            'nama' => $validated['nama'],
            'no_telepon' => $validated['noTelepon'] ?? null,
            'alamat' => $validated['alamat'] ?? null,
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
            'noTelepon' => ['sometimes', 'string'],
            'alamat' => ['sometimes', 'string'],
            'kategori' => ['sometimes', 'string'],
            'poin' => ['sometimes', 'integer'],
        ]);

        $p->update([
            'nama' => $validated['nama'] ?? $p->nama,
            'no_telepon' => $validated['noTelepon'] ?? $p->no_telepon,
            'alamat' => $validated['alamat'] ?? $p->alamat,
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
