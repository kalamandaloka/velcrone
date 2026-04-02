<?php

$frontendUrl = env('FRONTEND_URL');
$frontendUrl = is_string($frontendUrl) ? trim($frontendUrl) : '';
$frontendUrl = $frontendUrl !== '' ? rtrim($frontendUrl, '/') : '';

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter([
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        $frontendUrl,
    ])),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
