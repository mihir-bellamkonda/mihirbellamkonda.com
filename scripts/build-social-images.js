import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { ghost, rngFor } from '../src/asemic.js';
import { studyFor } from '../src/collage-studies.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const outputDir = path.join(publicDir, 'social', 'poems');
const poems = JSON.parse(fs.readFileSync(path.join(root, 'src', 'poems.json'), 'utf8'));

const fonts = {
  display: fs.readFileSync(path.join(publicDir, 'fonts', 'cormorant-garamond-300-latin.woff2')).toString('base64'),
  text: fs.readFileSync(path.join(publicDir, 'fonts', 'spectral-300-latin.woff2')).toString('base64'),
  catalogue: fs.readFileSync(path.join(publicDir, 'fonts', 'ibm-plex-mono-400-latin.woff2')).toString('base64')
};

const escapeXml = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

function wrapTitle(title) {
  const words = String(title).split(/\s+/).filter(Boolean);
  const limit = title.length > 46 ? 17 : 19;
  const lines = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && candidate.length > limit) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  // Four shorter lines are calmer than one heroic overrun.
  return lines.slice(0, 4);
}

function signatureSvg(poem) {
  const strokes = ghost(poem.content, {
    rng: rngFor(`${poem.slug}::social`),
    x: 645,
    width: 500,
    height: 485,
    size: 14,
    maxLines: 6
  });
  const ink = {
    mark: '#23211c',
    green: '#1f4a34',
    rust: '#703124',
    navy: '#303057'
  };

  return strokes.map(stroke => {
    const points = stroke.pts.map(([x, y]) => `${x.toFixed(1)},${(y + 62).toFixed(1)}`).join(' ');
    const widths = Array.isArray(stroke.lw) ? stroke.lw : [stroke.lw];
    const width = widths.reduce((sum, value) => sum + value, 0) / widths.length;
    return `<polyline points="${points}" fill="none" stroke="${ink[stroke.ink] || ink.mark}" stroke-width="${width.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" opacity="${(0.18 * stroke.alpha).toFixed(3)}"/>`;
  }).join('');
}

async function studyImage(poem) {
  const study = studyFor(poem.path);
  if (!study?.primary) return '';

  const source = path.join(publicDir, study.primary.replace(/^\//, ''));
  const image = await sharp(source)
    .resize(690, 630, { fit: 'cover', position: 'centre' })
    .grayscale()
    .tint({ r: 195, g: 191, b: 178 })
    .jpeg({ quality: 78, chromaSubsampling: '4:4:4' })
    .toBuffer();

  return `data:image/jpeg;base64,${image.toString('base64')}`;
}

async function cardSvg(poem, index) {
  const lines = wrapTitle(poem.title);
  const fontSize = lines.length >= 4 ? 53 : lines.length === 3 ? 61 : lines.length === 2 ? 70 : 80;
  const lineHeight = Math.round(fontSize * 0.96);
  const titleHeight = lines.length * lineHeight;
  const titleY = Math.round(300 - titleHeight / 2 + fontSize * 0.78);
  const image = await studyImage(poem);
  const year = String(poem.date || '').match(/\d{4}/)?.[0] || '';
  const venue = poem.published_in || (poem.unpublished ? 'unpublished' : '');
  const metadata = [venue, year].filter(Boolean).join(' · ');
  const number = String(index + 1).padStart(2, '0');

  const title = lines.map((line, lineIndex) =>
    `<tspan x="78" y="${titleY + lineIndex * lineHeight}">${escapeXml(line)}</tspan>`
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <style>
        @font-face { font-family: CardDisplay; src: url(data:font/woff2;base64,${fonts.display}) format('woff2'); font-weight: 300; }
        @font-face { font-family: CardText; src: url(data:font/woff2;base64,${fonts.text}) format('woff2'); font-weight: 300; }
        @font-face { font-family: CardCatalogue; src: url(data:font/woff2;base64,${fonts.catalogue}) format('woff2'); font-weight: 400; }
      </style>
      <clipPath id="study"><path d="M612 34 L1182 0 L1200 552 L1108 630 L650 604 Z"/></clipPath>
      <linearGradient id="veil" x1="0" x2="1">
        <stop offset="0" stop-color="#f2efe6" stop-opacity="1"/>
        <stop offset="0.35" stop-color="#f2efe6" stop-opacity="0.9"/>
        <stop offset="1" stop-color="#f2efe6" stop-opacity="0.25"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="#f2efe6"/>
    ${image ? `<image href="${image}" x="570" y="0" width="690" height="630" preserveAspectRatio="xMidYMid slice" opacity="0.23" clip-path="url(#study)"/>` : ''}
    <rect x="505" width="695" height="630" fill="url(#veil)"/>
    <path d="M594 0 L621 630" stroke="#d5d0c2" stroke-width="1" opacity="0.82"/>
    <g>${signatureSvg(poem)}</g>
    <path d="M78 79 H119" stroke="#1f4a34" stroke-width="2"/>
    <text x="78" y="111" font-family="CardCatalogue, monospace" font-size="12" letter-spacing="3.2" fill="#6f6a60">${number} / ${String(poems.length).padStart(2, '0')}</text>
    <text font-family="CardDisplay, Georgia, serif" font-size="${fontSize}" font-weight="300" fill="#23211c">${title}</text>
    <text x="78" y="528" font-family="CardText, Georgia, serif" font-size="22" fill="#23211c">Mihir Bellamkonda</text>
    <text x="78" y="562" font-family="CardCatalogue, monospace" font-size="11" letter-spacing="1.7" fill="#6f6a60">${escapeXml(metadata)}</text>
    <text x="1124" y="582" text-anchor="end" font-family="CardCatalogue, monospace" font-size="10" letter-spacing="2.2" fill="#1f4a34">MB / ${number}</text>
  </svg>`;
}

fs.mkdirSync(outputDir, { recursive: true });
const expected = new Set(poems.map(poem => `${poem.path}.jpg`));
for (const file of fs.readdirSync(outputDir)) {
  if (file.endsWith('.jpg') && !expected.has(file)) fs.rmSync(path.join(outputDir, file));
}

for (const [index, poem] of poems.entries()) {
  const svg = await cardSvg(poem, index);
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4', progressive: false })
    .toFile(path.join(outputDir, `${poem.path}.jpg`));
}

console.log(`Generated ${poems.length} poem share cards → public/social/poems/`);
