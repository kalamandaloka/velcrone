<?php

use Illuminate\Support\Facades\Route;

if (env('SERVE_FRONTEND', false)) {
    Route::get('/', function () {
        $indexPath = public_path('index.html');
        if (! file_exists($indexPath)) abort(404);
        return response()->file($indexPath);
    });

    Route::get('{path}', function () {
        $indexPath = public_path('index.html');
        if (! file_exists($indexPath)) abort(404);
        return response()->file($indexPath);
    })->where('path', '^(?!api).*$');
}
