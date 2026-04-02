<?php

$frontendUrl = env('FRONTEND_URL');
$frontendUrl = is_string($frontendUrl) ? trim($frontendUrl) : '';
$frontendUrl = $frontendUrl !== '' ? rtrim($frontendUrl, '/') : '';
$frontendUrlWww = '';
if ($frontendUrl !== '') {
    $parsed = parse_url($frontendUrl);
    if (is_array($parsed) && isset($parsed['host']) && is_string($parsed['host']) && $parsed['host'] !== '') {
        $host = $parsed['host'];
        $scheme = isset($parsed['scheme']) && is_string($parsed['scheme']) && $parsed['scheme'] !== '' ? $parsed['scheme'] : 'https';
        if (str_starts_with($host, 'www.')) {
            $frontendUrlWww = $scheme . '://' . substr($host, 4);
        } else {
            $frontendUrlWww = $scheme . '://www.' . $host;
        }
    }
}

$appEnv = env('APP_ENV', 'production');
$allowAnyOrigin = $appEnv !== 'production';

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowAnyOrigin
        ? ['*']
        : array_values(array_filter([
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
            $frontendUrl,
            $frontendUrlWww,
        ])),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
