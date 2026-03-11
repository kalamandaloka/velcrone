<?php

use App\Models\Barang;
use App\Models\Pelanggan;
use App\Models\Pemasok;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

if (! function_exists('velcroneLayout')) {
    function velcroneLayout(string $title, string $content): string
    {
        $appName = config('app.name', 'Velcrone');
        $csrf = csrf_token();
        $userNav = '<a class="btn btn-outline-light btn-sm" href="/login">Login</a>';

        if (Auth::check()) {
            $user = Auth::user();
            $name = e($user->name);
            $role = e((string) ($user->role ?? ''));

            $userNav = <<<HTML
<span class="text-white-50 small">{$name} <span class="opacity-75">({$role})</span></span>
<form method="post" action="/logout" class="d-inline">
    <input type="hidden" name="_token" value="{$csrf}">
    <button class="btn btn-light btn-sm">Logout</button>
</form>
HTML;
        }

        return <<<HTML
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{$title} - {$appName}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <nav class="navbar navbar-expand-lg navbar-dark bg-danger">
        <div class="container">
            <a class="navbar-brand" href="/">{$appName}</a>
            <div class="navbar-nav">
                <a class="nav-link" href="/barang">Barang</a>
                <a class="nav-link" href="/pelanggan">Pelanggan</a>
                <a class="nav-link" href="/pemasok">Pemasok</a>
            </div>
            <div class="d-flex gap-2 align-items-center">
                {$userNav}
            </div>
        </div>
    </nav>
    <main class="container py-4">
        {$content}
        <form id="__csrf" class="d-none"><input type="hidden" name="_token" value="{$csrf}"></form>
    </main>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
HTML;
    }
}

Route::get('/login', function () {
    if (Auth::check()) {
        return redirect('/dashboard');
    }

    return view('auth.login');
})->name('login');

Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required', 'string'],
    ]);

    try {
        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            return redirect()->intended('/dashboard');
        }
    } catch (\Throwable $e) {
        return back()
            ->withErrors(['email' => 'Tidak dapat terhubung ke database'])
            ->with('db_error', $e->getMessage())
            ->onlyInput('email');
    }

    return back()
        ->withErrors(['email' => 'Email atau password salah'])
        ->onlyInput('email');
});

Route::post('/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/login');
});

