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

function metaContent(html, attribute, value) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attributes = {};
    for (const match of tag.matchAll(/\b([:\w-]+)\s*=\s*(["'])(.*?)\2/g)) {
      attributes[match[1].toLowerCase()] = match[3];
    }
    if (attributes[attribute] === value) return attributes.content || '';
  }
  return '';
}

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf
  ]);
  let dimensions = null;
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd9) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= buffer.length) return null;

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) return null;
    if (startOfFrameMarkers.has(marker) && segmentLength >= 7) {
      dimensions = {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5)
      };
    }
    if (marker === 0xda) return dimensions;
    offset += segmentLength;
  }

  return null;
}

function verifySocialPreview() {
  const indexPath = path.join(dist, 'index.html');
  if (!fs.existsSync(indexPath)) return;

  const html = fs.readFileSync(indexPath, 'utf8');
  const ogImage = metaContent(html, 'property', 'og:image');
  const secureImage = metaContent(html, 'property', 'og:image:secure_url');
  const twitterImage = metaContent(html, 'name', 'twitter:image');
  const imageType = metaContent(html, 'property', 'og:image:type');
  const imageWidth = Number(metaContent(html, 'property', 'og:image:width'));
  const imageHeight = Number(metaContent(html, 'property', 'og:image:height'));
  const imageAlt = metaContent(html, 'property', 'og:image:alt');
  const twitterAlt = metaContent(html, 'name', 'twitter:image:alt');

  check(Boolean(ogImage), 'Open Graph preview image is missing.');
  check(secureImage === ogImage, 'Open Graph secure preview URL does not match og:image.');
  check(twitterImage === ogImage, 'Twitter and Open Graph preview URLs do not match.');
  check(imageType === 'image/jpeg', 'Preview image must declare image/jpeg.');
  check(Boolean(imageAlt), 'Open Graph preview alt text is missing.');
  check(twitterAlt === imageAlt, 'Twitter and Open Graph preview alt text do not match.');
  if (!ogImage) return;

  let imageUrl;
  try {
    imageUrl = new URL(ogImage);
    check(imageUrl.protocol === 'https:', 'Preview image URL must use HTTPS.');
    check(imageUrl.hostname === 'mihirbellamkonda.com', 'Preview image URL must use the canonical hostname.');
  } catch {
    failures.push('Preview image URL is invalid.');
    return;
  }

  const publicRoot = path.resolve(root, 'public');
  let imagePath;
  try {
    imagePath = path.resolve(publicRoot, `.${decodeURIComponent(imageUrl.pathname)}`);
  } catch {
    failures.push('Preview image path contains invalid URL encoding.');
    return;
  }
  check(imagePath.startsWith(`${publicRoot}${path.sep}`), 'Preview image resolves outside public/.');
  check(fs.existsSync(imagePath), `Preview image ${imageUrl.pathname} is missing.`);
  if (!imagePath.startsWith(`${publicRoot}${path.sep}`) || !fs.existsSync(imagePath)) return;

  const image = fs.readFileSync(imagePath);
  const hasEndMarker = image.length >= 2
    && image[image.length - 2] === 0xff
    && image[image.length - 1] === 0xd9;
  const dimensions = jpegDimensions(image);

  check(image.length <= 500 * 1024, `Preview image is ${image.length} bytes; keep it below 500 KB.`);
  check(hasEndMarker, 'Preview JPEG is truncated or missing its end marker.');
  check(Boolean(dimensions), 'Preview image is not a readable JPEG.');
  if (!dimensions) return;

  check(dimensions.width >= 1200 && dimensions.height >= 630, 'Preview image dimensions are too small.');
  check(imageWidth === dimensions.width, 'Declared preview width does not match the image.');
  check(imageHeight === dimensions.height, 'Declared preview height does not match the image.');
}

