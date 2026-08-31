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

const jsonForHtml = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

function structuredData(poem, canonical) {
  const personId = 'https://mihirbellamkonda.com/#mihir-bellamkonda';
  const work = {
    '@type': 'CreativeWork',
    '@id': `${canonical}#work`,
    url: canonical,
    name: poem.title,
    genre: 'Poetry',
    inLanguage: 'en',
    author: { '@id': personId },
    isPartOf: {
      '@type': 'CollectionPage',
      '@id': 'https://mihirbellamkonda.com/#published-poems',
      url: 'https://mihirbellamkonda.com/#index',
      name: 'Published poems by Mihir Bellamkonda'
    }
  };

  if (poem.date) work.datePublished = String(poem.date).slice(0, 10);
  if (poem.published_in) {
    work.publisher = { '@type': 'Organization', name: poem.published_in };
  }
  if (poem.audio) {
    work.associatedMedia = {
      '@type': 'AudioObject',
      contentUrl: new URL(poem.audio, 'https://mihirbellamkonda.com/').href,
      encodingFormat: path.extname(poem.audio).slice(1).toLowerCase()
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: 'Mihir Bellamkonda',
        url: 'https://mihirbellamkonda.com/',
        sameAs: [
          'https://x.com/MihirWords',
          'https://www.instagram.com/mihirwords/'
        ]
      },
      work
    ]
  };
}

function staticPoem(poem, index, total) {
  const year = String(poem.date || '').match(/\d{4}/)?.[0] || '';
  const provenance = poem.published_in
    ? `First published in ${escapeHtml(poem.published_in)}${year ? `, ${year}` : ''}`
    : year ? `Written ${year}` : '';
  const stanzas = (poem.stanzas || []).map(stanza =>
    `<p class="static-stanza">${stanza.map(line => `<span class="static-line">${line}</span>`).join('')}</p>`
  ).join('');

  return `<noscript>
    <article class="static-poem">
      <nav class="static-chrome" aria-label="Site">
        <a href="/">mihir bellamkonda</a>
        <a href="/#index">index</a>
      </nav>
      <main class="static-grid">
        <header class="static-margin">
          <p class="static-number">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</p>
          <h1>${escapeHtml(poem.title)}</h1>
          ${poem.subtitle ? `<p class="static-dedication">${escapeHtml(poem.subtitle)}</p>` : ''}
          ${provenance ? `<p class="static-provenance">${provenance}</p>` : ''}
          ${poem.audio ? `<audio class="static-audio" controls preload="metadata" src="${escapeHtml(poem.audio)}">Audio reading of ${escapeHtml(poem.title)}</audio>` : ''}
        </header>
        <div class="static-verse">${stanzas}</div>
      </main>
    </article>
  </noscript>`;
}

for (const [index, poem] of poems.entries()) {
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
  html = html.replace(
    '</head>',
    `  <script type="application/ld+json">${jsonForHtml(structuredData(poem, canonical))}</script>\n</head>`
  );
  html = html.replace(
    '<div id="app"></div>',
    `${staticPoem(poem, index, poems.length)}\n  <div id="app"></div>`
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
