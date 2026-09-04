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
- **There are two hands, and `HAND` at the top of `asemic.js` picks one.** Change
  that one word to `plain` and every mark on the site goes back to what it was
  before the notebook photographs: forward lean, narrow, angular, lifting the pen
  on 45% of letters. It is not a reader's choice and has no interface. It exists
  because a hand can be more faithful and less beautiful at once, and that is a
  judgement to make by looking rather than by reading a diff. Everything the
  photographs changed lives in one profile per hand, `HANDS`, so the two can be
  compared honestly — including `units`, below.
- Six letterforms are **traced from the photographs** rather than described:
  `b` is a numeral 6 (the stem sweeps down and left and closes a bowl at the foot),
  `e` is a small flat angular epsilon whose crossbar comes first, `g` drops almost
  straight and turns left into a flat tail, `w` is two round valleys with a low
  middle and both ends rising, `s` is a round S, and **`th` can be one gesture** — a
  modest crossed stem and then a single low shoulder, the h losing its ascender
  entirely. The rest of the alphabet is still a description written from memory.
  This file once claimed all of it came from a sample. Only these six do.
- **r, v, x and z are traced, and the q's tail is fixed.** All four of the first
  were falling through to the hump branch and coming out as the same broad arch
  as an n, so *over*, *vixen* and *zigzagged* were written with no v, no x, no z
  and no r in them. From the 3 September sheet: the r is barely a letter, a short
  stem with a small arm; the v is angular where nearly everything else in this
  hand is round; the x is two crossed strokes; the z has a flat top and a flat
  foot. The q was drawing the generic descender, which hooks left at the bottom —
  on the page (*quiet*, *quarry* twice) the tail goes straight down and stops.
  There is no lowercase j anywhere on the sheet, so it is still described.
- **Punctuation and figures are their own marks.** Everything that was not a to
  z fell through to the hump branch, so every comma on the site was a small arch
  — and a full stop, a question mark and an em-dash were the *same* arch as each
  other, all three coming out 22 by 25 and indistinguishable. They have their own
  forms now, from the page: a comma is a tick under the line, a colon two marks,
  a question mark a hook standing over a dot, a bracket a tall thin curve, and
  the dash runs very long, nearer a strike-out than an em-rule — 73 wide against
  a letter's 22. The figures are described rather than traced; what the sheet
  supports is that the 1 has no flag on it and the 4 is open at the top.
- **Capitals are drawn.** Until 3 September every word was lowercased before it
  was drawn, so no capital had ever been rendered on this site, while the poet's
  page opens its sentences with T, J, M, N and F. A capital here is a treatment
  rather than a letter — taller, straighter, and lifted between its parts —
  because that is what tells a capital from a lowercase at a glance, and nothing
  in this hand spells anything. `capHeight` is **described, not traced**: on the
  page the M in *Monday* is plainly shorter than the d beside it and the N in
  *No* stands about half again the o, and that is the whole of the claim. It
  ships at 1.62 x-heights and is a dial so it can be moved by looking.
- **Measuring this hand letter by letter has now failed three times**, and the
  fourth attempt should not be made without a different method. Guessed column
  bands catch ascenders and descenders and give capital ratios from 0.72 to 1.38.
  Column-gap segmentation merges joined letters — sixteen components for
  twenty-four glyphs, one of them 414px wide with `Mond` fused into it. And
  steepest-edge detection on the row profile returns x-heights of 67, 142, 68 and
  18 pixels for four lines of the same hand. What would actually be needed is
  connected-component analysis that can cut touching glyphs. Until then the
  x-height, ascender and descender profile stays untrusted and nothing is tuned
  from it.
- **The t is not an ascender.** It stands about one and a half x-heights where h,
  l, d, b and k run to nearly three — `soft`, `Most`, `futures` and `Fantasy` all
  show it barely clearing the letters beside it. Drawing it at full ascender
  height is what made it read as a stem with a hump next to it rather than as a
  crossed stroke; the poet's own description is that their t is a regular t, or
  at speed closer to a plus. The bar crosses high on that short stem, overshoots
  both sides and tilts up to the right.
- **The crossbar is joined to the stem, not laid across it.** The pen reaches
  the foot, runs back up the stem it just drew, and goes straight out into the
  bar without leaving the page. `futures` on the first page is the clearest
  instance and `soft` carries one bar across both the f and the t; the writing
  test of 3 September bears it out across *little*, *attempts*, *still* and
  *flat*. It was one time in three while the shape was being chosen; the poet
  picked the always-joined form off a sheet of six, and `tJoin` is the dial. A joined bar doubles the upper stem and meets it at a junction instead of a
  crossing, which is most of why a written t does not look drawn.
