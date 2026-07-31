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

// Placeholder values from mail-config.example.php. An operator who copies
// that file to mail-config.php and forgets to edit it would otherwise pass
// hasValidMailConfig() (the values have the right shape) and only find out
// when send-mail.php fails to connect to smtp.example.com at request time,
// with health.php reporting "ok" the whole time.
const MAIL_CONFIG_PLACEHOLDER_VALUES = [
    'smtp_host' => 'smtp.example.com',
    'smtp_user' => 'your-smtp-username',
    'smtp_pass' => 'CHANGE_ME',
    'to_email' => 'recipient@example.com',
    'to_name' => 'Example Recipient',
];

function hasValidMailConfig(mixed $config): bool
{
    if (!is_array($config)) {
        return false;
    }

    foreach (['smtp_host', 'smtp_user', 'smtp_pass', 'smtp_secure', 'to_email', 'to_name'] as $key) {
        if (!isset($config[$key]) || !is_string($config[$key]) || $config[$key] === '') {
            return false;
        }

        if (isset(MAIL_CONFIG_PLACEHOLDER_VALUES[$key]) && $config[$key] === MAIL_CONFIG_PLACEHOLDER_VALUES[$key]) {
            return false;
        }
    }

    return isset($config['smtp_port']) && filter_var($config['smtp_port'], FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1, 'max_range' => 65535],
    ]) !== false;
}
