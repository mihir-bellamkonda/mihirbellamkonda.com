/**
 * Start a new poem.
 *
 *   npm run new-poem "Poem Title"
 *   npm run new-poem -- "Poem Title" --venue "Magazine Name" --url "https://..."
 *
 * The file lands last in the book, numbered one past the highest number any
 * poem already uses — in its filename, or in the `catalogue:` a poem keeps
 * when it moves — so its plate number is one no poem has had. Without a venue
 * it is marked unpublished. Only the front matter is written: the poem, and
 * the collage study that has to sit under it, are chosen by hand.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import matter from 'gray-matter';
import { pathSlug } from './poem-format.js';

const POEMS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../poems');

export function nextNumber(poems) {
  const used = poems.flatMap(({ file, data }) => [
    Number(file.match(/^\d+/)?.[0] ?? 0),
    Number(data.catalogue ?? 0)
  ]);
  return Math.max(0, ...used) + 1;
}

export function fileNameFor(number, title) {
  const name = title.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
  return `${String(number).padStart(2, '0')}-${name}.md`;
}

export function frontMatter({ title, date, venue, url }) {
  const lines = ['---', `title: ${JSON.stringify(title)}`, `date: ${date}`];
  if (venue) {
    lines.push(`published_in: ${JSON.stringify(venue)}`);
    if (url) lines.push(`external_url: ${JSON.stringify(url)}`);
  } else {
    lines.push('unpublished: true');
  }
  return lines.concat('---', '', '').join('\n');
}

function parseArgs(argv) {
  const words = [];
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--venue' || argv[i] === '--url') options[argv[i].slice(2)] = argv[++i];
    else words.push(argv[i]);
  }
  return { title: words.join(' ').trim(), ...options };
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function today() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function main() {
  const { title, venue, url } = parseArgs(process.argv.slice(2));
  if (!title) fail('Give the poem a title: npm run new-poem "Poem Title"');
  if (url && !venue) fail('A --url needs the --venue it belongs to.');
  if (url && !url.startsWith('https://')) fail('The venue URL must start with https://.');

  const address = pathSlug(title);
  if (!address) fail(`"${title}" has no letters or digits to make an address from.`);

  const poems = fs.readdirSync(POEMS_DIR)
    .filter(file => file.endsWith('.md'))
    .map(file => ({ file, data: matter(fs.readFileSync(path.join(POEMS_DIR, file), 'utf8')).data }));
  const clash = poems.find(({ file, data }) => pathSlug(data.title || path.basename(file, '.md')) === address);
  if (clash) fail(`${clash.file} already lives at /poem/${address}/.`);

  const file = fileNameFor(nextNumber(poems), title);
  fs.writeFileSync(path.join(POEMS_DIR, file), frontMatter({ title, date: today(), venue, url }), { flag: 'wx' });

  console.log(`Created poems/${file}, last in the index, at /poem/${address}/.

Next:
  1. Write the poem below the front matter.
  2. Give it a collage study keyed '${address}' in src/collage-studies.js.
     The verifier fails until it has one.
  3. npm run verify`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