- **The `th` shoulder is a *connecting* stroke and only happens when the h has
  somewhere to go.** Of the seven `th` on the photographed page, the five that run on
  into another letter are all flattened this way — *the*, *that*, *father* — and the
  two that end their word are not: both spellings of *with* keep a full ascender on
  the h, because there is nothing after it to reach for. A word-final `th` is
  therefore never ligatured. How often it happens when it *can* is `ligature`, and
  that number is a taste setting rather than a measurement — the page says almost
  always, the poet says their hand humps less often than that, and on seven samples
  their eye is the better evidence. It ships at 0.3, and the shoulder itself was
  flattened from 0.86-0.98 of the x-height to 0.60-0.68 — at the old height it
  was a full arch and read as a hump rather than as a sweep between two letters.
- **A traced form is what the hand reaches for, not what it always lands on**
  (`steady`). Drawing all six every time made the writing *readable*, which is the
  one thing it must not be — the `e` stopped colliding with the `o`, "the" arrived
  as a shape a reader knows, and whole sentences came back. Rendering each letter
  many times and comparing the shapes, confusable pairs fell from 10 in 190 to 5.
  At `steady` 0.55 that count is exactly what it was before; it ships at 0.45. A
  test holds the `e`/`o` collision in place, and it is the gate that matters:
  isolated words resolving is normal and always has been, a readable sentence is a
  failure.
- Letters **bounce individually** on the baseline, not only line by line, and the
  notebook hand keeps the pen down — it lifts on 16% of letters where the plain one
  lifts on 45%, because a real word runs together.
- **The painter reads the points as curves.** The generator lays down points that
  describe curves, and joining them with straight lines is what made a hand of curves
  come out as a hand of angles — every shoulder arrived as a corner. `drawStroke()`
  now runs a quadratic between the midpoints of each pair of segments, with the point
  they share as its control. The generator is untouched. A quadratic stays inside the
  triangle of its own control points, so a mark still cannot leave the box its points
  sat in, and the single-line regression test holds by construction.
- **The lean is backward.** A flat-on photograph of the notebook (2 September 2026),
  rectified against the page's own printed dot grid and checked by the line pitch
  landing on exactly two 5mm squares, reads **−1.15°**. The site leaned forward
  +3.1° for as long as it existed; `slant` is now −0.06.
- **The page furniture.** A notebook is full of second thoughts, so the columns now
  carry them: a word struck out as a tight scribbled blob rather than ruled through,
  a caret with the word it wants squeezed in small above the line, a number ringed
  in the left margin, and an arrow at the foot carrying the sentence over. It is
  held back from a single-line mark — a row signature is twenty-six pixels tall and
  a strike-out on it is a smudge. The plain hand has none of it.
- **`lineUnits()` is a model of the hand's width and does not track the constants.**
  Its coefficients live on each hand as `units`, measured by least squares over the
  whole corpus. **Re-measure whenever a glyph's advance moves.** It went stale once
  already: the width constants moved, this did not, and `fitSize()` went on sizing
  for the old narrow hand. Nothing failed — no test, no build — and every index
  signature was drawn a third too large and clipped. It was only visible in a
  browser. A single line also keeps more of its width margin (0.92, not 0.96) than
  a column does, because it has no wrap to save it.
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
- **The pen rests unevenly.** Beyond the letter, word and line boundaries, a
  hand comes off the end of a stanza and does not start the next one at once,
  and now and then it stops mid-line for no reason the page records. Neither is
  common: about a third of stanza breaks are rested on, and one word gap in
  forty is caught. A pause that arrives on schedule is a rhythm rather than a
  hesitation and stops reading as a person. Which ones happen is drawn from the
  poem's own seed, so a mark hesitates in the same places for every reader. The
  cost is about a second on a half-minute column, and since the caller
  compresses a column it is the proportions that survive, not the seconds.
- A ResizeObserver reports the size it starts with. `AsemicMarks.vue` therefore
  redraws on resize only when the canvas has really changed size — otherwise every
  write-on was cut off a fraction of a second in. Theme changes still repaint
  unconditionally. A hidden tab is drawn finished rather than animated, because its
  frames do not run.
- On a poem page the **reader holds the pen**: the marks are written in step with how
  far down the verse the page is scrolled, starting part-written so a short poem is
  never a blank column. An audio reading takes the pen back the moment one starts.
