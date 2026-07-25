<?php

declare(strict_types=1);

require_once __DIR__ . '/mail-config-loader.php';
require_once __DIR__ . '/rate-limiter.php';

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

/**
 * Si HEALTH_CHECK_TOKEN está definida en el entorno, exige un encabezado
 * X-Health-Token que la iguale (comparación segura ante timing attacks). Si
 * no está definida, el endpoint sigue abierto como antes.
 */
function healthTokenIsValid(): bool
{
    $expected = getenv('HEALTH_CHECK_TOKEN');
    if ($expected === false || $expected === '') {
        return true;
    }

    $provided = $_SERVER['HTTP_X_HEALTH_TOKEN'] ?? '';

    return is_string($provided) && $provided !== '' && hash_equals($expected, $provided);
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

// Un token ausente o incorrecto responde 404, no 401/403, para no confirmar
// la existencia del endpoint a quienes no lo conocen.
if (!healthTokenIsValid()) {
    http_response_code(404);
    header('Content-Length: 0');
    exit;
}

$clientIp = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rateLimitResult = checkRateLimit(
    $clientIp,
    maxRequests: 30,
    windowSeconds: 300,
    minSecondsBetween: 0,
    namespace: 'morgado-health-ratelimit',
);
if ($rateLimitResult === null || $rateLimitResult === false) {
    // No se distingue entre fallo de almacenamiento y límite alcanzado: el
    // mismo payload de "unavailable" evita dar una señal nueva a quien sondea.
    logHealthEvent('rate_limit_unavailable');
    respond(503, HEALTH_UNAVAILABLE_PAYLOAD, $method);
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
