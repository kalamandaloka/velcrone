@php($title = 'Barang')
@php($active = 'barang')
@extends('layouts.admin')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
            <h1 class="h4 mb-0">Barang</h1>
            <div class="text-muted small">Kelola data barang</div>
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
                <h2 class="h6 mb-3">Tambah Barang</h2>
                <form method="post" action="/barang" class="row g-2">
                    @csrf
                    <div class="col-md-2"><input required name="kode" class="form-control" placeholder="Kode" value="{{ old('kode') }}"></div>
                    <div class="col-md-3"><input required name="nama" class="form-control" placeholder="Nama" value="{{ old('nama') }}"></div>
                    <div class="col-md-1"><input required name="stok" type="number" class="form-control" placeholder="Stok" value="{{ old('stok', 0) }}"></div>
                    <div class="col-md-1"><input required name="satuan" class="form-control" placeholder="Satuan" value="{{ old('satuan', 'pcs') }}"></div>
                    <div class="col-md-2"><input required name="hargaBeli" type="number" step="0.01" class="form-control" placeholder="Harga Beli" value="{{ old('hargaBeli') }}"></div>
                    <div class="col-md-2"><input required name="hargaJual" type="number" step="0.01" class="form-control" placeholder="Harga Jual" value="{{ old('hargaJual') }}"></div>
                    <div class="col-md-1"><input name="diskon" type="number" step="0.01" class="form-control" placeholder="Diskon" value="{{ old('diskon', 0) }}"></div>
                    <div class="col-12"><button class="btn btn-danger">Simpan</button></div>
                </form>
            </div>
        </div>
    @endif

    <div class="vc-card card">
        <div class="card-body">
            <h2 class="h6 mb-3">Daftar Barang</h2>
            <div class="table-responsive">
                <table class="table table-sm table-striped align-middle">
                    <thead>
                        <tr>
                            <th>Kode</th>
                            <th>Nama</th>
                            <th class="text-end">Stok</th>
                            <th>Satuan</th>
                            <th class="text-end">Harga Beli</th>
                            <th class="text-end">Harga Jual</th>
                            <th class="text-end">Diskon</th>
                            @if ($canManage)
                                <th class="text-end">Aksi</th>
                            @endif
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($barangs as $b)
                            <tr>
                                <td><code>{{ $b->kode }}</code></td>
                                <td>{{ $b->nama }}</td>
                                <td class="text-end">{{ (int) $b->stok }}</td>
                                <td>{{ $b->satuan }}</td>
                                <td class="text-end">{{ (float) $b->harga_beli }}</td>
                                <td class="text-end">{{ (float) $b->harga_jual }}</td>
                                <td class="text-end">{{ (float) $b->diskon }}</td>
                                @if ($canManage)
                                    <td class="text-end">
                                        <form class="d-inline" method="post" action="/barang/{{ $b->kode }}/delete">
                                            @csrf
                                            <button class="btn btn-sm btn-outline-danger" onclick="return confirm('Hapus barang ini?')">Hapus</button>
                                        </form>
                                    </td>
                                @endif
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            <div class="text-muted">Untuk edit, gunakan endpoint API: <code>PUT /api/v1/barang/{kode}</code></div>
        </div>
    </div>
@endsection
