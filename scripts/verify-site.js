import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ghost, rngFor } from '../src/asemic.js';
import { normalizeWords, specimenVocabulary } from '../src/specimen-vocabulary.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const poems = JSON.parse(fs.readFileSync(path.join(root, 'src/poems.json'), 'utf8'));
const dist = path.join(root, 'dist');
const failures = [];

const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(poems.length > 0, 'No poems were generated.');
check(fs.existsSync(path.join(dist, 'index.html')), 'The production index is missing.');

const paths = new Set();
const titles = new Set();

for (const poem of poems) {
  check(Boolean(poem.title), `${poem.slug}: missing title.`);
  check(Boolean(poem.content.trim()), `${poem.slug}: empty poem.`);
  check(!paths.has(poem.path), `${poem.slug}: duplicate public path ${poem.path}.`);
  check(!titles.has(poem.title), `${poem.slug}: duplicate title ${poem.title}.`);
  paths.add(poem.path);
  titles.add(poem.title);

  if (poem.external_url) {
    try {
      const url = new URL(poem.external_url);
      check(url.protocol === 'https:', `${poem.slug}: venue URL must use HTTPS.`);
    } catch {
      failures.push(`${poem.slug}: invalid venue URL.`);
    }
  }

  if (poem.audio) {
    check(poem.audio.startsWith('/audio/'), `${poem.slug}: audio must live beneath /audio/.`);
    check(
      fs.existsSync(path.join(root, 'public', poem.audio.replace(/^\//, ''))),
      `${poem.slug}: audio file ${poem.audio} is missing.`
    );
  }

  const sourceLines = poem.content.split('\n').filter(line => line.trim()).length;
  const renderedLines = poem.stanzas.flat().length;
  check(
    sourceLines === renderedLines,
    `${poem.slug}: generated line count ${renderedLines} differs from source count ${sourceLines}.`
  );

  const signatureOptions = { x: 0, width: 620, height: 420, size: 0, maxLines: 0 };
  const first = ghost(poem.content, { ...signatureOptions, rng: rngFor(`${poem.slug}::verify`) });
  const second = ghost(poem.content, { ...signatureOptions, rng: rngFor(`${poem.slug}::verify`) });
  check(JSON.stringify(first) === JSON.stringify(second), `${poem.slug}: signature is not deterministic.`);

  const bodyWords = new Set(normalizeWords(poem.content));
  const titleWords = new Set(normalizeWords(poem.title));
  const specimenWords = specimenVocabulary[poem.path];
  check(Boolean(specimenWords), `${poem.slug}: specimen vocabulary is missing.`);
  if (specimenWords) {
    check(specimenWords.length === 4, `${poem.slug}: specimen vocabulary must contain four words.`);
    check(new Set(specimenWords).size === specimenWords.length, `${poem.slug}: specimen vocabulary repeats a word.`);
    for (const word of specimenWords) {
      const normalized = normalizeWords(word)[0];
      check(bodyWords.has(normalized), `${poem.slug}: specimen word “${word}” is absent from the poem body.`);
      check(!titleWords.has(normalized), `${poem.slug}: specimen word “${word}” also occurs in the title.`);
    }
  }

  const pagePath = path.join(dist, 'poem', poem.path, 'index.html');
  check(fs.existsSync(pagePath), `${poem.slug}: static poem page is missing.`);
  if (!fs.existsSync(pagePath)) continue;

  const page = fs.readFileSync(pagePath, 'utf8');
  check(page.includes('<script type="application/ld+json">'), `${poem.slug}: structured data is missing.`);
  check(page.includes('https://schema.org'), `${poem.slug}: schema context is missing.`);
  check(page.includes('<noscript>'), `${poem.slug}: no-JavaScript reading copy is missing.`);
  check(page.includes('class="static-verse"'), `${poem.slug}: static verse is missing.`);
  check(page.includes(`<h1>${poem.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h1>`), `${poem.slug}: static title does not match.`);
  check(page.includes(`https://mihirbellamkonda.com${poem.url}`), `${poem.slug}: canonical URL is missing.`);
}

const sitemapPath = path.join(dist, 'sitemap.xml');
check(fs.existsSync(sitemapPath), 'Sitemap is missing.');
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  for (const poem of poems) {
    check(sitemap.includes(`https://mihirbellamkonda.com${poem.url}`), `${poem.slug}: missing from sitemap.`);
  }
}

if (failures.length) {
  console.error(`Site verification failed (${failures.length}):`);
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Verified ${poems.length} poems, specimen words, static reading copies, metadata, URLs, and signatures.`);
