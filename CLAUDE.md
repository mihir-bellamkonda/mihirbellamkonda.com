# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a minimalist, book-inspired poetry website built as a Vue 3 Single Page Application (SPA). The site features an intuitive card-stack interface with swipe navigation, showcasing poetry in an elegant, book-like reading experience. It uses Vue 3 with Composition API, Vite for bundling, and a custom Node.js script to convert markdown poems into JSON data.

## Build and Development Commands

```bash
# Install dependencies (required before first build)
npm install

# Generate poems.json from markdown files
npm run poems

# Start development server with hot module reload at http://localhost:5173
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

## Architecture

### Technology Stack

- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **Build Tool**: Vite 5
- **Styling**: CSS with CSS Variables (no preprocessor)
- **Markdown Processing**: gray-matter + marked
- **Deployment**: GitHub Pages via GitHub Actions

### Project Structure

```
mihirbellamkonda.com/
├── src/
│   ├── main.js                 # Vue app entry point
│   ├── App.vue                 # Root component with routing & swipe logic
│   ├── style.css               # Global styles with CSS variables
│   ├── poems.json              # GENERATED - do NOT commit (gitignored)
│   └── components/
│       ├── AboutPage.vue       # Landing page component
│       ├── PoemsListPage.vue   # Table of contents page
│       └── PoemPage.vue        # Individual poem display with font scaling
├── scripts/
│   └── build-poems.js          # Converts markdown poems to JSON
├── poems/
│   └── *.md                    # Markdown poem files with frontmatter
├── public/
│   └── images/                 # Static assets (copied to dist/ by Vite)
├── dist/                       # GENERATED build output (gitignored)
├── index.html                  # Vite entry HTML
├── vite.config.js              # Vite configuration
└── package.json                # Dependencies and scripts
```

### Build Process

#### 1. Poem Processing (`npm run poems`)

The `scripts/build-poems.js` script:

1. **Reads all `.md` files** from `poems/` directory (sorted alphabetically by filename)
2. **Parses frontmatter** using `gray-matter` to extract metadata:
   - `title` (required)
   - `date` (optional)
   - `published_in` (optional)
   - `external_url` (optional)
3. **Converts markdown to HTML** using `marked` library
4. **Generates `src/poems.json`** with array of poem objects:
   ```json
   [
     {
       "slug": "01-The Gesture",
       "title": "The Gesture",
       "date": "2024-10-27",
       "external_url": "",
       "published_in": "",
       "content": "raw markdown text",
       "html": "<p>converted html</p>",
       "index": 1
     }
   ]
   ```
5. This JSON is imported by Vue components at build time

**Important**: `src/poems.json` is generated and should NOT be committed to git (listed in `.gitignore`).

#### 2. Vite Build (`npm run build`)

Vite processes the Vue SPA:

1. **Bundles Vue components** using `@vitejs/plugin-vue`
2. **Compiles and minifies** JavaScript and CSS
3. **Copies static assets** from `public/` to `dist/`
4. **Outputs production build** to `dist/` directory (~208KB total)
   - `dist/assets/index-*.js` (~177KB - includes Vue 3 runtime)
   - `dist/assets/index-*.css` (~5KB - minified styles)
   - `dist/images/` (static assets)

### Poem File Format

Poems are markdown files in `poems/` with YAML frontmatter:

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

### Component Architecture

#### App.vue (Root Component)

The main application component at `src/App.vue` handles:

- **Hash-based routing**: Parses `window.location.hash` to determine current page
  - `#` or `#about` → About page
  - `#contents` → Poems list
  - `#poem/{slug}` → Individual poem
- **Card stack UI**: Implements layered page preview effect
- **Swipe navigation**:
  - Touch events for mobile (left swipe = next, right swipe = prev)
  - Click navigation (left half = prev, right half = next)
  - Keyboard arrows for desktop
- **Page transitions**: Calculates swipe offset, opacity, and scale transforms

Key functions:
- `parseRoute()` - Converts hash to route object
- `navigate()` - Updates hash and triggers navigation
- `goToNextPage()` / `goToPrevPage()` - Navigation logic
- `getPageData()` - Returns component and props for a route

#### AboutPage.vue

Landing page component:
- Displays circular profile image
- Shows name and contact info
- Links to poems list
- Has footer navigation

#### PoemsListPage.vue

