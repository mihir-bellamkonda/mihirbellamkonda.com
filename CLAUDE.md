# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a minimalist, book-inspired static website for showcasing poetry. The site is built using vanilla HTML, CSS, and JavaScript with a custom Node.js build script that converts markdown poems into static HTML pages.

## Build and Development Commands

```bash
# Build the site (generates HTML from markdown poems)
npm run build

# Build and serve locally at http://localhost:3000
npm run dev

# Install dependencies (required before first build)
npm install
```

## Architecture

### Build Process (build.js)

The build system is the core of the project. It:

1. **Reads markdown files** from `poems/` directory (sorted alphabetically by filename)
2. **Parses frontmatter** using `gray-matter` to extract metadata (title, date, published_in, external_url)
3. **Converts markdown to HTML** using `marked` library
4. **Generates three page types**:
   - About page (index.html) - the landing page
   - Poems list page (poems/index.html) - table of contents style listing
   - Individual poem pages (poems/{slug}.html) - one per poem with navigation
5. **Copies static assets** (styles/, scripts/, public/) to dist/
6. **Injects content into templates** using simple string replacement ({{PLACEHOLDER}} syntax)
7. **Creates navigation links** between poems (prev/next)

### Template System

Templates use a simple string replacement approach (not a templating engine):
- `layout.html` - Main wrapper with navigation, loads all CSS files
- `about.html` - Landing page content
- `poems-list.html` - Listing page with {{POEMS_LIST}} placeholder
- `poem.html` - Individual poem page with multiple placeholders

Placeholders: {{TITLE}}, {{CONTENT}}, {{POEM_TITLE}}, {{POEM_CONTENT}}, {{PREV_LINK}}, {{NEXT_LINK}}, {{PAGE_NUMBER}}, {{PREV_SLUG}}, {{NEXT_SLUG}}, {{EXTERNAL_LINK}}, {{POEMS_LIST}}

### Poem File Format

Poems are markdown files in `poems/` with required frontmatter:

```markdown
---
title: "Poem Title"
date: 2024-10-27
published_in: "Magazine Name"  # Optional
external_url: "https://..."    # Optional
---

Poem content here with preserved
    indentation and line breaks
```

**Important**: Filename determines sort order (poems are sorted alphabetically). Use number prefixes like `01-`, `02-` to control ordering.

### Navigation System

- **poem-navigation.js** handles both swipe (mobile) and keyboard (desktop) navigation
- Swipe: left = next, right = previous (minimum 50px distance)
- Keyboard: arrow keys for navigation
- Navigation state stored in data attributes: `data-prev-slug` and `data-next-slug`

### Styling

All CSS uses CSS variables defined in `main.css` root:
- `--color-background`, `--color-text`, `--color-accent` for theming
- `--font-heading`, `--font-body` for typography
- Uses Google Fonts: Libre Baskerville, Lora, Crimson Text, EB Garamond
- Paper texture applied via SVG background-image in body element

Page-specific styles:
- `about.css` - Landing page with circular profile image
- `poems.css` - List page with table-of-contents dotted lines
- `poem.css` - Individual poem pages with centered content

## Deployment

Automatic deployment via GitHub Actions (`.github/workflows/deploy.yml`):
- Triggers on push to `main` branch
- Runs `npm run build`
- Deploys `dist/` folder to `gh-pages` branch
- Site goes live at GitHub Pages in 2-3 minutes

## Key Implementation Details

1. **Build is destructive**: `dist/` directory is completely removed and recreated on each build
2. **No server-side rendering**: Everything is pre-generated static HTML
3. **Absolute paths**: All links use absolute paths (e.g., `/poems/`, `/styles/main.css`) for GitHub Pages compatibility
4. **Poems are 1-indexed** for display (Poem 1 of 5) but 0-indexed internally
5. **Markdown preserves whitespace**: Indentation in poems is maintained through markdown conversion
6. **Template injection happens twice**: Content is injected into specific template, then that result is injected into layout.html

## Common Modifications

- **Add a poem**: Create `poems/XX-name.md` with frontmatter, run `npm run build`
- **Change colors**: Edit CSS variables in `styles/main.css` root section
- **Modify about page**: Edit `templates/about.html` content
- **Update navigation**: Modify `scripts/poem-navigation.js` event handlers
- **Change build logic**: Edit `build.js` (well-commented)

## Important Notes

- Poems list always reflects filesystem - no database or config
- Poem slugs are derived from filename (without `.md` extension)
- External links open in new tab with `rel="noopener"` for security
- All navigation is client-side - no backend required
- CSS is not minified or bundled (intentionally simple)
