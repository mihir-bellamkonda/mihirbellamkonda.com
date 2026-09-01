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
    audio: data.audio || '',
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
