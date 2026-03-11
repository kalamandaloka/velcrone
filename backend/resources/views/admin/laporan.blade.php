@php($title = 'Laporan')
@php($active = 'laporan')
@extends('layouts.admin')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
            <h1 class="h4 mb-0">Laporan</h1>
            <div class="text-muted small">Ringkasan performa (dummy)</div>
        </div>
        <button class="btn btn-outline-secondary"><i class="bi bi-download me-1"></i>Export</button>
    </div>

    <div class="row g-3 mb-3">
        <div class="col-md-4">
            <div class="vc-card card">
                <div class="card-body">
                    <div class="text-muted small">Pendapatan Bulan Ini</div>
                    <div class="h3 mb-0">15.750.000</div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="vc-card card">
                <div class="card-body">
                    <div class="text-muted small">Jumlah Transaksi</div>
                    <div class="h3 mb-0">143</div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="vc-card card">
                <div class="card-body">
                    <div class="text-muted small">Rata-rata / Hari</div>
                    <div class="h3 mb-0">4.5</div>
                </div>
            </div>
        </div>
    </div>

    <div class="vc-card card">
        <div class="card-body">
            <div class="fw-semibold mb-2">Ringkasan Mingguan (Dummy)</div>
            @php($items = [
                ['minggu' => 'M-1', 'transaksi' => 120, 'pendapatan' => '12.500.000'],
                ['minggu' => 'M-2', 'transaksi' => 98, 'pendapatan' => '10.300.000'],
                ['minggu' => 'M-3', 'transaksi' => 143, 'pendapatan' => '15.750.000'],
            ])
            <div class="table-responsive">
                <table class="table table-sm table-striped align-middle">
                    <thead>
                        <tr>
                            <th>Minggu</th>
                            <th class="text-end">Jumlah Transaksi</th>
                            <th class="text-end">Pendapatan</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($items as $r)
                            <tr>
                                <td class="fw-semibold">{{ $r['minggu'] }}</td>
                                <td class="text-end">{{ $r['transaksi'] }}</td>
                                <td class="text-end">{{ $r['pendapatan'] }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
@endsection
