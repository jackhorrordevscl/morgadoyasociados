const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const webRoot = path.resolve(__dirname, '..', 'web');
const expectedCsp = "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com; connect-src 'self'; frame-src https://www.openstreetmap.org; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";
const htaccess = fs.readFileSync(path.join(webRoot, '.htaccess'), 'utf8');
const canonicalHostRedirect = [
  'RewriteCond %{HTTP_HOST} ^www\\.morgadoyasociados\\.cl$ [NC]',
  'RewriteRule ^ https://morgadoyasociados.cl%{REQUEST_URI} [R=301,L,NE]',
].join('\n');

assert.ok(htaccess.includes(canonicalHostRedirect));
assert.match(canonicalHostRedirect, /\[R=301,L(?:,|\])/);
assert.ok(
  htaccess.indexOf(canonicalHostRedirect) < htaccess.indexOf('RewriteCond %{HTTPS} off'),
  'The canonical-host redirect must precede the HTTPS redirect.',
);

assert.match(htaccess, new RegExp(`Header always set Content-Security-Policy "${expectedCsp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
assert.match(htaccess, /Header always set X-Content-Type-Options "nosniff"/);
assert.match(htaccess, /Header always set Referrer-Policy "strict-origin-when-cross-origin"/);
assert.match(htaccess, /Header always set Permissions-Policy "camera=\(\), geolocation=\(\), microphone=\(\), payment=\(\), usb=\(\)"/);
assert.match(htaccess, /Header always set X-Frame-Options "SAMEORIGIN"/);
assert.match(htaccess, /<If "%\{HTTPS\} == 'on'">\s+Header always set Strict-Transport-Security "max-age=31536000"/s);
assert.match(htaccess, /<IfModule mod_filter\.c>[\s\S]*?<IfModule mod_brotli\.c>\s+AddOutputFilterByType BROTLI_COMPRESS text\/html text\/css application\/javascript text\/javascript image\/svg\+xml application\/xml text\/xml application\/json/s);
assert.match(htaccess, /<IfModule mod_filter\.c>[\s\S]*?<IfModule mod_deflate\.c>\s+AddOutputFilterByType DEFLATE text\/html text\/css application\/javascript text\/javascript image\/svg\+xml application\/xml text\/xml application\/json/s);
assert.match(htaccess, /<FilesMatch "\\\.\(css\|js\|svg\)\$">\s+<IfModule mod_headers\.c>\s+Header set Cache-Control "max-age=3600, must-revalidate"/s);
assert.doesNotMatch(htaccess, /Header always set Cache-Control/);
assert.doesNotMatch(htaccess, /Cache-Control "[^"]*immutable/);

for (const filename of fs.readdirSync(webRoot).filter((file) => file.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(webRoot, filename), 'utf8');
  assert.doesNotMatch(html, /<meta http-equiv="Content-Security-Policy"/i, filename);
}

console.log('Security header configuration verified.');
