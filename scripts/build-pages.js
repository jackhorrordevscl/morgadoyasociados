#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { pages } = require('../src/data/pages');
const pageLayout = require('../src/layouts/page');

const root = path.resolve(__dirname, '..');
const webRoot = path.join(root, 'web');
const sourceRoot = path.join(root, 'src', 'pages');
const extract = process.argv.includes('--extract-existing');

function between(html, start, end, filename) {
  const from = html.indexOf(start);
  const to = html.indexOf(end, from + start.length);
  if (from < 0 || to < 0) throw new Error(`Cannot extract ${filename}: missing ${start} or ${end}`);
  return html.slice(from + start.length, to);
}

function extractExistingPage(page) {
  const output = path.join(webRoot, page.filename);
  const html = fs.readFileSync(output, 'utf8');
  const bodyMatch = html.match(/<body\b[^>]*>/i);
  const headerStart = html.search(/<header\b/i);
  const headerEnd = html.search(/<\/header>/i);
  const footerStart = html.search(/<footer\b/i);
  const footerEnd = html.search(/<\/footer>/i);
  const scriptsStart = html.toLowerCase().indexOf('<script', footerEnd);
  if (!bodyMatch || [headerStart, headerEnd, footerStart, footerEnd, scriptsStart].some((index) => index < 0)) {
    throw new Error(`Cannot extract ${page.filename}: expected body, header, footer, and scripts.`);
  }
  const bodyEnd = bodyMatch.index + bodyMatch[0].length;
  return {
    shellOpenBeforeHeader: html.slice(bodyEnd, headerStart),
    pageContentBetweenShell: html.slice(headerEnd + '</header>'.length, footerStart),
    shellCloseAfterFooter: html.slice(footerEnd + '</footer>'.length, scriptsStart),
  };
}

function writeSources() {
  fs.mkdirSync(sourceRoot, { recursive: true });
  for (const page of pages) {
    const source = path.join(sourceRoot, `${page.slug}.json`);
    if (fs.existsSync(source)) continue;
    fs.writeFileSync(source, `${JSON.stringify(extractExistingPage(page), null, 2)}\n`);
    console.log(`Extracted source for ${page.filename}`);
  }
}

if (extract) writeSources();

for (const page of pages) {
  const source = path.join(sourceRoot, `${page.slug}.json`);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing ${path.relative(root, source)}. Run: node scripts/build-pages.js --extract-existing`);
  }
  const fragment = JSON.parse(fs.readFileSync(source, 'utf8'));
  for (const field of ['shellOpenBeforeHeader', 'pageContentBetweenShell', 'shellCloseAfterFooter']) {
    if (typeof fragment[field] !== 'string') throw new Error(`Invalid ${path.relative(root, source)}: missing ${field}`);
  }
  fs.writeFileSync(path.join(webRoot, page.filename), pageLayout(page, fragment));
  console.log(`Built ${page.filename}`);
}
