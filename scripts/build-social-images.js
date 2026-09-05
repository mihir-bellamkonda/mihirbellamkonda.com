import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { ghost, rngFor } from '../src/asemic.js';
import { studyFor } from '../src/collage-studies.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');

// Sharp uses Pango for text. Embedded SVG fonts are not supported by that
// renderer, so use its fontfile option with the same files the site serves.
// Force the fontconfig backend on macOS too, where Core Text otherwise skips
// the supplied file and silently falls back to a system face. The temporary
// config gives fontconfig a writable cache in local and CI environments.
process.env.PANGOCAIRO_BACKEND = 'fontconfig';
const fontConfigDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mihir-card-fonts-'));
const fontCacheDir = path.join(fontConfigDir, 'cache');
fs.mkdirSync(fontCacheDir);
fs.writeFileSync(path.join(fontConfigDir, 'fonts.conf'), [
  '<?xml version="1.0"?>',
  '<!DOCTYPE fontconfig SYSTEM "fonts.dtd">',
  '<fontconfig>',
  `  <dir>${root}/scripts/fonts</dir>`,
  '  <dir>/System/Library/Fonts</dir>',
  '  <dir>/usr/share/fonts</dir>',
  `  <cachedir>${fontCacheDir}</cachedir>`,
  '</fontconfig>'
].join('\n'));
process.env.FONTCONFIG_FILE = path.join(fontConfigDir, 'fonts.conf');
process.env.FONTCONFIG_PATH = fontConfigDir;
process.env.XDG_CACHE_HOME = fontCacheDir;
process.on('exit', () => fs.rmSync(fontConfigDir, { recursive: true, force: true }));
const { default: sharp } = await import('sharp');

const outputDir = path.join(publicDir, 'social', 'poems');
const poems = JSON.parse(fs.readFileSync(path.join(root, 'src', 'poems.json'), 'utf8'));

const fonts = {
  display: {
    file: path.join(root, 'scripts', 'fonts', 'sorts-mill-goudy-400-latin.ttf'),
    family: 'Sorts Mill Goudy'
  },
  text: {
    file: path.join(root, 'scripts', 'fonts', 'spectral-300-latin.ttf'),
    family: 'Spectral Light'
  },
  catalogue: {
    file: path.join(root, 'scripts', 'fonts', 'sligoil-micro-400-latin.ttf'),
    family: 'Sligoil Micro'
  }
};

const escapePango = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

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

async function textLayer(text, font, size, color, options = {}) {
  const markup = `<span foreground="${color}">${escapePango(text)}</span>`;
  const textOptions = {
    text: markup,
    font: `${font.family} ${size}`,
    fontfile: font.file,
    dpi: 72,
    rgba: true,
    wrap: 'none'
  };

  if (options.width) {
    textOptions.width = options.width;
    textOptions.align = options.align || 'left';
  }
  if (options.spacing !== undefined) textOptions.spacing = options.spacing;

  return {
    input: await sharp({ text: textOptions }).png().toBuffer(),
    left: options.left || 0,
    top: options.top || 0
  };
}

async function cardImage(poem, index) {
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
  const catalogue = String(poem.catalogue || number).padStart(2, '0');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
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
  </svg>`;

  const overlays = [
    await textLayer(
      `${number} / ${String(poems.length).padStart(2, '0')}`,
      fonts.catalogue,
      12,
      '#6f6a60',
      { left: 78, top: 101 }
    ),
    await textLayer(
      lines.join('\n'),
      fonts.display,
      fontSize,
      '#23211c',
      { left: 78, top: Math.round(titleY - fontSize * 0.8), spacing: lineHeight - fontSize }
    ),
    await textLayer(
      'Mihir Bellamkonda',
      fonts.text,
      22,
      '#23211c',
      { left: 78, top: 510 }
    ),
    await textLayer(
      metadata,
      fonts.catalogue,
      11,
      '#6f6a60',
      { left: 78, top: 553 }
    ),
    await textLayer(
      `MB / ${catalogue}`,
      fonts.catalogue,
      10,
      '#1f4a34',
      { left: 904, top: 574, width: 220, align: 'right' }
    )
  ];

  return sharp(Buffer.from(svg))
    .composite(overlays)
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4', progressive: false })
    .toBuffer();
}

fs.mkdirSync(outputDir, { recursive: true });
const expected = new Set(poems.map(poem => `${poem.path}.jpg`));
for (const file of fs.readdirSync(outputDir)) {
  if (file.endsWith('.jpg') && !expected.has(file)) fs.rmSync(path.join(outputDir, file));
}

for (const [index, poem] of poems.entries()) {
  const image = await cardImage(poem, index);
  fs.writeFileSync(path.join(outputDir, `${poem.path}.jpg`), image);
}

console.log(`Generated ${poems.length} poem share cards → public/social/poems/`);