- **`temper` is one dial on the hand, from −1 to +1, and it is now measured.**
  The writing test of 3 September had the same four lines written twice, once at
  an ordinary pace and once as fast as the poet could go. The ink stands 4 to 15%
  taller in every pair, mean 11%, and the gaps between words close up — seven
  became five on one line, seven became four on another. Those two are modelled.
  The lines also read 4 to 14% narrower *for their height*, but that is the same
  finding restated: the absolute widths are 1481/1475, 1473/1473, 1490/1465,
  1477/1469, constant inside two percent. The hand grows taller at the width it
  already had, and that width is partly the notebook's margins, so narrowing the
  letters as well would be modelling the page. One thing here was wrong rather
  than missing: it lifted the pen **more** when hurrying, on the reasoning that
  haste is untidy. Haste joins letters up, and the gap counts say so. Below zero
  the hand is still slow and careful — steadier, more upright, more ink, and a
  write-on taking nearly twice as long — and zero is still the only value
  `verify-site.js` knows about, so signatures stay deterministic.
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

- **The plate fades while the poem is read.** Five minutes from arrival to
  nothing, on a poem page only — the index keeps its collage, because a reader is
  passing through the index rather than sitting with it. A reload brings it back,
  so it belongs to the sitting and nothing is remembered about the reader. The
  curve is an ease-in, not a straight ramp: a linear opacity fade reads as
  fast-then-lingering, and the first minute here should be impossible to catch
  happening — it is still at 0.97 after sixty seconds, 0.83 at two and a half
  minutes, 0.48 at four. It is a CSS animation rather than a redraw, so it costs
  nothing over the five minutes, and it is **paused whenever the tab is hidden**,
  so a poem left open in a background tab is still there on return. Two traps:
  moving between poems does not remount the collage, so the fade has to be
  restarted by hand or the second poem inherits the first one's spent animation
  and arrives invisible; and `prefers-reduced-motion` turns it off, because a
  reader asking for less movement is not asking for a five minute dissolve.
  **What the fade leaves behind is the four words, and nothing else.** It does
  not run on the figure — opacity multiplies, and a child cannot climb back out
  of a parent at zero — so every layer is faded on its own, and the plate's frame
  with them: border and ground to transparent, and the wedge of ground moved off
  the figure onto `::before` so it can go too, since a gradient is not
  interpolable and would otherwise flip at the halfway mark and leave a rectangle
  standing where the plate had been. The paper veil on `::after` fades with it.
  `.catalogue` is the one child left out, and `MB / NN` is faded back in on its
  own, so the identifier goes the way of the picture. The keyframe has no `from`
  on purpose: an explicit one would snap every sheet to full opacity before
  starting, where an implicit one starts each layer from wherever it already sat.
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
- **A photograph is not always cut to a torn rectangle.** `deckle()` varies the
  tear beautifully but never the shape under it, so twenty-one plates rhymed
  harder than they should have. `crop()` in `marginalia.js` gives the image
  sheets one of five shapes, each from a particular moment: a **Braque**
  quadrilateral with no two sides parallel and one edge held square to the frame
  (papier collé, 1912-14); a **Schwitters** band of extreme proportion laid at an
  angle and run off both ends (Merz, 1919-); a **Matisse** sweep of three or four
  swells with no straight edge in it (the cut-outs, 1947-54); a **Villeglé** bite
  that opens a sheet so the one beneath shows through (décollage, 1949-60s); and
  a **Bearden** seam, where two photographs abut along one shared tear instead of
  overlapping (1964-). The house tear is still the commonest. One family to a
  poem, fixed to it forever, so a plate is one idea rather than a sampler — and
  the ground, the hand's sheets and the large hand stay torn whatever the
  photographs do, because they are the paper and not the picture.
  Two things learned by looking rather than by reasoning: the arcs must have a
  **wide** spread of reach over **few** lobes, or every plate comes out a circle,
  and a porthole is a different idea from a piece of cut paper; and the bite is a
  share of an outline rather than a count of its points, since a fixed handful is
  a deep bite out of a quadrilateral and nothing at all out of a torn edge
  carrying forty. A band is never bitten — it is thin by construction, and
  pulling its outline toward the middle severs it rather than opening it.
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

They are set apart by space rather than by middots, in both places. They appear
twice over: recessed beside the identifier in the index collage, and
fainter still in the poem page's left margin, with no label and no heading.
Each poem page carries **exactly one** set, but which element holds it depends on
the width. Above 860px the margin has them and the collage keeps only its
`MB / NN` identifier. There is no margin on a phone — the meta block sits in the
reading flow above the verse — so the words arrived as a third heading between
the provenance and the poem; below 860px the collage takes them the way the index
does and the margin gives them up. The swap is a media query in both files, not a
reactive breakpoint, so a pre-rendered shell cannot flash the wrong one. The words
never touch the verse.

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
