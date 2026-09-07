# Notebook capitals — 7 September 2026

Twenty-one sampled capitals: A B C D E F G H I L M N O P Q R S T U W Y.
Generic fallback: J K V X Z. No lowercase j sample was added.

## References

The original photographs are archived locally in `asemic-hand/reference/2026-09-07/`.
They are study material and are not shipped as public site assets.

- `9EE3DD80-D7F8-49DC-A387-6835A9E158A8.JPG`,
  `4151B686-F51E-4CA3-9E33-C668ACCB54F6.JPG`,
  `384524DD-3DCF-4610-BF66-E2E32AD123A0.JPG`: overlapping views of The Scholar
  and the first title list. These are views of one page, not independent samples.
- `E7F7BB58-1188-4450-B2AE-6D932E61569F.JPG`,
  `6F639B68-14E3-49F2-9963-94DE5F100B00.JPG`: overlapping views of the second
  title page, which contains two passes of several titles.
- `56779ECF-3E19-49B0-8BAD-07ACA66ED1B5.JPG`: remaining titles, Goethe's line,
  and the repeated Ta/Ma/Ha/Da/Aa neighbour exercises.

## Method and limits

Reused the earlier dot detection, connected-component, homography and rendering
pipeline. JPEG orientation was applied before analysis. In the practice-pair
region, a robust homography retained 133 dots at 1.227px RMS reprojection error
on a 2000px-wide upright image. The study output uses 50px per grid interval.
This is a local perspective correction, not a global model of the curved page.

The control points in `asemic.js` are manual interpretations of the photographed
stroke paths, in the existing generator's units, not an automatic raster trace.
The seven frequent capitals have repeated neighbour evidence. Other letters use
one or more visible title/phrase examples and are less strongly sampled.

The practice pairs have smaller and more variable neighbours than flowing titles.
Do not treat the dot-grid fit as a measurement of a universal capital/x-height
ratio. `capHeight: 1.78` is retained; no ascender/descender profile was recalibrated.

## Shape decisions

- T's stem is left of centre, and its top reaches right. In continuing Th, the h
  becomes a low shoulder. Word-final Th retains the following h's ascender.
- M and W are rounded valleys. M exits low; W rises at the right. They are wider
  than the other capitals, and are deliberately not an angular printed M/W pair.
- A has a narrow apex and a low crossbar. H has hooked uprights and a low bridge.
- D keeps a short stem and an almost circular bowl. O is a broad, slightly open loop.
- I has unequal end bars. Its bottom bar, A's crossbar, and H's bridge may shorten
  according to the existing steady draw. This preserves abbreviation within a
  recognizable gesture instead of replacing every capital with one generic stem.
- Remaining shapes use the title/phrase evidence: P in Poems/Problem, B in
  Brahmanda, R in Reflexionen, C in Circling, G in Goethe, and so on.

## Validation

The existing vowel-confusion gate is unchanged. Three regression tests cover
capital dispatch, distinct frequent capitals, and complete uncut title rows.
A corpus check covers all 29 poems: 156 title-row/width combinations and 29 index
signatures. All fit; no title-row word was dropped. Full release validation runs
through `npm run verify`, including tests, production build, and site checks.

The user approved keeping the hand recognizable while words remain mostly
unreadable, and authorized publication to the existing site after validation.
