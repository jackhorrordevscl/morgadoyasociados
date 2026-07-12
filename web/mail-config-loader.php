<?php

declare(strict_types=1);

const MAIL_CONFIG_ENV_MAP = [
    'smtp_host' => 'CONTACT_SMTP_HOST',
    'smtp_port' => 'CONTACT_SMTP_PORT',
    'smtp_user' => 'CONTACT_SMTP_USER',
    'smtp_pass' => 'CONTACT_SMTP_PASS',
    'smtp_secure' => 'CONTACT_SMTP_SECURE',
    'to_email' => 'CONTACT_TO_EMAIL',
    'to_name' => 'CONTACT_TO_NAME',
];

function loadMailConfig(): ?array
{
    $config = [];
    $configPath = __DIR__ . '/mail-config.php';

    if (is_file($configPath)) {
        try {
            $loaded = require $configPath;
            if (is_array($loaded)) {
                $config = $loaded;
            }
        } catch (Throwable) {
            // Ignore a bad local file here; env vars can still supply a usable config.
        }
    }

    foreach (MAIL_CONFIG_ENV_MAP as $key => $envName) {
        $value = getenv($envName);
        if ($value === false || $value === '') {
            continue;
        }

        $config[$key] = $key === 'smtp_port' ? (int) $value : trim($value);
    }

    return $config === [] ? null : $config;
}

function hasValidMailConfig(mixed $config): bool
{
    if (!is_array($config)) {
        return false;
    }

    foreach (['smtp_host', 'smtp_user', 'smtp_pass', 'smtp_secure', 'to_email', 'to_name'] as $key) {
        if (!isset($config[$key]) || !is_string($config[$key]) || $config[$key] === '') {
            return false;
        }
    }

    return isset($config['smtp_port']) && filter_var($config['smtp_port'], FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1, 'max_range' => 65535],
    ]) !== false;
}
