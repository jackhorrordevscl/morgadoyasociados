<?php

declare(strict_types=1);

require_once __DIR__ . '/mail-config-loader.php';

const HEALTH_PAYLOAD = '{"status":"ok"}';
const HEALTH_UNAVAILABLE_PAYLOAD = '{"status":"unavailable"}';

header_remove('X-Powered-By');
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('Allow: GET, HEAD');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && $method !== 'HEAD') {
    http_response_code(405);
    exit;
}

function logHealthEvent(string $event): void
{
    error_log('contact_health event=' . $event);
}

function requiredExtensionsAvailable(): bool
{
    foreach (['mbstring', 'openssl'] as $extension) {
        if (!extension_loaded($extension)) {
            logHealthEvent('dependency_unavailable');
            return false;
        }
    }

    return true;
}

function respond(int $status, string $payload, string $method): void
{
    http_response_code($status);
    header('Content-Length: ' . strlen($payload));
    if ($method === 'GET') {
        echo $payload;
    }
    exit;
}

if (!requiredExtensionsAvailable()) {
    respond(503, HEALTH_UNAVAILABLE_PAYLOAD, $method);
}

$config = loadMailConfig();

if (!hasValidMailConfig($config)) {
    logHealthEvent('configuration_unavailable');
    respond(503, HEALTH_UNAVAILABLE_PAYLOAD, $method);
}

respond(200, HEALTH_PAYLOAD, $method);
