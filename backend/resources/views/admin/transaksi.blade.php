@php($title = 'Transaksi')
@php($active = 'transaksi')
@extends('layouts.admin')

@section('content')
    <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
            <h1 class="h4 mb-0">Transaksi</h1>
            <div class="text-muted small">Daftar transaksi (dummy)</div>
        </div>
        <button class="btn btn-danger"><i class="bi bi-plus-lg me-1"></i>Transaksi Baru</button>
    </div>

    <div class="vc-card card">
        <div class="card-body">
            @php($items = [
                ['no' => 'TX-1001', 'tanggal' => '2026-03-07 10:12', 'kasir' => 'Dewi', 'pelanggan' => 'Budi', 'total' => '150.000', 'status' => 'Selesai'],
                ['no' => 'TX-1002', 'tanggal' => '2026-03-07 11:40', 'kasir' => 'Rina', 'pelanggan' => 'Sari', 'total' => '85.000', 'status' => 'Selesai'],
                ['no' => 'TX-1003', 'tanggal' => '2026-03-08 09:01', 'kasir' => 'Yusuf', 'pelanggan' => 'Andi', 'total' => '220.000', 'status' => 'Pending'],
            ])
            <div class="table-responsive">
                <table class="table table-sm table-striped align-middle">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Tanggal</th>
                            <th>Kasir</th>
                            <th>Pelanggan</th>
                            <th>Status</th>
                            <th class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($items as $t)
                            <tr>
                                <td class="fw-semibold">{{ $t['no'] }}</td>
                                <td>{{ $t['tanggal'] }}</td>
                                <td>{{ $t['kasir'] }}</td>
                                <td>{{ $t['pelanggan'] }}</td>
                                <td>
                                    <span class="badge {{ $t['status'] === 'Selesai' ? 'text-bg-success' : 'text-bg-warning' }}">
                                        {{ $t['status'] }}
                                    </span>
                                </td>
                                <td class="text-end">{{ $t['total'] }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
@endsection
