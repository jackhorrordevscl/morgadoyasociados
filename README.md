# Morgado, Cía. & Asociados — Sitio Web Corporativo

**Sitio de producción para un estudio jurídico chileno**, construido como un generador de sitio estático a medida (sin framework de terceros) sobre Node.js, con endpoints PHP livianos para el formulario de contacto y monitoreo de salud. Vive en producción en [morgadoyasociados.cl](https://morgadoyasociados.cl), desplegado en hosting compartido (cPanel), un entorno con restricciones reales: sin acceso a un runtime Node en el servidor, sin SSH persistente para procesos largos, y con el build final debiendo llegar como HTML/CSS estático + un puñado de scripts PHP.

Este repo es también una demostración de cómo llevar un proyecto "simple" (un sitio institucional) al nivel de ingeniería de un producto de software real: pipeline de build reproducible, batería de tests de contrato, CI que verifica que lo generado coincide con lo commiteado, guardrails de pre-commit, hardening de seguridad iterativo, y SEO/accesibilidad tratados como requisitos verificables, no como checkboxes.

## Por qué este proyecto es interesante para portafolio

No es "otro sitio de WordPress". Las decisiones de arquitectura acá resuelven problemas concretos:

- **Un generador de sitio estático propio** (`scripts/build-pages.js`), en vez de un SSG de terceros, porque el volumen de páginas (17) y la necesidad de control total sobre el HTML de salida no justificaban la complejidad de Next.js/Astro/Eleventy para este caso — pero sí se construyó la disciplina de *source vs. generated* que esos frameworks dan gratis.
- **Un guardrail de pre-commit (Husky) que regenera el sitio y compara byte a byte contra lo que se va a commitear**, para que sea estructuralmente imposible editar `web/*.html` a mano sin que el propio commit lo detecte y lo bloquee — nace de un incidente real donde una edición manual casi se pierde en el siguiente build.
- **Formulario de contacto con rate-limiting real** (no solo un `setTimeout` del lado del cliente): un contador por IP con `flock()` a nivel de archivo, probado con un servidor SMTP mock que completa el handshake real (no solo abre un socket), y un test que dispara el límite y verifica el 429.
- **Un endpoint de salud (`health.php`) token-gateado y rate-limitado**, con un monitor cron desacoplado (`scripts/health-monitor.php`) que corre fuera de `public_html` y hace whitelisting de URLs para evitar SSRF — endurecido en varias iteraciones reales de seguridad (ver sección de hardening abajo).
- **SEO tratado como contrato verificable**: JSON-LD (`Service`/`LegalService`) generado por página, sitemap con `<lastmod>` derivado de `git log`, y un test que hace un `fetch()` real a la imagen social en vez de solo verificar el string en el HTML.
- **Una investigación de causa raíz documentada en el propio historial de PRs** sobre por qué el `<lastmod>` del sitemap fallaba en CI pero no en local (el checkout de `pull_request` en GitHub Actions usa un merge commit sintético fechado "ahora") — el tipo de bug sutil que separa "funciona en mi máquina" de entender realmente cómo corre tu pipeline.

## Stack técnico

| Capa | Tecnología |
|---|---|
| Generación de sitio | Node.js (script propio, sin SSG de terceros) |
| Estilos | Tailwind CSS v4 (CLI, sin build tool adicional tipo PostCSS/Vite) |
| Animaciones | GSAP + ScrollTrigger (versión exacta pineada, con SRI) |
| Backend de contacto | PHP + PHPMailer (SMTP), vendored manualmente |
| Monitoreo | PHP standalone (`health.php`) + cron job cPanel (`health-monitor.php`) |
| Testing | Node `assert` nativo (sin runner externo) + Playwright para navegación responsive |
| CI/CD | GitHub Actions (lint PHP, suite de tests, verificación de drift del build) |
| Git hooks | Husky (pre-commit regenera y verifica el sitio) |
| Hosting | cPanel (hosting compartido, sin proceso Node persistente) |

## Arquitectura: fuente vs. generado

El principio central del repo es que **nada en `web/*.html` se edita a mano**. Todo nace en `src/` y se compila:

```
src/
├── data/
│   ├── site.js        # datos globales del sitio (marca, dirección, JSON-LD base)
│   └── pages.js        # manifiesto de las 17 páginas (slug, título, robots, sitemap, ...)
├── layouts/
│   └── page.js         # shell HTML compartido (head, header, footer, scripts)
├── partials/
│   ├── head.js, header.js, footer.js, brand.js, icon.js, cta.js, scripts.js
│   └── practice-area.js   # bloque breadcrumb+hero compartido por las 9 páginas de práctica legal
└── pages/
    └── *.json          # fragmento de contenido específico de cada página
        ↓
scripts/build-pages.js   # ensambla layout + partials + fragmento → HTML final
        ↓
web/*.html               # salida deployable (NO editar directamente)
web/sitemap.xml          # generado con <lastmod> por página desde git log
```

`npm run build:pages` es la única fuente de verdad para regenerar `web/`. El hook de pre-commit corre este mismo comando y aborta el commit si detecta que el HTML resultante difiere de lo que se está por commitear — la garantía estructural de que `src/` y `web/` nunca divergen.

## Funcionalidades destacadas

### Páginas y contenido
- 17 páginas: home, about, servicios, resultados, blog, contacto, legal/ética, y **9 páginas de área de práctica legal** (familia, penal, civil, laboral, educacional, inmobiliario, administrativo, aeronáutico, Decreto Ley 2.695).
- Navegación responsive con menú móvil (verificado con Playwright, no solo CSS media queries asumidas).
- Bloque de introducción (breadcrumb + hero) extraído a un partial reutilizable y parametrizado por datos — sin forzar un template genérico sobre secciones que legítimamente difieren entre páginas.

### Formulario de contacto (`web/send-mail.php`)
- Envío vía SMTP (PHPMailer), configuración por variables de entorno con fallback a archivo local.
- Rate limiting real por IP (`web/rate-limiter.php`), con ventana de tiempo y umbral de conteo, testeado con un mock SMTP que completa el protocolo real y verifica tanto el camino feliz (200) como el 429 al agotar el límite.

### Monitoreo de salud
- `web/health.php`: endpoint token-gateado y rate-limitado, pensado para no exponer información sensible a quien no tenga el token.
- `scripts/health-monitor.php`: corre vía cron **fuera** de `public_html`, hace whitelisting explícito de hosts permitidos (mitigación SSRF) y alerta cuando el sitio público no responde como se espera.

### SEO
- JSON-LD `Service`/`LegalService` por página de práctica, más `Organization`/`LocalBusiness` a nivel de sitio.
- Sitemap con `<lastmod>` por URL, derivado de la fecha del último commit de cada página fuente (con guardas contra clones shallow y contra el "merge commit sintético" de CI, ver historial de PRs).
- Meta descriptions acotadas a ≤160 caracteres para evitar truncamiento en resultados de búsqueda.
- Verificación de accesibilidad real de la imagen social (fetch, no solo regex sobre el HTML).

### Accesibilidad
- Contraste de texto del footer llevado a nivel AA.
- Landmarks de navegación (`nav`, `aria-label`) agregados donde faltaban.

### Seguridad (hardening iterativo, documentado en el historial de PRs)
- Rate-limit + token-gate en `health.php`.
- Whitelist de hosts permitidos en el monitor de salud (mitigación SSRF).
- GSAP pineado a versión exacta con hash de integridad (SRI), en vez de un rango flotante.
- Headers de seguridad verificados por test dedicado (`tests/security-headers.spec.js`).

## Testing

Sin runner externo: cada spec es un script Node que usa `assert` nativo y termina con código de salida distinto de cero si falla — simple, rápido, sin dependencias de framework de testing.

| Script | Qué verifica |
|---|---|
| `npm run test:pages` | Estructura y metadata de cada página generada |
| `npm run test:responsive` | Navegación móvil real, vía Playwright/Chromium |
| `npm run test:links` | Integridad de los enlaces entre páginas de servicio |
| `npm run test:mail` | Contrato del endpoint de contacto: éxito SMTP end-to-end, errores de infraestructura, y agotamiento del rate-limit |
| `npm run test:health` | Contrato del endpoint de salud |
| `npm run test:health-monitor` | Contrato del monitor de salud cron |
| `npm run test:seo` | JSON-LD, sitemap, meta tags, accesibilidad real de la imagen social |
| `npm run test:security` | Headers de seguridad HTTP |
| `npm test` | Suite completa (lo que corre CI) |

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) corre en cada push y pull request:

