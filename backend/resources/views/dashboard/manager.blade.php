@php($title = 'Dashboard Manager')
@extends('layouts.app')

@section('content')
    <div class="card">
        <div class="card-body">
            <h1 class="h4 mb-2">Dashboard Manager</h1>
            <p class="text-muted mb-3">Akses operasional harian.</p>
            <div class="d-flex gap-2 flex-wrap">
                <a class="btn btn-outline-danger" href="/barang">Kelola Barang</a>
                <a class="btn btn-outline-danger" href="/pelanggan">Kelola Pelanggan</a>
                <a class="btn btn-outline-danger" href="/pemasok">Kelola Pemasok</a>
            </div>
        </div>
    </div>
@endsection
