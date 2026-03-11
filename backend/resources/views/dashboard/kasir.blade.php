@php($title = 'Dashboard Kasir')
@extends('layouts.app')

@section('content')
    <div class="card">
        <div class="card-body">
            <h1 class="h4 mb-2">Dashboard Kasir</h1>
            <p class="text-muted mb-3">Akses transaksi dan pelanggan.</p>
            <div class="d-flex gap-2 flex-wrap">
                <a class="btn btn-outline-danger" href="/pelanggan">Kelola Pelanggan</a>
                <a class="btn btn-danger" href="/api/v1/pelanggan" target="_blank">Cek API Pelanggan</a>
            </div>
        </div>
    </div>
@endsection
