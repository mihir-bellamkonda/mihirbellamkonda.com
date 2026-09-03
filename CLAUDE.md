# CLAUDE.md

Guidance for Claude Code working in this repository.

## Project

The poetry site of **Mihir Bellamkonda** (pronouns **they/them** — not he/him; their
published bios use "they"). Live at **https://mihirbellamkonda.com**.

It is a **record**, not a themed collection: a numbered index of poems with venue
and year. Most are published; six are not, and say so where a venue would go. Vue 3 SPA, Vite, real URLs at `/poem/<title>/` with
legacy `#poem/<slug>` links still honoured, markdown poems compiled to JSON at build
time, deployed to GitHub Pages by GitHub Actions.

## Rules that are not negotiable

1. **No line of a poem may be modified.** No coloured lines, no drop caps, no size
   changes, no auto-shrinking. Every line is set identically. Emphasis in a source
   file is the poet's own and stays — the rule is *add nothing here*, not strip what
   they wrote. Emphasis is marked in the markdown, never invented by a component:
   - `*italic*` for **dialogue** — words spoken aloud, always italic and never in
     quotation marks. Only speech reported inside a narrating voice is marked; a
     poem spoken end to end (The Carpenter, The Economy, New Orleans) stays roman,
     because italicising it would italicise the whole poem. *Questions and Answers*
     keeps its roman question against its italic answer; that contrast is the poem.
   - `**bold**` for a **section header** — `1. Father`, `2. Son`, `1. River`.
     Spectral is self-hosted at 200/300/400 only, so `.verse strong` is 400 against
     the 300 body: a real weight rather than a synthesised bold.
2. **Do not use the word "plates"** anywhere user-facing. Numbers only: `01 / 18`.
3. **No explanatory captions.** The index has no heading and no introductory
   sentence. It gets space instead.
4. The site accent is **dark green**, never rust or red. The asemic inks are a
   separate palette: green recurs like an annotation, rust interrupts it now and then,
   navy is rarer than either, and that order of frequency is fixed.

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
scripts/build-poems.js            markdown -> src/poems.json (slug, path, url)
scripts/build-pages.js            static HTML shell per poem + sitemap.xml
src/asemic.js                     the mark generator
src/App.vue                       routing: /poem/<path>/, #index, legacy #poem/<slug>
src/components/
  AboutPage.vue                   opening: name, bio, link in
  PoemsListPage.vue               the index
  PoemPage.vue                    one poem
  AsemicMarks.vue                 canvas wrapper around asemic.js
  SpecimenCollage.vue             the folio: sheets, imagery, returned title
  SpecimenVocabulary.vue          a poem's four words, in the margin
  FooterNav.vue                   the dark band
src/collage-studies.js            which found material sits under which poem
src/specimen-vocabulary.js        the curated four words per poem
src/style.css                     design tokens only
scripts/prepare-plate.js          a found photograph -> a plate, in the house treatment
scripts/verify-site.js            production checks; `npm run verify`
public/collage/                   collage imagery, with sources and rights
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
catalogue: 19                        # optional, see below
---

