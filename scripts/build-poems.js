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

const escapeHtml = (ch) =>
  ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch;

const pathSlug = (value) => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/**
 * Split one stanza into lines, each a complete fragment of HTML.
 *
 * The page sets every line as its own block so a wrapped line reads
 * differently from a break the poet made. That means each line has to be
 * valid on its own — but the poet's emphasis often spans several lines:
 *
 *     *We are the people by the water
 *     in the morning—*
 *
 * A section header is the poet's own **bold**, marked the same way.
 *
 * So emphasis is tracked across the whole stanza and closed and reopened at
 * each line break. Parsing line by line would leave an unclosed asterisk on
 * every line and print the asterisks literally.
 *
 * Only the poet's own asterisks are interpreted. Nothing else is added.
 */
function stanzaLines(block) {
  let out = '';
  const open = [];                                  // outermost first

  const closeAll = () => open.map(t => `</${t}>`).reverse().join('');
  const reopenAll = () => open.map(t => `<${t}>`).join('');

  // Toggling a tag that is not innermost has to close what sits inside it
  // first, drop it, and reopen the rest, or the HTML crosses over itself.
  const toggle = tag => {
    const at = open.lastIndexOf(tag);
    if (at === -1) {
      open.push(tag);
      return `<${tag}>`;
    }
    const inner = open.splice(at);
    const rest = inner.slice(1);
    open.push(...rest);
    return inner.map(t => `</${t}>`).reverse().join('') + rest.map(t => `<${t}>`).join('');
  };

  for (let i = 0; i < block.length; i += 1) {
    const ch = block[i];
    if (ch === '*' && block[i + 1] === '*') {
      out += toggle('strong');
      i += 1;
    } else if (ch === '*') {
      out += toggle('em');
    } else if (ch === '\n') {
      out += closeAll() + '\n' + reopenAll();
    } else {
      out += escapeHtml(ch);
    }
  }
  out += closeAll();

  return out
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '' && !/^(?:<em><\/em>|<strong><\/strong>)+$/.test(line));
}

const poems = poemFiles.map((file, index) => {
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
    content: content,
    html: marked(content),
    stanzas: stanzas,
    index: index + 1
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