Table of contents component:
- Receives `poems` array and `onSelect` callback as props
- Displays all poems in a list with:
  - Title (clickable)
  - Dotted line separator
  - Poem number
  - Publication info (if available)
- Footer navigation

#### PoemPage.vue

Individual poem display component:
- Receives `poem` object, `index`, and `total` as props
- Displays poem title and HTML content
- **Font size auto-scaling**: `fitPoemToWidth()` function dynamically reduces font size if content overflows horizontally
- Shows external publication link if available
- Footer navigation
- Cleans up resize event listener on unmount (prevents memory leaks)

### Navigation System

Navigation is implemented entirely in `App.vue`:

- **Touch gestures**:
  - `handleTouchStart()`, `handleTouchMove()`, `handleTouchEnd()`
  - Swipe threshold: 35% of screen width
  - Swipe left → next page, swipe right → previous page
- **Click navigation**:
  - `handlePageClick()` detects which half of screen was clicked
  - Left half → previous, right half → next
- **Keyboard**:
  - `handleKeydown()` listens for arrow keys
- **Back button behavior**: From any poem, swiping back goes to contents page (not previous poem)

### Styling

All CSS is in `src/style.css` using CSS variables:

```css
:root {
  --color-background: #F9F7F4;
  --color-text: #2C2C2C;
  --color-text-light: #6B6B6B;
  --color-accent: #1B4332;
  --color-accent-hover: #2C5F2D;
  --font-heading: 'Libre Baskerville', serif;
  --font-body: 'Lora', serif;
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 2rem;
  --spacing-lg: 3rem;
  --spacing-xl: 4rem;
}
```

**Design features**:
- Paper texture via inline SVG (fractal noise filter)
- Book cover border effect on about page
- Card stack layering with scale/opacity transforms
- Dotted lines in table of contents
- Responsive font sizes

**Fonts**: Loaded from Google Fonts (Libre Baskerville, Lora) via `index.html`.

### Deployment

Automatic deployment to GitHub Pages:

**Not yet configured** - To set up:

1. Create `.github/workflows/deploy.yml`
2. Configure workflow to:
   - Run `npm install`
   - Run `npm run build`
   - Deploy `dist/` to `gh-pages` branch
3. Enable GitHub Pages in repo settings (source: gh-pages branch)

## Key Implementation Details

1. **SPA with hash routing**: Uses `window.location.hash` for navigation (no router library needed)
2. **Generated data file**: `src/poems.json` is generated by build script and imported at build time
3. **Card stack effect**: Preview page sits underneath current page, scales up during swipe
4. **Poems are 1-indexed** for display (Poem 1 of 5) but 0-indexed internally
5. **Markdown preserves whitespace**: Indentation in poems is maintained through markdown conversion
6. **No external router**: Custom routing logic in App.vue (lightweight, <300 lines)
7. **Font auto-scaling**: PoemPage dynamically adjusts font size to prevent horizontal overflow

## Common Modifications

- **Add a poem**: Create `poems/XX-name.md` with frontmatter, run `npm run build`
- **Change colors**: Edit CSS variables in `src/style.css` root section
- **Modify about page**: Edit `src/components/AboutPage.vue` template
- **Update navigation behavior**: Modify functions in `src/App.vue`
- **Change poem processing**: Edit `scripts/build-poems.js`
- **Adjust swipe sensitivity**: Modify threshold values in App.vue (currently 35% of screen width)

## Important Notes

- **src/poems.json** is generated - do NOT manually edit or commit
- **dist/** is build output - do NOT manually edit or commit
- Poems list always reflects filesystem - no database or config
- Poem slugs are derived from filename (without `.md` extension)
- External links open in new tab with `rel="noopener"` for security
- All navigation is client-side - no backend required
- Build is destructive - `dist/` is completely recreated on each build
- Hot Module Reload (HMR) works in dev mode for instant updates

## Development Tips

- **Test swipe on mobile**: Use browser DevTools mobile emulation or deploy to test device
- **Watch mode**: `npm run dev` includes automatic poem rebuilding on markdown changes
- **Component hot reload**: Vite HMR updates components without full page refresh
- **Debug routing**: Check `route.value` in Vue DevTools to see current route state
- **Font scaling issues**: Check `fitPoemToWidth()` in PoemPage.vue if poems overflow
