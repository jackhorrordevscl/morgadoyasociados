# PHPMailer version and update process

`web/lib/PHPMailer/` is a manually vendored copy of PHPMailer, not managed
by Composer. There is no lockfile and no automated dependency scanning for
it, so a known CVE in this library will not surface through Dependabot or
`npm audit` — it has to be checked manually.

## Current vendored version

`6.9.1` (see the `VERSION` constant in `web/lib/PHPMailer/PHPMailer.php:760`).

## How to check for advisories

1. Check the vendored version against the [PHPMailer security advisories](https://github.com/PHPMailer/PHPMailer/security/advisories).
2. Check the [PHPMailer changelog](https://github.com/PHPMailer/PHPMailer/blob/master/changelog.md) for fixes released after `6.9.1`.

## How to update

1. Download the matching release tag's `src/` files (`PHPMailer.php`, `SMTP.php`, `Exception.php`) from the PHPMailer repository.
2. Replace the three files under `web/lib/PHPMailer/` — do not change the directory layout, since `send-mail.php` requires them directly.
3. Update the version noted above in this file.
4. Run `npm test` (covers `tests/send-mail.spec.js`) and the CI PHP syntax check before deploying.

Migrating this dependency to Composer (`vendor/`) is a separate, larger
change: it would touch the `require` paths in `send-mail.php`/`health.php`,
the CI PHP-syntax-check path exclusion, `.gitignore`, and the cPanel
deployment process (which would need `vendor/` present). Out of scope here.