1. Instala dependencias y el navegador de Playwright.
2. Corre la suite completa de tests.
3. Lint de sintaxis de todos los archivos PHP.
4. **Verifica que `npm run build:pages` no produzca ningún diff contra `web/`** — la misma garantía que el hook de pre-commit, pero como red de seguridad post-push (excluyendo el `<lastmod>` del sitemap, que por diseño puede variar entre checkouts distintos del mismo commit).

## Scripts disponibles

```bash
npm run build:pages     # regenera web/*.html y sitemap.xml desde src/
npm run build:css       # build:pages + compila Tailwind (web/assets/tailwind.css)
npm run build           # alias de build:css
npm run watch:css       # build:pages + watch de Tailwind para trabajo de estilos local
npm test                # build:css + toda la suite de tests
node scripts/build-pages.js --extract-existing   # bootstrap de src/pages/*.json faltantes desde el HTML actual
```

## Configuración local de correo

El formulario de contacto y el endpoint de salud leen la configuración SMTP primero de variables de entorno, con fallback a `web/mail-config.php`:

- Usar `web/mail-config.example.php` como plantilla local.
- En producción: `CONTACT_SMTP_HOST`, `CONTACT_SMTP_PORT`, `CONTACT_SMTP_USER`, `CONTACT_SMTP_PASS`, `CONTACT_SMTP_SECURE`, `CONTACT_TO_EMAIL`, `CONTACT_TO_NAME`.
- Si no hay variables de entorno, crear/reemplazar `web/mail-config.php` con valores reales locales.
- Nunca commitear secretos.

Si ni las variables de entorno ni `web/mail-config.php` proveen una configuración SMTP válida, el endpoint de contacto responde con un error de servicio no disponible en vez de fallar de forma opaca.

## Despliegue

- Se despliega el directorio `web/` como raíz pública del sitio.
- `scripts/health-monitor.php` debe vivir **fuera** de `public_html` en el flujo de monitoreo cPanel — ver `docs/cpanel-health-monitor.md` para la configuración del cron job y el comportamiento de alertas.
- Antes de publicar, correr `npm run build:css` o `npm test`.

## Documentación adicional

- `docs/page-authoring.md` — cómo editar contenido de página a través de la capa fuente (`src/`), nunca `web/*.html` directamente.
- `docs/contact-rate-limit.md` — diseño del rate-limiter del formulario de contacto.
- `docs/cpanel-health-monitor.md` — configuración del cron job de monitoreo y su comportamiento de alertas.
- `docs/phpmailer-maintenance.md` — proceso de actualización de la copia vendored de PHPMailer (sin Composer, sin escaneo automático de CVEs).
