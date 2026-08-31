import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POEMS_DIR = path.join(__dirname, '../poems');
const OUTPUT_FILE = path.join(__dirname, '../src/poems.json');

// Read all poem files
const poemFiles = fs.readdirSync(POEMS_DIR)
  .filter(file => file.endsWith('.md'))
  .sort();

const poems = poemFiles.map((file, index) => {
  const filePath = path.join(POEMS_DIR, file);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  // Stanzas as structured lines, so the page can set each line as its own
  // block with a hanging indent. A wrapped line then reads differently from a
  // line the poet actually broke — which `white-space: pre` could not do.
  // parseInline keeps the poet's own emphasis and escapes everything else.
  const stanzas = content
    .split(/\n[ \t]*\n/)
    .map(block => block.split('\n').map(l => l.trim()).filter(Boolean))
    .filter(block => block.length > 0)
    .map(block => block.map(line => marked.parseInline(line)));

  return {
    slug: path.basename(file, '.md'),
    title: data.title || 'Untitled',
    subtitle: data.subtitle || '',
    date: data.date || '',
    external_url: data.external_url || '',
    published_in: data.published_in || '',
    content: content,
    html: marked(content),
    stanzas: stanzas,
    index: index + 1
  };
});

// Ensure src directory exists
const srcDir = path.join(__dirname, '../src');
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}

// Write poems to JSON
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(poems, null, 2));
console.log(`✨ Generated ${poems.length} poems → src/poems.json`);
