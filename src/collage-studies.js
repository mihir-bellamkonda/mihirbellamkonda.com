/**
 * Which found material sits under which poem.
 *
 * Every fragment is a public-domain photograph cropped away from its mount and
 * flattened until it reads as weather rather than as illustration; sources and
 * rights are recorded in public/collage/README.md. The drawn fragments are a
 * deliberately small shared set — six marks across fifteen poems — so the folio
 * stays one thing rather than fifteen separate decorations.
 *
 * `kind` decides how the photograph meets its panel: a `field` is a tonal
 * expanse and fills the crop, a `form` is a single shape that needs the space
 * around it. `focus` is the object-position for a field.
 */
const studies = {
  'the-gesture': {
    kind: 'field', focus: '50% 56%',
    primary: '/collage/sky-study.webp', secondary: '/collage/hatch-field.svg'
  },
  summer: {
    kind: 'field', focus: '50% 60%',
    primary: '/collage/creek-bank.webp', secondary: '/collage/pulse-trace.svg'
  },
  'thuragnosia-parable-of-the-man-blind-to-doors': {
    kind: 'field', focus: '50% 44%',
    primary: '/collage/abbey-arch.webp', secondary: '/collage/plumb-lines.svg'
  },
  'questions-and-answers': {
    kind: 'field', focus: '50% 62%',
    primary: '/collage/reflected-trees.webp', secondary: '/collage/ripple-rings.svg'
  },
  'the-dinner-party': {
    kind: 'field', focus: '46% 50%',
    primary: '/collage/open-door.webp', secondary: '/collage/plumb-lines.svg'
  },
  'mother-dreams-in-half-light': {
    kind: 'form',
    primary: '/collage/night-fountain.webp', secondary: '/collage/hatch-field.svg'
  },
  'in-of': {
    kind: 'field', focus: '50% 66%',
    primary: '/collage/cliffs-bay.webp', secondary: '/collage/ripple-rings.svg'
  },
  mercy: {
    kind: 'field', focus: '50% 54%',
    primary: '/collage/winter-stand.webp', secondary: '/collage/pulse-trace.svg'
  },
  'up-above-my-head-i-hear-music-in-the-air': {
    kind: 'form',
    primary: '/collage/leaf-drawing.webp', secondary: '/collage/hatch-field.svg'
  },
  dallas: {
    kind: 'field', focus: '54% 46%',
    primary: '/collage/burnt-terrain.webp', secondary: '/collage/plumb-lines.svg'
  },
  'new-orleans': {
    kind: 'field', focus: '50% 54%',
    primary: '/collage/river-flood.webp', secondary: '/collage/strata-contours.svg'
  },
  'circling-figures': {
    kind: 'form',
    primary: '/collage/lightning-spiral.webp', secondary: '/collage/orbit-trace.svg'
  },
  'the-horse': {
    kind: 'field', focus: '50% 48%',
    primary: '/collage/horse-flank.webp', secondary: '/collage/pulse-trace.svg'
  },
  brahmanda: {
    kind: 'form',
    primary: '/collage/lunar-disc.webp', secondary: '/collage/orbit-trace.svg'
  },
  'a-quiet-family': {
    kind: 'field', focus: '58% 44%',
    primary: '/collage/eroded-strata.webp', secondary: '/collage/strata-contours.svg'
  }
};

export function studyFor(path) {
  return studies[path] || null;
}

export default studies;
