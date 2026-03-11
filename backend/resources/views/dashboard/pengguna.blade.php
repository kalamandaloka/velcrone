@php($title = 'Dashboard Pengguna')
@extends('layouts.app')

@section('content')
    <div class="card">
        <div class="card-body">
            <h1 class="h4 mb-2">Dashboard Pengguna</h1>
            <p class="text-muted mb-3">Akses terbatas untuk melihat informasi.</p>
            <div class="d-flex gap-2 flex-wrap">
                <a class="btn btn-danger" href="/api/v1/barang" target="_blank">Lihat API Barang</a>
            </div>
        </div>
    </div>
@endsection
