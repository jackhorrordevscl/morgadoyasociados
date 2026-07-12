<?php

declare(strict_types=1);

const HEALTH_MONITOR_URL = 'https://morgadoyasociados.cl/health.php';
const HEALTH_MONITOR_PAYLOAD = '{"status":"ok"}';
const PUBLIC_PAGE_MONITOR_URL = 'https://morgadoyasociados.cl/';
const PUBLIC_PAGE_EXPECTED_MARKER = '<body data-page="home">';
const PUBLIC_ASSET_MONITOR_URL = 'https://morgadoyasociados.cl/assets/site.css';
const HEALTH_MONITOR_TIMEOUT_SECONDS = 10;
const HEALTH_MONITOR_MAX_RESPONSE_BYTES = 4096;

function executionSapi(): string
{
    return defined('HEALTH_MONITOR_TEST_SAPI') ? HEALTH_MONITOR_TEST_SAPI : PHP_SAPI;
}

function timeoutSeconds(): int
{
    return defined('HEALTH_MONITOR_TEST_TIMEOUT_SECONDS')
        ? HEALTH_MONITOR_TEST_TIMEOUT_SECONDS
        : HEALTH_MONITOR_TIMEOUT_SECONDS;
}

function fail(string $reason): never
{
    fwrite(STDERR, "health monitor failed: {$reason}\n");
    exit(1);
}

function configuredUrl(string $environmentVariable, string $default): string
{
    $url = getenv($environmentVariable);

    return is_string($url) && $url !== '' ? $url : $default;
}

function isSupportedUrl(string $url): bool
{
    $parts = parse_url($url);

    return is_array($parts)
        && isset($parts['scheme'], $parts['host'])
        && in_array($parts['scheme'], ['http', 'https'], true)
        && $parts['host'] !== '';
}

function responseStatus(array $headers): ?int
{
    $status = null;

    foreach ($headers as $header) {
        if (preg_match('/^HTTP\/\S+\s+(\d{3})\b/', $header, $matches) === 1) {
            $status = (int) $matches[1];
        }
    }

    return $status;
}

function request(string $url, string $accept): array
{
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => timeoutSeconds(),
            'ignore_errors' => true,
            'follow_location' => 0,
            'max_redirects' => 0,
            'protocol_version' => 1.1,
            'header' => "Accept: {$accept}\r\nConnection: close\r\nUser-Agent: MorgadoHealthMonitor/1.1\r\n",
        ],
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
        ],
    ]);

    $http_response_header = [];
    $body = @file_get_contents($url, false, $context, 0, HEALTH_MONITOR_MAX_RESPONSE_BYTES);

    return [$body, responseStatus($http_response_header)];
}

function assertHttpOk(string $name, string $url, string $accept): string
{
    if (!isSupportedUrl($url)) {
        fail("invalid {$name} URL");
    }

    [$body, $status] = request($url, $accept);
    if ($body === false || $status === null) {
        fail("{$name} request unavailable");
    }
    if ($status !== 200) {
        fail("{$name} unexpected HTTP status {$status}");
    }

    return $body;
}

if (executionSapi() !== 'cli') {
    fail('CLI execution required');
}

$healthBody = assertHttpOk('health', configuredUrl('HEALTH_MONITOR_URL', HEALTH_MONITOR_URL), 'application/json');
if ($healthBody !== HEALTH_MONITOR_PAYLOAD) {
    fail('unexpected response payload');
}

$pageBody = assertHttpOk('public page', configuredUrl('PUBLIC_PAGE_MONITOR_URL', PUBLIC_PAGE_MONITOR_URL), 'text/html');
if (!str_contains($pageBody, PUBLIC_PAGE_EXPECTED_MARKER)) {
    fail('public page missing expected marker');
}

$assetBody = assertHttpOk('public asset', configuredUrl('PUBLIC_ASSET_MONITOR_URL', PUBLIC_ASSET_MONITOR_URL), 'text/css');
if ($assetBody === '') {
    fail('public asset empty response');
}
