@php($title = 'Pemasok')
@php($active = 'pemasok')
@extends('layouts.admin')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
            <h1 class="h4 mb-0">Pemasok</h1>
            <div class="text-muted small">Kelola data pemasok</div>
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
                <h2 class="h6 mb-3">Tambah Pemasok</h2>
                <form method="post" action="/pemasok" class="row g-2">
                    @csrf
                    <div class="col-md-2"><input required name="id" class="form-control" placeholder="ID" value="{{ old('id') }}"></div>
                    <div class="col-md-3"><input required name="namaPerusahaan" class="form-control" placeholder="Nama Perusahaan" value="{{ old('namaPerusahaan') }}"></div>
                    <div class="col-md-2"><input name="kontakPerson" class="form-control" placeholder="Kontak Person" value="{{ old('kontakPerson') }}"></div>
                    <div class="col-md-2"><input name="noTelepon" class="form-control" placeholder="No Telepon" value="{{ old('noTelepon') }}"></div>
                    <div class="col-md-3"><input name="alamat" class="form-control" placeholder="Alamat" value="{{ old('alamat') }}"></div>
                    <div class="col-md-3"><input name="jenisProduk" class="form-control" placeholder="Jenis Produk" value="{{ old('jenisProduk') }}"></div>
                    <div class="col-12"><button class="btn btn-danger">Simpan</button></div>
                </form>
            </div>
        </div>
    @endif

    <div class="vc-card card">
        <div class="card-body">
            <h2 class="h6 mb-3">Daftar Pemasok</h2>
            <div class="table-responsive">
                <table class="table table-sm table-striped align-middle">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nama Perusahaan</th>
                            <th>Kontak</th>
                            <th>No Telepon</th>
                            <th>Alamat</th>
                            <th>Jenis Produk</th>
                            @if ($canManage)
                                <th class="text-end">Aksi</th>
                            @endif
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($pemasoks as $s)
                            <tr>
                                <td><code>{{ $s->id }}</code></td>
                                <td>{{ $s->nama_perusahaan }}</td>
                                <td>{{ (string) $s->kontak_person }}</td>
                                <td>{{ (string) $s->no_telepon }}</td>
                                <td>{{ (string) $s->alamat }}</td>
                                <td>{{ (string) $s->jenis_produk }}</td>
                                @if ($canManage)
                                    <td class="text-end">
                                        <form class="d-inline" method="post" action="/pemasok/{{ $s->id }}/delete">
                                            @csrf
                                            <button class="btn btn-sm btn-outline-danger" onclick="return confirm('Hapus pemasok ini?')">Hapus</button>
                                        </form>
                                    </td>
                                @endif
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            <div class="text-muted">Untuk edit, gunakan endpoint API: <code>PUT /api/v1/pemasok/{id}</code></div>
        </div>
    </div>
@endsection
