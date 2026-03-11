@php($appName = config('app.name', 'Velcrone'))
@php($titleText = $title ?? $appName)
@php($active = $active ?? '')
@php($role = (string) (auth()->user()->role ?? ''))
@php($isAdmin = $role === 'administrator')
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $titleText }}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        :root { --vc-sidebar: 280px; }
        body { background: #f6f7fb; overflow: hidden; }
        .vc-shell { height: 100vh; }
        .vc-sidebar { width: var(--vc-sidebar); background: #fff; border-right: 1px solid rgba(0,0,0,.06); position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        .vc-brand { font-weight: 700; letter-spacing: .2px; }
        .vc-nav a { border-radius: 10px; color: #4b5563; }
        .vc-nav a:hover { background: rgba(220,53,69,.06); color: #111827; }
        .vc-nav .active { background: rgba(220,53,69,.12); color: #dc3545; font-weight: 600; }
        .vc-card { border: 0; border-radius: 16px; box-shadow: 0 6px 18px rgba(17,24,39,.06); }
        .vc-card .vc-icon { width: 40px; height: 40px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; }
        .vc-topbar { background: transparent; }
        .vc-search { background: #fff; border-radius: 14px; border: 1px solid rgba(0,0,0,.06); }
        .vc-search input { border: 0; box-shadow: none; }
        .vc-search .input-group-text { background: transparent; border: 0; color: #6b7280; }
        .vc-content { width: 100%; overflow-y: auto; height: 100vh; }
        .vc-main { padding: 22px; }
        @media (max-width: 992px) {
            .vc-sidebar { position: fixed; inset: 0 auto 0 0; transform: translateX(-100%); transition: transform .2s ease; z-index: 1040; }
            .vc-sidebar.show { transform: translateX(0); }
            .vc-backdrop { position: fixed; inset: 0; background: rgba(17,24,39,.45); z-index: 1039; display: none; }
            .vc-backdrop.show { display: block; }
        }
    </style>
</head>
<body>
<div class="vc-shell d-flex">
    <div id="vcBackdrop" class="vc-backdrop"></div>
    <aside id="vcSidebar" class="vc-sidebar p-3">
        <div class="d-flex align-items-center justify-content-between mb-4">
            <div class="vc-brand text-danger">{{ $appName }}</div>
            <button class="btn btn-sm btn-outline-secondary d-lg-none" type="button" onclick="window.__vcToggleSidebar(false)">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
        <div class="vc-nav list-group list-group-flush gap-1">
            <a class="list-group-item list-group-item-action px-3 py-2 {{ $active === 'dashboard' ? 'active' : '' }}" href="/dashboard">
                <i class="bi bi-grid me-2"></i>Dashboard
            </a>
            <a class="list-group-item list-group-item-action px-3 py-2 {{ $active === 'barang' ? 'active' : '' }}" href="/barang">
                <i class="bi bi-box-seam me-2"></i>Barang
            </a>
            <a class="list-group-item list-group-item-action px-3 py-2 {{ $active === 'pelanggan' ? 'active' : '' }}" href="/pelanggan">
                <i class="bi bi-people me-2"></i>Pelanggan
            </a>
            <a class="list-group-item list-group-item-action px-3 py-2 {{ $active === 'pemasok' ? 'active' : '' }}" href="/pemasok">
                <i class="bi bi-truck me-2"></i>Pemasok
            </a>
            @if ($isAdmin)
                <a class="list-group-item list-group-item-action px-3 py-2 {{ $active === 'transaksi' ? 'active' : '' }}" href="/admin/transaksi">
                    <i class="bi bi-receipt me-2"></i>Transaksi
                </a>
                <a class="list-group-item list-group-item-action px-3 py-2 {{ $active === 'stok-bahan' ? 'active' : '' }}" href="/admin/stok-bahan">
                    <i class="bi bi-stack me-2"></i>Stok Bahan
                </a>
                <a class="list-group-item list-group-item-action px-3 py-2 {{ $active === 'laporan' ? 'active' : '' }}" href="/admin/laporan">
                    <i class="bi bi-bar-chart-line me-2"></i>Laporan
                </a>
            @endif
        </div>
        <div class="border-top mt-4 pt-3 small text-muted">
            @auth
                <div class="d-flex align-items-center gap-2">
                    <div class="rounded-circle bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center" style="width:32px;height:32px">
                        <i class="bi bi-person"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-semibold text-dark">{{ auth()->user()->name }}</div>
                        <div class="text-muted">{{ auth()->user()->role }}</div>
                    </div>
                </div>
                <form method="post" action="/logout" class="mt-2">
                    @csrf
                    <button class="btn btn-outline-danger btn-sm w-100">Logout</button>
                </form>
            @endauth
        </div>
    </aside>

    <div class="vc-content">
        <div class="vc-topbar px-3 pt-3">
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-outline-secondary d-lg-none" type="button" onclick="window.__vcToggleSidebar(true)">
                    <i class="bi bi-list"></i>
                </button>
                <div class="flex-grow-1">
                    <div class="vc-search input-group">
                        <span class="input-group-text"><i class="bi bi-search"></i></span>
                        <input class="form-control" placeholder="Search" aria-label="Search">
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-outline-secondary d-none d-md-inline-flex" type="button">
                        <i class="bi bi-bell"></i>
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" type="button">
                            <i class="bi bi-person-circle me-1"></i>
                            <span class="d-none d-md-inline">{{ auth()->user()->name ?? 'User' }}</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="/dashboard">Dashboard</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <form method="post" action="/logout" class="px-3 py-1">
                                    @csrf
                                    <button class="btn btn-outline-danger btn-sm w-100">Logout</button>
                                </form>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div class="vc-main">
            @yield('content')
        </div>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script>
    window.__vcToggleSidebar = function (open) {
        var sidebar = document.getElementById('vcSidebar');
        var backdrop = document.getElementById('vcBackdrop');
        if (!sidebar || !backdrop) return;
        if (open) {
            sidebar.classList.add('show');
            backdrop.classList.add('show');
        } else {
            sidebar.classList.remove('show');
            backdrop.classList.remove('show');
        }
    };
    document.getElementById('vcBackdrop')?.addEventListener('click', function () { window.__vcToggleSidebar(false); });
</script>
@yield('scripts')
</body>
</html>
