<?php

return [
    'paths' => [
        'api/*', 'audit/*', 'sanctum/csrf-cookie', 'login', 'logout', 'register', 'maintenance/schedule',
        'my-messages'
    ],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:3000', 'https://treasuretracks.org'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];


