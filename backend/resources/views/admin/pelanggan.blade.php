@php($title = 'Pelanggan')
@php($active = 'pelanggan')
@extends('layouts.admin')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
            <h1 class="h4 mb-0">Pelanggan</h1>
            <div class="text-muted small">Kelola data pelanggan</div>
        </div>
    </div>

    @if (session('status'))
        <div class="alert alert-success">{{ session('status') }}</div>
    @endif

    @if ($errors->any())
        <div class="alert alert-danger">
            <div class="fw-semibold mb-1">Validasi gagal</div>
            <ul class="mb-0">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    @if ($canManage)
        <div class="vc-card card mb-3">
            <div class="card-body">
                <h2 class="h6 mb-3">Tambah Pelanggan</h2>
                <form method="post" action="/pelanggan" class="row g-2">
                    @csrf
                    <div class="col-md-2"><input required name="id" class="form-control" placeholder="ID" value="{{ old('id') }}"></div>
                    <div class="col-md-3"><input required name="nama" class="form-control" placeholder="Nama" value="{{ old('nama') }}"></div>
                    <div class="col-md-2"><input name="noTelepon" class="form-control" placeholder="No Telepon" value="{{ old('noTelepon') }}"></div>
                    <div class="col-md-3"><input name="alamat" class="form-control" placeholder="Alamat" value="{{ old('alamat') }}"></div>
                    <div class="col-md-2"><input name="kategori" class="form-control" placeholder="Kategori" value="{{ old('kategori') }}"></div>
                    <div class="col-md-2"><input name="poin" type="number" class="form-control" placeholder="Poin" value="{{ old('poin', 0) }}"></div>
                    <div class="col-12"><button class="btn btn-danger">Simpan</button></div>
                </form>
            </div>
        </div>
    @endif

    <div class="vc-card card">
        <div class="card-body">
            <h2 class="h6 mb-3">Daftar Pelanggan</h2>
            <div class="table-responsive">
                <table class="table table-sm table-striped align-middle">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nama</th>
                            <th>No Telepon</th>
                            <th>Alamat</th>
                            <th>Kategori</th>
                            <th class="text-end">Poin</th>
                            @if ($canManage)
                                <th class="text-end">Aksi</th>
                            @endif
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($pelanggans as $p)
                            <tr>
                                <td><code>{{ $p->id }}</code></td>
                                <td>{{ $p->nama }}</td>
                                <td>{{ (string) $p->no_telepon }}</td>
                                <td>{{ (string) $p->alamat }}</td>
                                <td>{{ (string) $p->kategori }}</td>
                                <td class="text-end">{{ (int) $p->poin }}</td>
                                @if ($canManage)
                                    <td class="text-end">
                                        <form class="d-inline" method="post" action="/pelanggan/{{ $p->id }}/delete">
                                            @csrf
                                            <button class="btn btn-sm btn-outline-danger" onclick="return confirm('Hapus pelanggan ini?')">Hapus</button>
                                        </form>
                                    </td>
                                @endif
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            <div class="text-muted">Untuk edit, gunakan endpoint API: <code>PUT /api/v1/pelanggan/{id}</code></div>
        </div>
    </div>
@endsection
