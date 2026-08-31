import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const poems = JSON.parse(fs.readFileSync(path.join(root, 'src/poems.json'), 'utf8'));
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function setMeta(html, selector, value) {
  const escaped = escapeHtml(value);
  const pattern = new RegExp(`(<meta\\s+${selector}\\s+content=")[^"]*(")`, 'i');
  if (!pattern.test(html)) return html;
  return html.replace(pattern, `$1${escaped}$2`);
}

for (const poem of poems) {
  const year = String(poem.date || '').match(/\d{4}/)?.[0] || '';
  const venue = poem.published_in
    ? ` First published in ${poem.published_in}${year ? ` in ${year}` : ''}.`
    : '';
  const title = `${poem.title} — Mihir Bellamkonda`;
  const description = `“${poem.title},” a poem by Mihir Bellamkonda.${venue}`;
  const canonical = `https://mihirbellamkonda.com${poem.url}`;

  let html = template.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setMeta(html, 'name="description"', description);
  html = setMeta(html, 'property="og:type"', 'article');
  html = setMeta(html, 'property="og:title"', title);
  html = setMeta(html, 'property="og:description"', description);
  html = setMeta(html, 'property="og:url"', canonical);
  html = setMeta(html, 'name="twitter:title"', title);
  html = setMeta(html, 'name="twitter:description"', description);
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(canonical)}">`
  );

  const pageDir = path.join(dist, 'poem', poem.path);
  fs.mkdirSync(pageDir, { recursive: true });
  fs.writeFileSync(path.join(pageDir, 'index.html'), html);
}

const urls = [
  'https://mihirbellamkonda.com/',
  ...poems.map(poem => `https://mihirbellamkonda.com${poem.url}`)
];
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(url => `  <url><loc>${escapeHtml(url)}</loc></url>`),
  '</urlset>',
  ''
].join('\n');
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);

console.log(`Generated ${poems.length} shareable poem pages and sitemap.xml`);
