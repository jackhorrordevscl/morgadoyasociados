# Edit public pages through the source layer

The nine `web/*.html` files are deployable build outputs. Do not edit them directly.

## Quick path

1. Update page SEO, route, behavior flags, or active navigation in `src/data/pages.js`.
2. Update a page's central content in its matching `src/pages/*.json` file.
3. Update shared markup only in `src/partials/` or `src/layouts/page.js`.
4. Run `npm run build` and then `npm test`.

## Guardrails

- `scripts/build-pages.js` is dependency-free and generates exactly the nine public HTML routes.
- `npm run build:css` generates pages first, so Tailwind scans current HTML and `src/` source files.
- Keep metadata, accessibility attributes, link targets, script order, and contact-form IDs intact unless the change explicitly requires otherwise.
