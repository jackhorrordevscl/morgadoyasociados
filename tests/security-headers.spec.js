const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const webRoot = path.resolve(__dirname, '..', 'web');
const expectedCsp = "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com; connect-src 'self'; frame-src https://www.openstreetmap.org; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";
const htaccess = fs.readFileSync(path.join(webRoot, '.htaccess'), 'utf8');

assert.match(htaccess, new RegExp(`Header always set Content-Security-Policy "${expectedCsp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
assert.match(htaccess, /Header always set X-Content-Type-Options "nosniff"/);
assert.match(htaccess, /Header always set Referrer-Policy "strict-origin-when-cross-origin"/);
assert.match(htaccess, /Header always set Permissions-Policy "camera=\(\), geolocation=\(\), microphone=\(\), payment=\(\), usb=\(\)"/);
assert.match(htaccess, /Header always set X-Frame-Options "SAMEORIGIN"/);
assert.match(htaccess, /<If "%\{HTTPS\} == 'on'">\s+Header always set Strict-Transport-Security "max-age=31536000"/s);

for (const filename of fs.readdirSync(webRoot).filter((file) => file.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(webRoot, filename), 'utf8');
  assert.doesNotMatch(html, /<meta http-equiv="Content-Security-Policy"/i, filename);
}

console.log('Security header configuration verified.');