Route::middleware(Authenticate::class)->group(function () {
    Route::get('/', function () {
        return redirect('/dashboard');
    });

    Route::get('/dashboard', function () {
        $role = (string) (Auth::user()->role ?? 'pengguna');
        $views = [
            'administrator' => 'dashboard.administrator',
            'owner' => 'dashboard.owner',
            'manager' => 'dashboard.manager',
            'kasir' => 'dashboard.kasir',
            'pengguna' => 'dashboard.pengguna',
        ];
        $view = $views[$role] ?? 'dashboard.pengguna';

        return view($view);
    });

    Route::middleware('role:administrator')->group(function () {
        Route::get('/admin/transaksi', fn () => view('admin.transaksi'));
        Route::get('/admin/stok-bahan', fn () => view('admin.stok_bahan'));
        Route::get('/admin/laporan', fn () => view('admin.laporan'));
    });

    Route::get('/barang', function () {
        $role = (string) (Auth::user()->role ?? 'pengguna');
        $canManage = in_array($role, ['administrator', 'owner', 'manager'], true);

        return view('admin.barang', [
            'barangs' => Barang::query()->orderBy('nama')->get(),
            'canManage' => $canManage,
        ]);
    });

    Route::middleware('role:administrator,owner,manager')->post('/barang', function (Request $request) {
        $validated = $request->validate([
            'kode' => ['required', 'string'],
            'nama' => ['required', 'string'],
            'stok' => ['nullable', 'integer'],
            'satuan' => ['required', 'string'],
            'hargaBeli' => ['required', 'numeric'],
            'hargaJual' => ['required', 'numeric'],
            'diskon' => ['nullable', 'numeric'],
        ]);

        Barang::updateOrCreate(['kode' => $validated['kode']], [
            'kode' => $validated['kode'],
            'nama' => $validated['nama'],
            'stok' => $validated['stok'] ?? 0,
            'satuan' => $validated['satuan'],
            'harga_beli' => $validated['hargaBeli'],
            'harga_jual' => $validated['hargaJual'],
            'diskon' => $validated['diskon'] ?? 0,
        ]);

        return redirect('/barang')->with('status', 'Barang disimpan');
    });

    Route::middleware('role:administrator,owner,manager')->post('/barang/{kode}/delete', function (string $kode) {
        $barang = Barang::findOrFail($kode);
        $barang->delete();

        return redirect('/barang')->with('status', 'Barang dihapus');
    });

    Route::get('/pelanggan', function () {
        $role = (string) (Auth::user()->role ?? 'pengguna');
        $canManage = in_array($role, ['administrator', 'owner', 'manager'], true);

        return view('admin.pelanggan', [
            'pelanggans' => Pelanggan::query()->orderBy('nama')->get(),
            'canManage' => $canManage,
        ]);
    });

    Route::middleware('role:administrator,owner,manager')->post('/pelanggan', function (Request $request) {
        $validated = $request->validate([
            'id' => ['required', 'string'],
            'nama' => ['required', 'string'],
            'noTelepon' => ['nullable', 'string'],
            'alamat' => ['nullable', 'string'],
            'kategori' => ['nullable', 'string'],
            'poin' => ['nullable', 'integer'],
        ]);

        Pelanggan::updateOrCreate(['id' => $validated['id']], [
            'id' => $validated['id'],
            'nama' => $validated['nama'],
            'no_telepon' => $validated['noTelepon'] ?? null,
            'alamat' => $validated['alamat'] ?? null,
            'kategori' => $validated['kategori'] ?? null,
            'poin' => $validated['poin'] ?? 0,
        ]);

        return redirect('/pelanggan')->with('status', 'Pelanggan disimpan');
    });

    Route::middleware('role:administrator,owner,manager')->post('/pelanggan/{id}/delete', function (string $id) {
        $p = Pelanggan::findOrFail($id);
        $p->delete();

        return redirect('/pelanggan')->with('status', 'Pelanggan dihapus');
    });

    Route::get('/pemasok', function () {
        $role = (string) (Auth::user()->role ?? 'pengguna');
        $canManage = in_array($role, ['administrator', 'owner', 'manager'], true);

        return view('admin.pemasok', [
            'pemasoks' => Pemasok::query()->orderBy('nama_perusahaan')->get(),
            'canManage' => $canManage,
        ]);
    });

    Route::middleware('role:administrator,owner,manager')->post('/pemasok', function (Request $request) {
        $validated = $request->validate([
            'id' => ['required', 'string'],
            'namaPerusahaan' => ['required', 'string'],
            'kontakPerson' => ['nullable', 'string'],
            'noTelepon' => ['nullable', 'string'],
            'alamat' => ['nullable', 'string'],
            'jenisProduk' => ['nullable', 'string'],
        ]);

        Pemasok::updateOrCreate(['id' => $validated['id']], [
            'id' => $validated['id'],
            'nama_perusahaan' => $validated['namaPerusahaan'],
            'kontak_person' => $validated['kontakPerson'] ?? null,
            'no_telepon' => $validated['noTelepon'] ?? null,
            'alamat' => $validated['alamat'] ?? null,
            'jenis_produk' => $validated['jenisProduk'] ?? null,
        ]);

        return redirect('/pemasok')->with('status', 'Pemasok disimpan');
    });

    Route::middleware('role:administrator,owner,manager')->post('/pemasok/{id}/delete', function (string $id) {
        $s = Pemasok::findOrFail($id);
        $s->delete();

        return redirect('/pemasok')->with('status', 'Pemasok dihapus');
    });
});