function verifyPoemSocialPreview(poem, page) {
  const expectedUrl = `https://mihirbellamkonda.com/social/poems/${poem.path}.jpg`;
  const ogImage = metaContent(page, 'property', 'og:image');
  const imageAlt = metaContent(page, 'property', 'og:image:alt');

  check(ogImage === expectedUrl, `${poem.slug}: Open Graph image does not use its poem card.`);
  check(metaContent(page, 'property', 'og:image:secure_url') === expectedUrl, `${poem.slug}: secure Open Graph image does not match.`);
  check(metaContent(page, 'name', 'twitter:image') === expectedUrl, `${poem.slug}: Twitter image does not match its poem card.`);
  check(metaContent(page, 'property', 'og:image:type') === 'image/jpeg', `${poem.slug}: poem card must declare image/jpeg.`);
  check(Number(metaContent(page, 'property', 'og:image:width')) === 1200, `${poem.slug}: poem card width must be 1200.`);
  check(Number(metaContent(page, 'property', 'og:image:height')) === 630, `${poem.slug}: poem card height must be 630.`);
  check(Boolean(imageAlt), `${poem.slug}: poem card alt text is missing.`);
  check(metaContent(page, 'name', 'twitter:image:alt') === imageAlt, `${poem.slug}: poem card alt text differs between metadata formats.`);

  const cardPath = path.join(root, 'public', 'social', 'poems', `${poem.path}.jpg`);
  check(fs.existsSync(cardPath), `${poem.slug}: generated poem card is missing.`);
  if (!fs.existsSync(cardPath)) return;

  const card = fs.readFileSync(cardPath);
  const dimensions = jpegDimensions(card);
  const hasEndMarker = card.length >= 2
    && card[card.length - 2] === 0xff
    && card[card.length - 1] === 0xd9;

  check(card.length <= 250 * 1024, `${poem.slug}: poem card is ${card.length} bytes; keep it below 250 KB.`);
  check(hasEndMarker, `${poem.slug}: poem card is truncated or missing its end marker.`);
  check(Boolean(dimensions), `${poem.slug}: poem card is not a readable JPEG.`);
  if (dimensions) {
    check(dimensions.width === 1200 && dimensions.height === 630, `${poem.slug}: poem card is not 1200 × 630.`);
  }
}

check(poems.length > 0, 'No poems were generated.');
check(fs.existsSync(path.join(dist, 'index.html')), 'The production index is missing.');
verifySocialPreview();

const rootHtml = fs.existsSync(path.join(dist, 'index.html'))
  ? fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
  : '';
check(rootHtml.includes('class="static-home"'), 'Homepage no-JavaScript reading copy is missing.');
check(rootHtml.includes('class="static-home-index"'), 'Homepage no-JavaScript poem index is missing.');
check(rootHtml.includes('<h3>selected</h3>'), 'Homepage selected-poems group is missing.');
check(rootHtml.includes('<h3>archive</h3>'), 'Homepage poem archive group is missing.');
check(rootHtml.includes('read poems →'), 'Homepage reading call to action is unclear.');
check(/<script\b[^>]*type="application\/ld\+json"/i.test(rootHtml), 'Homepage structured data is missing.');
check(rootHtml.includes('"@type":"Person"'), 'Homepage Person structured data is missing.');
check(rootHtml.includes('"@type":"WebSite"'), 'Homepage WebSite structured data is missing.');

const paths = new Set();
const titles = new Set();

for (const poem of poems) {
  check(Boolean(poem.title), `${poem.slug}: missing title.`);
  check(Boolean(poem.content.trim()), `${poem.slug}: empty poem.`);
  check(!paths.has(poem.path), `${poem.slug}: duplicate public path ${poem.path}.`);
  check(!titles.has(poem.title), `${poem.slug}: duplicate title ${poem.title}.`);
  paths.add(poem.path);
  titles.add(poem.title);

  if (poem.unpublished) {
    check(!poem.published_in, `${poem.slug}: marked unpublished but names a venue.`);
    check(!poem.external_url, `${poem.slug}: marked unpublished but carries a venue URL.`);
    check(Boolean(poem.date), `${poem.slug}: unpublished poems still need a date for the year.`);
  }

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
  check(/<script\b[^>]*type="application\/ld\+json"/i.test(page), `${poem.slug}: structured data is missing.`);
  check(page.includes('https://schema.org'), `${poem.slug}: schema context is missing.`);
  check(page.includes('<noscript>'), `${poem.slug}: no-JavaScript reading copy is missing.`);
  check(page.includes('class="static-verse"'), `${poem.slug}: static verse is missing.`);
  check(page.includes(`<h1>${poem.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h1>`), `${poem.slug}: static title does not match.`);
  check(page.includes(`https://mihirbellamkonda.com${poem.url}`), `${poem.slug}: canonical URL is missing.`);
  verifyPoemSocialPreview(poem, page);
}

const sitemapPath = path.join(dist, 'sitemap.xml');
check(fs.existsSync(sitemapPath), 'Sitemap is missing.');
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  for (const poem of poems) {
    check(sitemap.includes(`https://mihirbellamkonda.com${poem.url}`), `${poem.slug}: missing from sitemap.`);
  }
}


const robotsPath = path.join(dist, 'robots.txt');
check(fs.existsSync(robotsPath), 'robots.txt is missing.');
if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, 'utf8');
  check(robots.includes('Sitemap: https://mihirbellamkonda.com/sitemap.xml'), 'robots.txt does not point to the sitemap.');
}

if (failures.length) {
  console.error(`Site verification failed (${failures.length}):`);
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Verified ${poems.length} poems, social previews, static reading copies, metadata, URLs, and signatures.`);
