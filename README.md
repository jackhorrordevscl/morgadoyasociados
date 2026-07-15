# Morgado, Cía. & Asociados Web

Static MVP site for Asesoría Legal Morgado, Cía. & Asociados.

## What this repo contains

- The public site pages and shared layout for the MVP.
- A small build step that regenerates the HTML pages and the Tailwind stylesheet.
- PHP endpoints for contact-mail delivery and a health check.

## Build and regenerate

- `npm run build:pages` regenerates the public HTML from `src/` and `scripts/build-pages.js`.
- `npm run build:css` runs page generation first, then compiles `web/assets/tailwind.css` from `web/assets/tailwind.src.css`.
- `npm run build` is the same as `npm run build:css`.
- `npm run watch:css` rebuilds pages and watches Tailwind during local styling work.
- `node scripts/build-pages.js --extract-existing` bootstraps missing `src/pages/*.json` files from the current `web/*.html` output.
- `npm test` runs the build plus the site checks.
- GitHub Actions runs this gate on every push and pull request, including PHP syntax checks and generated-output drift detection.

## Source vs generated

Source of truth:

- `src/data/pages.js` and `src/data/site.js`
- `src/layouts/page.js` and `src/partials/*.js`
- `src/pages/*.json`
- `web/assets/tailwind.src.css`
- `web/assets/nav.js`, `web/assets/contact.js`, `web/assets/animations.js`
- `web/send-mail.php` and `web/health.php`

Generated or deployable outputs:

- `web/*.html`
- `web/assets/tailwind.css`
- the rest of `web/` is what gets deployed as the site tree

Do not edit generated HTML directly unless you are intentionally changing the deployed output and will regenerate it from source.

## Local contact-mail config

The contact form and health endpoint read SMTP settings from environment variables first, then fall back to `web/mail-config.php`.

- Use `web/mail-config.example.php` as the local template.
- For deployment, set `CONTACT_SMTP_HOST`, `CONTACT_SMTP_PORT`, `CONTACT_SMTP_USER`, `CONTACT_SMTP_PASS`, `CONTACT_SMTP_SECURE`, `CONTACT_TO_EMAIL`, and `CONTACT_TO_NAME`.
- If env vars are not available, create or replace `web/mail-config.php` with real local values.
- Do not commit secrets.

If neither env vars nor `web/mail-config.php` provide a valid SMTP config, the contact endpoint returns a service-unavailable response.

## Deployment notes

- Deploy the `web/` directory as the public site root.
- Keep `scripts/health-monitor.php` outside `public_html` if you use the cPanel monitor flow.
- See `docs/cpanel-health-monitor.md` for the cron job setup and alert behavior.
- After changes, run `npm run build:css` or `npm test` before publishing.
