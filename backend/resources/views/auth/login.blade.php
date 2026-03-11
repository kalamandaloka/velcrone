@php($appName = config('app.name', 'VALCRONE'))
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login - {{ $appName }}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        body { background: #d9d9d9; min-height: 100vh; }
        .vc-login-wrap { min-height: 100vh; display: grid; place-items: center; padding: 32px 16px; }
        .vc-login-card {
            width: 100%;
            max-width: 520px;
            background: #fff;
            border-radius: 18px;
            box-shadow: 0 10px 30px rgba(0,0,0,.08);
            position: relative;
            padding: 76px 28px 26px;
        }
        .vc-login-logo {
            position: absolute;
            top: -44px;
            left: 50%;
            transform: translateX(-50%);
            width: 88px;
            height: 88px;
            border-radius: 999px;
            background: #fff;
            border: 3px solid #dc3545;
            box-shadow: 0 10px 20px rgba(0,0,0,.12);
            display: grid;
            place-items: center;
            overflow: hidden;
        }
        .vc-login-logo img { width: 62px; height: 62px; object-fit: cover; border-radius: 12px; background: transparent; padding: 0; }
        .vc-input {
            background: #f1f1f1;
            border: 0;
            border-radius: 12px;
            padding: 14px 14px;
        }
        .vc-input:focus { box-shadow: 0 0 0 .2rem rgba(220,53,69,.15); background: #f1f1f1; }
        .vc-input-group .input-group-text {
            background: #f1f1f1;
            border: 0;
            border-radius: 12px;
            color: rgba(0,0,0,.45);
            padding-left: 14px;
            padding-right: 14px;
        }
        .vc-input-group .form-control { border-top-right-radius: 0; border-bottom-right-radius: 0; }
        .vc-input-group .input-group-text { border-top-left-radius: 0; border-bottom-left-radius: 0; }
        .vc-btn {
            border-radius: 12px;
            padding: 14px 14px;
            font-weight: 700;
            letter-spacing: .4px;
        }
    </style>
</head>
<body>
<div class="vc-login-wrap">
    <div class="vc-login-card">
        <div class="vc-login-logo" aria-hidden="true">
            <img src="{{ asset('logo-valcrone.jpg') }}" alt="{{ $appName }}">
        </div>

        @if ($errors->any())
            <div class="alert alert-danger py-2">
                <ul class="mb-0 ps-3">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif
        @if (session('db_error'))
            <div class="alert alert-warning py-2">
                <div class="fw-semibold">Database tidak tersedia</div>
                <div class="small text-muted">{{ session('db_error') }}</div>
            </div>
        @endif

        <form method="post" action="/login" class="vstack gap-3">
            @csrf

            <div class="input-group vc-input-group">
                <input required type="email" name="email" value="{{ old('email') }}" class="form-control vc-input" placeholder="User ID" autocomplete="username" aria-label="User ID">
                <span class="input-group-text"><i class="bi bi-person"></i></span>
            </div>

            <div class="input-group vc-input-group">
                <input required type="password" name="password" class="form-control vc-input" placeholder="Password" autocomplete="current-password" aria-label="Password">
                <span class="input-group-text"><i class="bi bi-lock"></i></span>
            </div>

            <div class="d-grid">
                <button class="btn btn-danger vc-btn" type="submit">LOGIN</button>
            </div>

            <div class="text-center text-muted">
                <a class="text-decoration-none" href="#">Forgot <span class="text-danger fw-semibold">Password</span> ?</a>
            </div>
        </form>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
