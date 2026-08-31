# mihirbellamkonda.com

Mihir Bellamkonda's publication record: a numbered index of published poems,
their first venues, and full reading pages. The site is a Vue 3 application
built with Vite and published to GitHub Pages from `trunk`.

## Work locally

Requires Node.js 20 or later.

```bash
npm ci
npm run dev
```

Useful commands:

```bash
npm run poems       # compile poems/*.md into src/poems.json
npm run build       # build the app and generated poem pages
npm run verify      # build plus release-integrity checks
npm run check:links # check the current publication links
npm run preview     # serve dist/ locally
```

`src/poems.json` and `dist/` are generated and ignored. Do not edit or commit
either one.

## Add a poem

Create a Markdown file in `poems/`. Its filename sets its position in the
index.

```markdown
---
title: "Poem Title"
subtitle: "For L.H."                 # optional
date: 2026-08-31
published_in: "Magazine Name"        # optional
external_url: "https://example.com"  # optional
---

First line
Second line

Second stanza
```

Blank lines divide stanzas. Single line breaks are preserved. Asterisks carry
the poet's own emphasis; do not add typographic emphasis in the application.

Run `npm run verify` before committing. The verifier checks source and rendered
line counts, public paths, static reading copies, metadata, sitemap coverage,
venue URL syntax, and deterministic asemic signatures.

## How pages are made

1. `scripts/build-poems.js` reads the Markdown sources and writes structured
   poem data.
2. Vite builds the Vue application into `dist/`.
3. `scripts/build-pages.js` creates a real HTML page for every poem, including
   its canonical metadata, CreativeWork JSON-LD, and a complete no-JavaScript
   reading copy. It also writes `sitemap.xml`.

The visible application uses real URLs at `/poem/<title>/`. Legacy
`#poem/<slug>` links remain supported.

## Design and content rules

- Never alter a line of a poem or style one line differently from another.
- Do not use “plates” in reader-facing copy.
- Keep the index uncaptioned; it explains itself.
- The accent is dark green, never rust or red.
- Keep `public/CNAME` and Vite's `/` base path intact.
- Asemic marks are canvas-rendered, poem-shaped, seeded, and deterministic.

The full implementation notes live in `CLAUDE.md`. The release and device
checklist is in [`docs/qa-matrix.md`](docs/qa-matrix.md).

## Publishing

Pushing `trunk` starts `.github/workflows/deploy.yml`. The workflow installs
locked dependencies, runs the complete verification gate, uploads `dist/`, and
publishes it through GitHub Pages. A separate weekly workflow checks whether
external publication links have gone missing.
