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
  if (!pattern.test(html)) {
    throw new Error(`Missing metadata template tag: ${selector}`);
  }
  return html.replace(pattern, `$1${escaped}$2`);
}

const jsonForHtml = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

function setStructuredData(html, value) {
  const pattern = /(<script\s+id="structured-data"\s+type="application\/ld\+json">)[\s\S]*?(<\/script>)/i;
  if (!pattern.test(html)) throw new Error('Missing structured-data template script.');
  return html.replace(pattern, `$1${jsonForHtml(value)}$2`);
}

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

function staticHome(poems) {
  const rows = poems.map((poem, index) => {
    const year = String(poem.date || '').match(/\d{4}/)?.[0] || '';
    const venue = poem.published_in || (poem.unpublished ? 'unpublished' : '');
    return `<li>
      <span class="static-home-number">${String(index + 1).padStart(2, '0')}</span>
      <a href="${escapeHtml(poem.url)}">${escapeHtml(poem.title)}</a>
      <span class="static-home-venue">${escapeHtml([venue, year].filter(Boolean).join(', '))}</span>
    </li>`;
  }).join('');

  return `<noscript>
    <div class="static-home">
      <nav class="static-chrome" aria-label="Site">
        <span>mihirbellamkonda.com</span>
        <a href="#static-index">index</a>
      </nav>
      <main id="main">
        <section class="static-home-about">
          <h1>Mihir Bellamkonda</h1>
          <p>Mihir Bellamkonda is a poet based in Brooklyn. They were a finalist for Black Lawrence Press's St. Lawrence Book Award, and their work appears in Oxford Poetry, Nashville Review, The Offing, Variant Literature, and elsewhere.</p>
          <p>They can be found on <a href="https://x.com/MihirWords">X</a> and <a href="https://www.instagram.com/mihirwords/">Instagram</a> as @MihirWords, or reached by <a href="mailto:mihir.bellamkonda@gmail.com">email</a>. They are honored to be read.</p>
          <p class="static-home-enter"><a href="#static-index">read →</a></p>
        </section>
        <section class="static-home-index" id="static-index">
          <h2>Poems</h2>
          <ol>${rows}</ol>
        </section>
      </main>
    </div>
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
  const socialImage = `https://mihirbellamkonda.com/social/poems/${poem.path}.jpg`;
  const socialAlt = `Share card for “${poem.title},” a poem by Mihir Bellamkonda.`;

  let html = template.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setStructuredData(html, structuredData(poem, canonical));
  html = setMeta(html, 'name="description"', description);
  html = setMeta(html, 'property="og:type"', 'article');
  html = setMeta(html, 'property="og:title"', title);
  html = setMeta(html, 'property="og:description"', description);
  html = setMeta(html, 'property="og:url"', canonical);
  html = setMeta(html, 'property="og:image"', socialImage);
  html = setMeta(html, 'property="og:image:secure_url"', socialImage);
  html = setMeta(html, 'property="og:image:type"', 'image/jpeg');
  html = setMeta(html, 'property="og:image:width"', '1200');
  html = setMeta(html, 'property="og:image:height"', '630');
  html = setMeta(html, 'property="og:image:alt"', socialAlt);
  html = setMeta(html, 'name="twitter:title"', title);
  html = setMeta(html, 'name="twitter:description"', description);
  html = setMeta(html, 'name="twitter:image"', socialImage);
  html = setMeta(html, 'name="twitter:image:alt"', socialAlt);
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(canonical)}">`
  );
  html = html.replace(
    '<div id="app"></div>',
    `${staticPoem(poem, index, poems.length)}\n  <div id="app"></div>`
  );

  const pageDir = path.join(dist, 'poem', poem.path);
  fs.mkdirSync(pageDir, { recursive: true });
  fs.writeFileSync(path.join(pageDir, 'index.html'), html);
}

const home = template.replace('<div id="app"></div>', `${staticHome(poems)}\n  <div id="app"></div>`);
fs.writeFileSync(path.join(dist, 'index.html'), home);

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
