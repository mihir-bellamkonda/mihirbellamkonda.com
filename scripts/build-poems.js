import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import { stanzaLines } from './poem-format.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POEMS_DIR = path.join(__dirname, '../poems');
const OUTPUT_FILE = path.join(__dirname, '../src/poems.json');

// Read all poem files
const poemFiles = fs.readdirSync(POEMS_DIR)
  .filter(file => file.endsWith('.md'))
  .sort();

const pathSlug = (value) => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/**
 * The length past which a line is not a line.
 *
 * Every poem in this book was verse until Atlas, which is prose: its stanzas
 * are paragraphs, and a paragraph arrives as one source line of five hundred
 * characters where the longest line of verse in the corpus is eighty-six.
 * Exactly one poem is over this and it is the prose one, which is the whole
 * of the test — there is no front-matter flag to keep in step, so a prose
 * poem dropped in `poems/` is set as prose without anything else being
 * edited, which is how every other property of a poem works here.
 *
 * It is the same number `asemic.js` breaks a paragraph at, for the same
 * reason, and the two are deliberately independent: one decides how the poem
 * is typeset and the other how the hand writes it, and neither should start
 * quietly depending on the other.
 */
const PROSE_LINE = 120;

/** A poem is prose when any of its lines is a paragraph. */
function isProse(stanzas) {
  return stanzas.some(stanza =>
    stanza.some(line => line.replace(/<[^>]*>/g, '').length > PROSE_LINE)
  );
}

const poems = poemFiles.map(file => {
  const filePath = path.join(POEMS_DIR, file);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  const stanzas = content
    .split(/\n[ \t]*\n/)
    .map(stanzaLines)
    .filter(block => block.length > 0);

  const publicPath = pathSlug(data.title || path.basename(file, '.md'));

  return {
    slug: path.basename(file, '.md'),
    path: publicPath,
    url: `/poem/${publicPath}/`,
    title: data.title || 'Untitled',
    subtitle: data.subtitle || '',
    date: data.date || '',
    external_url: data.external_url || '',
    published_in: data.published_in || '',
    unpublished: Boolean(data.unpublished),
    // The archive number, which is not the position in the book. It defaults
    // to the digits the filename starts with, because that is where it lived
    // before the two could differ — but a poem that moves keeps its number by
    // naming it here.
    catalogue: String(data.catalogue ?? (path.basename(file, '.md').match(/^\d+/)?.[0] ?? '')).padStart(2, '0'),
    audio: data.audio || '',
    // Whether this poem's lines are paragraphs rather than verse lines. The
    // page sets each line as its own block with a hanging indent, so a line
    // the poet broke reads differently from one the browser wrapped — which
    // is right for verse and backwards for prose, where every break is the
    // browser's and the indent marks nothing. See PROSE_LINE.
    prose: isProse(stanzas),
    content,
    stanzas
  };
});

const paths = new Set();
for (const poem of poems) {
  if (!poem.path || paths.has(poem.path)) {
    throw new Error(`Duplicate or empty public poem path: ${poem.path || '(empty)'}`);
  }
  paths.add(poem.path);
}

// Ensure src directory exists
const srcDir = path.join(__dirname, '../src');
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}

// Write poems to JSON
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(poems, null, 2));
console.log(`✨ Generated ${poems.length} poems → src/poems.json`);
