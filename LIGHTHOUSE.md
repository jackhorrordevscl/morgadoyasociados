# Lighthouse CI thresholds

`lighthouserc.json` extends `lighthouse:recommended` and overrides the
category score assertions:

- `performance`: `>= 0.85`
- `accessibility`, `best-practices`, `seo`: `>= 0.9`

Performance uses a lower bar than the other categories because the site
loads Google Fonts and the jsDelivr-hosted GSAP bundle, both third-party
origins outside this repo's control. Those requests can add to TBT/LCP
independently of any regression in our own code, so a strict performance
threshold would produce false-positive CI failures unrelated to changes we
made. Accessibility, best-practices, and SEO are fully within our control
(markup, headers, meta tags), so they stay close to a perfect score.

Reports are written to `./.lighthouseci` (`upload.target: "filesystem"`)
instead of the public temporary-storage target, since this is a law firm's
site and we don't want to generate publicly accessible report URLs.
