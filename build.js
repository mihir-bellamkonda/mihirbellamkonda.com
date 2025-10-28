const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

// Configuration
const POEMS_DIR = path.join(__dirname, 'poems');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const DIST_DIR = path.join(__dirname, 'dist');
const STYLES_DIR = path.join(__dirname, 'styles');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Clean and create dist directory
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Copy styles to dist
fs.mkdirSync(path.join(DIST_DIR, 'styles'), { recursive: true });
fs.readdirSync(STYLES_DIR).forEach(file => {
  fs.copyFileSync(
    path.join(STYLES_DIR, file),
    path.join(DIST_DIR, 'styles', file)
  );
});

// Copy public assets to dist
if (fs.existsSync(PUBLIC_DIR)) {
  fs.cpSync(PUBLIC_DIR, path.join(DIST_DIR, 'public'), { recursive: true });
}

// Copy scripts to dist
const SCRIPTS_DIR = path.join(__dirname, 'scripts');
if (fs.existsSync(SCRIPTS_DIR)) {
  fs.mkdirSync(path.join(DIST_DIR, 'scripts'), { recursive: true });
  fs.readdirSync(SCRIPTS_DIR).forEach(file => {
    fs.copyFileSync(
      path.join(SCRIPTS_DIR, file),
      path.join(DIST_DIR, 'scripts', file)
    );
  });
}

// Read templates
const layout = fs.readFileSync(path.join(TEMPLATES_DIR, 'layout.html.template'), 'utf-8');
const aboutTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'about.html.template'), 'utf-8');
const poemsListTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'poems-list.html.template'), 'utf-8');
const poemTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'poem.html.template'), 'utf-8');
const poemViewerTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'poem-viewer.html.template'), 'utf-8');

// Helper function to render a page with layout
function renderPage(content, title = 'Mihir\'s Poetry', navData = '') {
  return layout
    .replace('{{TITLE}}', title)
    .replace('{{CONTENT}}', content)
    .replace('{{NAV_DATA}}', navData);
}

// Read all poem files
const poemFiles = fs.readdirSync(POEMS_DIR)
  .filter(file => file.endsWith('.md'))
  .sort(); // Sort alphabetically by filename

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
    index: index + 1 // 1-indexed for display
  };
});

console.log(`Found ${poems.length} poems`);

// Generate about page (index.html)
// About page navigation: can swipe right to contents
const aboutNavData = 'data-next-page="/poems/"';
const aboutHtml = renderPage(aboutTemplate, 'Mihir - Poet', aboutNavData);
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), aboutHtml);
console.log('Generated index.html (about page)');

// Generate poems list page
let poemsListHtml = '';
poems.forEach(poem => {
  const externalInfo = poem.published_in
    ? `<div class="poem-meta">Also published in ${poem.published_in}</div>`
    : '';

  poemsListHtml += `
    <div class="poem-entry">
      <div class="poem-entry-top">
        <a href="/poems/viewer.html#${poem.slug}" class="poem-title">${poem.title}</a>
        <span class="dots"></span>
        <span class="poem-number">${poem.index}</span>
      </div>
      ${externalInfo}
    </div>
  `;
});

const poemsListContent = poemsListTemplate.replace('{{POEMS_LIST}}', poemsListHtml);

// Poems list navigation: can swipe left to about, right to first poem
const firstPoemSlug = poems.length > 0 ? poems[0].slug : '';
const poemsListNavData = `data-prev-page="/" data-next-page="/poems/${firstPoemSlug}.html"`;
const poemsListPage = renderPage(poemsListContent, 'Poems', poemsListNavData);

// Create poems directory in dist
fs.mkdirSync(path.join(DIST_DIR, 'poems'), { recursive: true });
fs.writeFileSync(path.join(DIST_DIR, 'poems', 'index.html'), poemsListPage);
console.log('Generated poems/index.html (poems list)');

// Generate poem viewer page with all poems embedded
const poemsJsonData = poems.map(poem => ({
  slug: poem.slug,
  title: poem.title,
  date: poem.date,
  external_url: poem.external_url,
  published_in: poem.published_in,
  content: marked(poem.content), // Pre-render to HTML
  index: poem.index
}));

const viewerContent = poemViewerTemplate.replace('{{POEMS_JSON}}', JSON.stringify(poemsJsonData));
const viewerPage = renderPage(viewerContent, 'Poems');
fs.writeFileSync(path.join(DIST_DIR, 'poems', 'viewer.html'), viewerPage);
console.log('Generated poems/viewer.html (smooth poem viewer)');

// Generate individual poem pages
poems.forEach((poem, index) => {
  const htmlContent = marked(poem.content);

  const prevPoem = index > 0 ? poems[index - 1] : null;
  const nextPoem = index < poems.length - 1 ? poems[index + 1] : null;

  const prevLink = prevPoem
    ? `<a href="/poems/${prevPoem.slug}.html" class="nav-arrow prev" aria-label="Previous poem">←</a>`
    : '<span class="nav-arrow prev disabled">←</span>';

  const nextLink = nextPoem
    ? `<a href="/poems/${nextPoem.slug}.html" class="nav-arrow next" aria-label="Next poem">→</a>`
    : '<span class="nav-arrow next disabled">→</span>';

  const externalLink = poem.external_url && poem.published_in
    ? `<p class="external-link">Also published in <a href="${poem.external_url}" target="_blank" rel="noopener">${poem.published_in}</a></p>`
    : '';

  const pageNumber = `<span class="page-number">Poem ${poem.index} of ${poems.length}</span>`;

  const poemHtml = poemTemplate
    .replace('{{POEM_TITLE}}', poem.title)
    .replace('{{POEM_CONTENT}}', htmlContent)
    .replace('{{EXTERNAL_LINK}}', externalLink)
    .replace('{{PREV_LINK}}', prevLink)
    .replace('{{NEXT_LINK}}', nextLink)
    .replace('{{PAGE_NUMBER}}', pageNumber)
    .replace('{{PREV_SLUG}}', prevPoem ? prevPoem.slug : '')
    .replace('{{NEXT_SLUG}}', nextPoem ? nextPoem.slug : '');

  // Poem navigation: swipe between poems, or back to contents
  // First poem: prev = contents, next = next poem
  // Last poem: prev = prev poem, next = contents
  // Middle poems: prev = prev poem, next = next poem
  const prevUrl = index === 0 ? '/poems/' : `/poems/${prevPoem.slug}.html`;
  const nextUrl = index === poems.length - 1 ? '/poems/' : `/poems/${nextPoem.slug}.html`;
  const poemNavData = `data-prev-page="${prevUrl}" data-next-page="${nextUrl}"`;

  const poemPage = renderPage(poemHtml, poem.title, poemNavData);

  fs.writeFileSync(path.join(DIST_DIR, 'poems', `${poem.slug}.html`), poemPage);
  console.log(`Generated poems/${poem.slug}.html`);
});

console.log('\n✨ Build complete! Site generated in /dist');