The poem. Blank lines separate stanzas.
*Emphasis is the poet's own* and may span line breaks.
```

**The catalogue number is not the position.** The margin number (`01 / 21`) is where
a poem sits in the book and changes whenever the order does. The plate's `MB / NN` is
the number it was accessioned under and should not. It defaults to the digits the
filename starts with; a poem that moves to a different place in the book keeps its
number by naming `catalogue:` in the front matter. The Carpenter is first in the book
and MB / 19 on its plate.

**Capitalisation.** A line begins with a capital only when it begins a sentence.
A line that continues a sentence — across a line break or a stanza break — starts
lowercase. `I` and proper nouns keep their capitals wherever they fall, and a line
after a `**section header**` starts a sentence. The house style was applied across
the book in 2026; if a poem arrives capitalised line by line, ask before changing it,
because it is the poet's text and only they standardise it.

`build-poems.js` emits a `stanzas` array: stanzas of lines, each line a complete HTML
fragment. Emphasis is tracked **across the whole stanza** and closed and reopened at
each line break, because their italics often span several lines. Parsing line by line
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
- **The write-on is a hand, not a wipe.** `writingPlan()` measures the marks as one
  journey in *time* and `paintProgress()` draws to a point along it, part-way into a
  stroke if that is where the pen is. Revealing whole strokes in sequence, which is
  what it used to do, reads as a slide across the page. Three things make the rest of
  the difference between a path and a hand: a corner costs more than a straight run
  (`TURN_COST`), a pen lift costs a beat (`LIFT_DWELL`), and a lift that reaches for
  the next word costs several (`REACH_DWELL`). About 45% of the journey is corners and
  hesitation. Duration comes from the length of the writing (`PEN_SPEED`), so a whole
  poem takes five or six seconds and a single line takes one or two — a column written
  in three was the reason it still felt mechanical after the first fix.
- A ResizeObserver reports the size it starts with. `AsemicMarks.vue` therefore
  redraws on resize only when the canvas has really changed size — otherwise every
  write-on was cut off a fraction of a second in. Theme changes still repaint
  unconditionally. A hidden tab is drawn finished rather than animated, because its
  frames do not run.
- On a poem page the **reader holds the pen**: the marks are written in step with how
  far down the verse the page is scrolled, starting part-written so a short poem is
  never a blank column. An audio reading takes the pen back the moment one starts.
- `temper` is one dial on the hand, from −1 to +1. Below zero it is slow and careful:
  steadier baseline, more upright, keeping the pen down, more ink, and a write-on that
  takes nearly twice as long. Above zero it hurries. Zero is the ordinary hand and the
  only value `verify-site.js` knows about, so signatures stay deterministic.
- One poem per session, chosen in `src/slow-hand.js` and held in `sessionStorage`, is
  written slowly — its collage *and* its row signature on the index, which is where a
  reader is most likely to catch it. It is never announced, and the choice never
  changes mid-visit. An earlier version of this hurried instead; nobody could see it.

## The folio

Beside the index, and on every poem page, `SpecimenCollage.vue` lays a few
sheets over one another: a ground, one quiet photograph, one sparse drawn
fragment, and the asemic hand. `src/collage-studies.js` says which material
belongs to which poem — one photograph each, and six drawn marks shared across
the corpus, so the folio stays one thing rather than a set of separate decorations. Moving the pointer shifts the layers and
their crops; pressing parts them, the way paper comes apart in the hand.
Hovering or focusing an index title returns that poem's title to the collage as
a small found label at the lower right. On the index the collage is also a link
to that poem — `tabindex="-1"` inside the aria-hidden aside, because it repeats
the row's own link and should not be announced or tabbed to twice. A press that
lingers past 400ms or travels more than 8px is the layer-separating gesture, not
a click, and does not navigate.

- The imagery must **recede**. Large calm tonal areas, few edges, nothing
  captioned or labelled, nothing that reads as a second headline. Fragments end
  by dissolving through a gradient mask, not on a hard border.
- Composition is fixed to **cut-up** in `SpecimenCollage.vue`; the `folio` rules
  are kept in the stylesheet so the other crop is one word away.
- Composition rules live on the `<figure class="specimen">` as
  `data-composition` and are scoped `.specimen[data-composition='cutup'] …`.
  **Never** hang them off a root selector: a `clip-path` written that way once
  compiled onto `html` and clipped the whole page into a circle.
- `kind` decides how a photograph meets its panel: a `field` is a tonal expanse
  and fills the crop (aimed by `focus`, which becomes `--focus`), a `form` is a
  single shape that needs the space around it and is contained, not cropped.
- Sources and rights for everything in `public/collage/` are recorded in its
  own README. Public domain or CC0 only, and every plate is cropped away from
  its mount and caption before it is used.
- **Prepare a new plate with the script, not by eye.**
  `node scripts/prepare-plate.js <source> <name> [--crop l,t,w,h] [--negate]`
  crops, greys, settles the tone onto the library's range and applies the house
  feather. `npm run verify` then checks the result against the same standard —
  the plate exists, it has a feathered edge, its tone is inside the range, and it
  has enough variation to be a picture. All three failures have happened: a plate
  went up with no feather and read as a hard rectangle; another was 97%
  featureless; and a study once named a file that did not exist, which nothing
  caught until it 404'd in a browser.
- Tone is measured **inside the feather**. Measuring the whole file measures the
  transparent border, which is dark, and every reading comes out wrong.
- A pale subject on a dark plate has to be **inverted**: `multiply` against the
  bone ground keeps the black and throws away the mark.
- **Every sheet is torn differently.** `src/marginalia.js` generates each layer's
  `clip-path` and tilt from the poem's own seed and hands them to the figure as
  `--clip-*` and `--spin-*` custom properties. `deckle()` works in two passes: corners
  taken off at their own angles, which is what one plate has that the next does not at
  arm's length, then a fine tear stepped along every side. Fixed polygons in the
  stylesheet were the old arrangement and made twenty-one poems one sheet.
- Two rules keep a tear a tear. **A cut corner must give up the vertex the clockwise
  walk arrives at before the one it leaves by** — the other order folds the outline
  through itself and the sheet comes out pinched, like a sweet wrapper. And **no two
  cut corners may share a side**, or the edge between them is a pinch by construction.
  A short edge is also torn more shallowly than a long one, so the tear cannot cross
  the next edge and leave a spike.
- The large hand's sheet is left **untorn on one side**, so that line runs off the
  paper and is cut by the frame instead of stopping at an edge.
- One **pencil mark** to a plate, meaning nothing: an arrow pointing at nothing, a
  scrawl, a wound loop, or a crooked little x, chosen by the poem's seed. And the date
  the poem was written in the corner — roman month, two-figure year, from the front
  matter.
- A resting pointer is **pressure**: the hand comes up about fifteen percent over half
  a second and lets go as slowly. Hover only, so a tap does not leave a phone's plate
  stuck at its darkest. These rules sit after the composition rules and before the
  handling ones, so pressing still overrules hovering.

## Unpublished poems

`unpublished: true` in the frontmatter puts the word *unpublished* where a venue
would go on the index, and prints `unpublished 2025` on the poem page instead of
`first published`. `verify-site.js` fails if such a poem also names a venue or a
venue URL, or if it has no date — the year is the only provenance it has.

The index previews the first line of **verse**, skipping a leading section
header, so Dallas shows its first line rather than `1. Father`.

The rules between index rows are **drawn, not declared** — `DrawnRule.vue` over
`ruleMarks()`, one seeded line per row, allowed to wobble, to lift once, and to
overrun its end. They straddle the row edge rather than bounding a box. Print falls
back to a real border, because paper takes a printed rule better than a drawn one.

## The name page

The opening carries one word of asemic writing in its lower right, drawn at random
from the eighty-four the poems have already given up in `specimen-vocabulary.js`. It
is the one mark on the site that is *not* fixed per reader: the choosing is random,
the writing is not — the same word always comes out in the same hand. The rule about
seeding from the slug is about a poem's own signature and does not reach here.

## The four words

Every poem has four exact words from its own body — one field word and three
coordinates — curated in `src/specimen-vocabulary.js`. None may appear in the
poem's title. `npm run verify` fails if a word is missing from the body, occurs
in the title, repeats, or if a poem has no set.

They appear twice over: recessed beside the identifier in the index collage, and
fainter still in the poem page's left margin, with no label and no heading.
Each poem page carries **exactly one** set — the collaged pages keep their
`MB / NN` identifier and give their words up to the margin. The words never
touch the verse.

## Notes

- Navigation is ordinary links with real URLs. The card stack is not coming back: it
  hid the index behind a gesture and had no way back that wasn't a swipe. Arrow keys
  move between poems as a convenience, never as the only route, and a focused control
  keeps its own arrow keys.
- A **thumb swipe** between poems lives on the poem page (`PoemPage.vue`), on top of
  that arrangement rather than in place of it: touch pointers only, 64px of mostly
  horizontal travel, and a gesture that starts on the collage belongs to the collage.
  Left is the next poem, right the previous.
- The line that says the arrow keys work is remembered in `localStorage` and stops
  appearing once a reader has used them twice.
- Open Graph tags are per-poem. `npm run build` runs three stages: `build-poems.js`,
  then Vite, then `build-pages.js`, which emits one static HTML shell per poem — its
  own title, description, OG and Twitter fields, and a single canonical link — plus a
  `sitemap.xml` covering the homepage and every poem. The Vue app still renders the
  visible poem; the shell exists so crawlers and unfurlers read the right metadata
  before JavaScript runs.
- Adding a poem: drop a markdown file in `poems/` and push. Filename sets order. The
  build fails if a title yields an empty or duplicate public path.
