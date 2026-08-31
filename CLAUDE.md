# CLAUDE.md

Guidance for Claude Code working in this repository.

## Project

The poetry site of **Mihir Bellamkonda** (pronouns **they/he**; his published bios
use "they"). Live at **https://mihirbellamkonda.com**.

It is a **publication record** — a numbered index of published poems with venue and
year, not a themed collection. Vue 3 SPA, Vite, hash routing, markdown poems compiled
to JSON at build time, deployed to GitHub Pages by GitHub Actions.

## Rules that are not negotiable

1. **No line of a poem may be modified.** No added emphasis, no coloured lines, no
   drop caps, no size changes, no auto-shrinking. Every line is set identically.
   Emphasis already present in a source file is the poet's own and stays — the rule
   is *add nothing*, not strip what he wrote.
2. **Do not use the word "plates"** anywhere user-facing. Numbers only: `01 / 18`.
3. **No explanatory captions.** The index has no heading and no introductory
   sentence. It gets space instead.
4. The accent is **dark green**, never rust or red.

## Commands

```bash
npm install       # first run
npm run poems     # markdown -> src/poems.json
npm run dev       # dev server, localhost:5173
npm run build     # npm run poems && vite build -> dist/
npm run preview   # serve the production build
```

## Deployment

- Repo `mihir-bellamkonda/mihirbellamkonda.com`, default branch **`trunk`**, not `main`
- `.github/workflows/deploy.yml` runs `npm ci && npm run build`, uploads `dist/`
- Pages source is **GitHub Actions**; custom domain set, Enforce HTTPS on
- `public/CNAME` must stay in `public/` — Vite copies `public/` into `dist/`, and
  `dist/` is the artifact. A root-level CNAME never reaches the published site.
- `vite.config.js` base must stay `/`. A project subpath 404s every asset and the
  page renders blank.
- A failed build does not deploy, so the live site survives a bad push. **But check
  the rendered page in a browser, not just the Actions status** — the multi-line
  emphasis bug passed the build and was only visible on screen.

## Structure

```
poems/*.md                        source poems, filename sets order
scripts/build-poems.js            markdown -> src/poems.json
src/asemic.js                     the mark generator
src/App.vue                       hash routing
src/components/
  AboutPage.vue                   opening: name, bio, link in
  PoemsListPage.vue               the index
  PoemPage.vue                    one poem
  AsemicMarks.vue                 canvas wrapper around asemic.js
  FooterNav.vue                   the dark band
src/style.css                     design tokens only
```

`src/poems.json` and `dist/` are generated and gitignored. Do not edit or commit them.

## Poem files

```markdown
---
title: "Poem Title"
subtitle: "For L.H."                 # optional, shown as a dedication
date: 2024-10-15
published_in: "Bluestem Magazine"    # optional
external_url: "https://..."          # optional
---

The poem. Blank lines separate stanzas.
*Emphasis is the poet's own* and may span line breaks.
```

`build-poems.js` emits a `stanzas` array: stanzas of lines, each line a complete HTML
fragment. Emphasis is tracked **across the whole stanza** and closed and reopened at
each line break, because his italics often span several lines. Parsing line by line
leaves an unclosed asterisk on every line and prints the asterisks literally.

## Design

Bone `#F2EFE6` ground, graphite `#23211C` ink, deep green `#1F4A34` accent, against a
second band `#1D1B18`. Dark mode is a **negative, not a dimming** — the two bands
trade places. All colour lives in `src/style.css` as tokens; components never
hard-code a colour.

Faces: **Cormorant Garamond** display, **Spectral** verse, **IBM Plex Mono** for the
small catalogue chrome.

The poem page is two columns — number, title, dedication and provenance in a left
margin, verse pushed right. Each verse line is its own block with a hanging indent, so
a wrapped line reads differently from a break the poet made. This replaced a
`fitPoemToWidth()` routine that shrank the type until the longest line fit; do not
reintroduce anything like it.

## The marks

`src/asemic.js` generates writing with the shape of writing and no words in it.

- Every mark comes from a **real poem's line and word structure**, so the illegible
  column is genuinely a poem rendered unreadable.
- The column beside a poem draws the **next poem in sequence**, wrapping at the end.
- **Seeded from the slug**, so a poem's signature is identical on every load for every
  reader. Never make it random per visit.
- Letterforms follow Mihir's hand from photographed notebook pages: angular rather
  than looped, sharp peaks joined by straight segments, ascenders near three times the
  x-height, long hooked descenders, frequent pen lifts, overshooting crossbars, a fine
  even line, slight forward lean.
- The hand **scales to the space it is given** — `fitSize()` picks a size so the
  longest line nearly fills the width and the poem fits the height. Stroke weight
  tracks that size; a fixed hairline vanishes once the hand scales up.
- Canvas, never a handwriting font. Ink colour comes from CSS variables so marks
  follow the theme.

## Notes

- Navigation is ordinary links with real URLs. The card-stack swipe was removed: it
  hid the index behind a gesture and had no way back that wasn't a swipe. Arrow keys
  move between poems as a convenience, never as the only route.
- Open Graph tags are site-level on purpose. Routes are hashes, which never reach a
  server, so a crawler cannot tell which poem a link points at. Per-poem previews
  would need the pages pre-rendered as real files.
- Adding a poem: drop a markdown file in `poems/` and push. Filename sets order.
