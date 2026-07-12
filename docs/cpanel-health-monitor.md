# cPanel health-monitor cron job

Use this monitor to have cPanel send an alert when the public health endpoint is unavailable or returns an unexpected response. It does not send email itself and never reads `mail-config.php`.

## Deployment path

Upload `scripts/health-monitor.php` **outside** `public_html` (for example, to `~/scripts/health-monitor.php`). This keeps the monitor inaccessible over HTTP while cPanel can still execute it.

## cPanel setup

1. In **cPanel → Cron Jobs**, set **Cron Email** to `admin@morgadoyasociados.cl` and save it.
2. Add a new job with **Common Settings** set to **Once Per Five Minutes**.
3. Use this command, replacing `<CPANEL_HOME>` with the actual cPanel home directory and `<PHP_BINARY>` with the PHP CLI binary shown by the hosting provider:

   ```sh
   <PHP_BINARY> <CPANEL_HOME>/scripts/health-monitor.php
   ```

   Example shape only (do not copy the placeholder literally):

   ```sh
   /usr/local/bin/php <CPANEL_HOME>/scripts/health-monitor.php
   ```

## Expected behavior

| Result | Cron behavior |
|---|---|
| HTTP 200 with `{"status":"ok"}` | No output; cPanel sends no alert. |
| Timeout, connection error, non-200, or unexpected payload | A short sanitized error is written to STDERR and exits non-zero; cPanel sends the configured alert. |

The monitor deliberately **does not follow HTTP redirects**. A redirect from the health URL is an alert condition, even when its target returns a healthy payload. This prevents a proxy, rewrite, or captive portal from silently changing the endpoint being checked.

## Alert triage and recovery

### 1. Triage the alert

1. Keep the alert email: its short message identifies the failure class without exposing response content or server details.
2. From a trusted shell, check the public endpoint directly:

   ```sh
   curl --fail --silent --show-error --max-time 10 https://morgadoyasociados.cl/health.php
   ```

   The only healthy response is `{"status":"ok"}` with HTTP 200. A redirect, timeout, TLS error, non-200 response, or different body is unhealthy.
3. Check the same monitor command that cron executes. It must be silent and return `0` when healthy:

   ```sh
   <PHP_BINARY> <CPANEL_HOME>/scripts/health-monitor.php
   printf 'exit=%s\n' "$?"
   ```

### 2. Temporarily stop repeated alerts

Prefer disabling the job in **cPanel → Cron Jobs**. If HostGator Terminal/SSH is available, first back up the current crontab and then comment only the monitor entry:

```sh
crontab -l > "$HOME/crontab.before-health-monitor-disable"
crontab -l | sed '/health-monitor\.php/ s/^/# DISABLED /' | crontab -
```

Confirm that it is disabled before proceeding:

```sh
crontab -l | grep 'health-monitor\.php'
```

### 3. Fix forward

1. If the public check fails, restore the site/hosting configuration that makes `/health.php` return exactly HTTP 200 and `{"status":"ok"}`. Do not redirect this URL.
2. If the public check passes but the monitor fails, verify that the deployed script is outside `public_html`, that `<PHP_BINARY>` is the CLI binary, and that the cPanel account can make outbound HTTPS requests.
3. If the failure began after a deployment, roll forward with the corrected site files or restore the last known-good deployment. Do not add SMTP credentials or email-sending code to the monitor.

### 4. Revalidate and reactivate

Before re-enabling cron, run all three checks:

```sh
<PHP_BINARY> -l <CPANEL_HOME>/scripts/health-monitor.php
curl --fail --silent --show-error --max-time 10 https://morgadoyasociados.cl/health.php
<PHP_BINARY> <CPANEL_HOME>/scripts/health-monitor.php; printf 'exit=%s\n' "$?"
```

Expected result: lint succeeds, curl prints `{"status":"ok"}`, and the monitor prints only `exit=0`. Then re-enable the job in cPanel. For a job disabled with the shell command above:

```sh
crontab -l | sed '/# DISABLED .*health-monitor\.php/ s/^# DISABLED //' | crontab -
```

## Local verification

```sh
npm test
php -l scripts/health-monitor.php
```

The automated monitor test uses a local HTTP fixture through `HEALTH_MONITOR_URL`; normal cron execution uses the fixed HTTPS endpoint `https://morgadoyasociados.cl/health.php`.
