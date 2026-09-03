/**
 * Put a found photograph through the house treatment.
 *
 * Every plate in public/collage/ has had the same things done to it: cropped
 * away from its mount and its printed caption, flattened to grey, compressed
 * into the narrow tonal range the folio sits in, and feathered at the edges so
 * the fragment dissolves into the page instead of ending on a straight line.
 * Until now that was a description of work done by hand, which meant the next
 * plate was only as consistent as whoever prepared it — the tree section added
 * in September went up with no feather at all and read as a hard rectangle
 * beside twenty soft ones.
 *
 *   node scripts/prepare-plate.js <source> <name> [options]
 *
 *   --crop l,t,w,h   take this rectangle of the source first
 *   --negate         for a negative: a pale subject on a dark ground
 *   --mean N         override the tone it settles on   (default: the library's)
 *   --sd N           override the contrast it settles on
 *
 * The result lands in public/collage/<name>.webp. `npm run verify` then checks
 * it the same way this wrote it, so a plate prepared any other way has to meet
 * the same standard.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// The library's own middle, measured inside the feather rather than across the
// file — the transparent border is dark and would drag every reading down.
const TONE = 177;
const CONTRAST = 20;
const FLOOR = 118;
const CEILING = 246;
const WIDTH = 1300;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** RGBA, always. Guessing at channel counts is how this goes wrong. */
async function rgba(pipe) {
  const { data, info } = await pipe.toColourspace('srgb').ensureAlpha()
    .raw().toBuffer({ resolveWithObject: true });
  if (info.channels !== 4) throw new Error(`expected RGBA, got ${info.channels} channels`);
  return { data, width: info.width, height: info.height };
}

/** The house edge: opaque through the middle, gone by the border. */
async function feather(width, height) {
  const inset = Math.round(Math.min(width, height) * 0.06);
  const opaque = await sharp({
    create: { width: width - inset * 2, height: height - inset * 2, channels: 3, background: { r: 255, g: 255, b: 255 } }
  }).png().toBuffer();

  const { data, info } = await sharp({
    create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } }
  })
    .composite([{ input: opaque, left: inset, top: inset }])
    .blur(Math.max(2, Math.min(width, height) * 0.045))
    .raw().toBuffer({ resolveWithObject: true });

  // composite() can promote the canvas to RGBA, so stride by what came back.
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) mask[i] = data[i * info.channels];
  return mask;
}

export async function preparePlate(source, destination, options = {}) {
  let pipe = sharp(source);
  if (options.crop) pipe = pipe.extract(options.crop);
  if (options.negate) pipe = pipe.negate({ alpha: false });
  const { data, width, height } = await rgba(pipe.resize(WIDTH));

  const grey = new Uint8Array(width * height);
  const mask = await feather(width, height);

  let opaque = 0, sum = 0, sumSquares = 0, low = 255, high = 0;
  for (let i = 0; i < width * height; i++) {
    grey[i] = Math.round(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
    if (mask[i] < 200) continue;
    const value = grey[i];
    opaque++;
    sum += value;
    sumSquares += value * value;
    if (value < low) low = value;
    if (value > high) high = value;
  }
  const mean = sum / opaque;
  const deviation = Math.sqrt(sumSquares / opaque - mean * mean);

  const wantMean = options.mean ?? TONE;
  const wantDeviation = options.sd ?? CONTRAST;

  // Ease the contrast until both ends sit inside the paper's range. Shifting
  // the whole image instead is what blows a pale plate out to white.
  let scale = wantDeviation / deviation;
  if (scale * low + (wantMean - scale * mean) < FLOOR) {
    scale = Math.min(scale, (wantMean - FLOOR) / (mean - low));
  }
  if (scale * high + (wantMean - scale * mean) > CEILING) {
    scale = Math.min(scale, (CEILING - wantMean) / (high - mean));
  }
  const lift = wantMean - scale * mean;

  const out = Buffer.alloc(width * height * 2);
  for (let i = 0; i < width * height; i++) {
    out[i * 2] = clamp(Math.round(scale * grey[i] + lift), 0, 255);
    out[i * 2 + 1] = mask[i];
  }
  await sharp(out, { raw: { width, height, channels: 2 } })
    .webp({ quality: 84 }).toFile(destination);

  return { width, height, before: { mean, deviation }, scale, lift };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [source, name, ...rest] = process.argv.slice(2);
  if (!source || !name) {
    console.error('usage: node scripts/prepare-plate.js <source> <name> [--crop l,t,w,h] [--negate] [--mean N] [--sd N]');
    process.exit(1);
  }

  const options = {};
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--crop') {
      const [left, top, width, height] = rest[++i].split(',').map(Number);
      options.crop = { left, top, width, height };
    } else if (rest[i] === '--negate') options.negate = true;
    else if (rest[i] === '--mean') options.mean = Number(rest[++i]);
    else if (rest[i] === '--sd') options.sd = Number(rest[++i]);
  }

  const destination = path.join(root, 'public/collage', `${name.replace(/\.webp$/, '')}.webp`);
  const result = await preparePlate(source, destination, options);
  const size = (fs.statSync(destination).size / 1024).toFixed(0);
  console.log(`${path.relative(root, destination)} — ${result.width}×${result.height}, ${size} kB`);
  console.log(`  came in at mean ${result.before.mean.toFixed(0)}, deviation ${result.before.deviation.toFixed(0)}`);
  console.log(`  settled onto the library's range and given the house edge`);
  console.log(`  record where it came from and what was cropped away in public/collage/README.md`);
}
