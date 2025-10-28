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

  return {
    slug: path.basename(file, '.md'),
    title: data.title || 'Untitled',
    date: data.date || '',
    external_url: data.external_url || '',
    published_in: data.published_in || '',
    content: content,
    html: marked(content),
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
