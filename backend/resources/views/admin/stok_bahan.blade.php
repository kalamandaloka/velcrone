@php($title = 'Stok Bahan')
@php($active = 'stok-bahan')
@extends('layouts.admin')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
            <h1 class="h4 mb-0">Stok Bahan</h1>
            <div class="text-muted small">Ringkasan stok bahan baku (dummy)</div>
        </div>
        <button class="btn btn-danger"><i class="bi bi-plus-lg me-1"></i>Tambah Bahan</button>
    </div>

    <div class="row g-3 mb-3">
        <div class="col-md-4">
            <div class="vc-card card">
                <div class="card-body">
                    <div class="text-muted small">Total Jenis Bahan</div>
                    <div class="h3 mb-0">24</div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="vc-card card">
                <div class="card-body">
                    <div class="text-muted small">Stok Menipis</div>
                    <div class="h3 mb-0 text-warning">3</div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="vc-card card">
                <div class="card-body">
                    <div class="text-muted small">Perlu Restock</div>
                    <div class="h3 mb-0 text-danger">2</div>
                </div>
            </div>
        </div>
    </div>

    <div class="vc-card card">
        <div class="card-body">
            @php($items = [
                ['kode' => 'SB-001', 'nama' => 'Tepung Terigu', 'stok' => 25, 'satuan' => 'kg', 'min' => 10],
                ['kode' => 'SB-002', 'nama' => 'Gula Pasir', 'stok' => 8, 'satuan' => 'kg', 'min' => 10],
                ['kode' => 'SB-003', 'nama' => 'Minyak Goreng', 'stok' => 60, 'satuan' => 'liter', 'min' => 15],
                ['kode' => 'SB-004', 'nama' => 'Garam', 'stok' => 4, 'satuan' => 'kg', 'min' => 5],
            ])
            <div class="table-responsive">
                <table class="table table-sm table-striped align-middle">
                    <thead>
                        <tr>
                            <th>Kode</th>
                            <th>Nama Bahan</th>
                            <th class="text-end">Stok</th>
                            <th>Satuan</th>
                            <th class="text-end">Min</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($items as $b)
                            @php($status = $b['stok'] <= $b['min'] ? 'Menipis' : 'Aman')
                            <tr>
                                <td class="fw-semibold">{{ $b['kode'] }}</td>
                                <td>{{ $b['nama'] }}</td>
                                <td class="text-end">{{ $b['stok'] }}</td>
                                <td>{{ $b['satuan'] }}</td>
                                <td class="text-end">{{ $b['min'] }}</td>
                                <td>
                                    <span class="badge {{ $status === 'Aman' ? 'text-bg-success' : 'text-bg-warning' }}">
                                        {{ $status }}
                                    </span>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
@endsection
