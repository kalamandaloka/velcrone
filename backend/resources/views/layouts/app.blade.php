<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? config('app.name', 'Velcrone') }}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <nav class="navbar navbar-expand-lg navbar-dark bg-danger">
        <div class="container">
            <a class="navbar-brand" href="/">{{ config('app.name', 'Velcrone') }}</a>
            <div class="navbar-nav">
                <a class="nav-link" href="/barang">Barang</a>
                <a class="nav-link" href="/pelanggan">Pelanggan</a>
                <a class="nav-link" href="/pemasok">Pemasok</a>
            </div>
            <div class="ms-auto d-flex align-items-center gap-2">
                @auth
                    <span class="text-white-50 small">
                        {{ auth()->user()->name }}
                        <span class="opacity-75">({{ auth()->user()->role }})</span>
                    </span>
                    <form method="post" action="/logout" class="d-inline">
                        @csrf
                        <button class="btn btn-light btn-sm">Logout</button>
                    </form>
                @else
                    <a class="btn btn-outline-light btn-sm" href="{{ route('login') }}">Login</a>
                @endauth
            </div>
        </div>
    </nav>
    <main class="container py-4">
        @yield('content')
    </main>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
