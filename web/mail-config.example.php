<?php
// Copy to web/mail-config.php for local fallback, or set environment variables in deployment.
// Env vars take precedence when present:
// CONTACT_SMTP_HOST, CONTACT_SMTP_PORT, CONTACT_SMTP_USER, CONTACT_SMTP_PASS,
// CONTACT_SMTP_SECURE, CONTACT_TO_EMAIL, CONTACT_TO_NAME.
return [
    'smtp_host' => 'smtp.example.com',
    'smtp_port' => 465,
    'smtp_user' => 'your-smtp-username',
    'smtp_pass' => 'CHANGE_ME',
    'smtp_secure' => 'ssl', // 'ssl' (puerto 465) o 'tls' (puerto 587)
    'to_email' => 'recipient@example.com',
    'to_name' => 'Example Recipient',
];
