<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    private const ALLOWED_ROLES = ['superadmin', 'owner', 'manager', 'kasir'];

    private const ALLOWED_STATUSES = ['active', 'inactive'];

    public function index(): JsonResponse
    {
        $data = User::query()
            ->orderBy('name')
            ->get()
            ->map(function (User $u) {
                return [
                    'id' => (int) $u->id,
                    'name' => (string) $u->name,
                    'email' => (string) $u->email,
                    'role' => (string) ($u->role ?? ''),
                    'status' => (string) ($u->status ?? 'active'),
                    'createdAt' => $u->created_at ? $u->created_at->toDateString() : null,
                ];
            });

        return response()->json($data);
    }

    public function show(int $id): JsonResponse
    {
        $u = User::findOrFail($id);

        return response()->json([
            'id' => (int) $u->id,
            'name' => (string) $u->name,
            'email' => (string) $u->email,
            'role' => (string) ($u->role ?? ''),
            'status' => (string) ($u->status ?? 'active'),
            'createdAt' => $u->created_at ? $u->created_at->toDateString() : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string'],
            'email' => ['required', 'email', Rule::unique('users', 'email')],
            'role' => ['required', 'string', Rule::in(self::ALLOWED_ROLES)],
            'status' => ['required', 'string', Rule::in(self::ALLOWED_STATUSES)],
            'password' => ['nullable', 'string', 'min:6'],
        ], [
            'email.unique' => 'Email sudah terpakai',
        ]);

        $u = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'status' => $validated['status'],
            'password' => $validated['password'] ?? '123456',
        ]);

        return response()->json(['message' => 'User created', 'id' => (int) $u->id], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $u = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string'],
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($u->id)],
            'role' => ['sometimes', 'string', Rule::in(self::ALLOWED_ROLES)],
            'status' => ['sometimes', 'string', Rule::in(self::ALLOWED_STATUSES)],
            'password' => ['sometimes', 'nullable', 'string', 'min:6'],
        ], [
            'email.unique' => 'Email sudah terpakai',
        ]);

        $update = [
            'name' => $validated['name'] ?? $u->name,
            'email' => $validated['email'] ?? $u->email,
            'role' => $validated['role'] ?? $u->role,
            'status' => $validated['status'] ?? $u->status,
        ];

        if (array_key_exists('password', $validated) && $validated['password']) {
            $update['password'] = $validated['password'];
        }

        $u->update($update);

        return response()->json(['message' => 'User updated']);
    }

    public function destroy(int $id): JsonResponse
    {
        $u = User::findOrFail($id);
        $u->delete();

        return response()->json(['message' => 'User deleted']);
    }
}
