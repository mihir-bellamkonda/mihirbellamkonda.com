/**
 * Asemic writing — marks with the shape of writing and no words in them.
 *
 * Every mark on the site is generated from a real poem's line and word
 * structure, so the illegible column beside a poem is genuinely a poem,
 * rendered unreadable. It is seeded from a string, which means a poem's
 * signature is identical on every load, for every reader, forever. It
 * belongs to the poem rather than to the visit.
 *
 * The letterforms are loose print-cursive: open bowls and broad humps, short
 * upright ascenders, long hooked descenders, high dots, frequent pen lifts,
 * crossbars that overshoot, and a fine line with responsive pressure. They are
 * a description of Mihir's hand rather than a tracing of it — nothing here is
 * derived from a sample, whatever earlier versions of this comment claimed.
 */

/**
 * Two hands, and a way back.
 *
 * `notebook` is the hand as the photographs have it. The lean is backward:
 * a flat-on photograph rectified against the page's own printed dot grid
 * reads -1.15deg, and the estimator that found it recovered every lean on a
 * synthetic test card exactly. `slant` was +0.055 — a forward lean — for as
 * long as the site existed, so every mark leaned the opposite way from the
 * hand it stood in for. The hand is also wide: trimmed to the ink and matched
 * for height, the notebook's words run 10-38% broader than the generator's.
 * Width alone bottoms that error at about 14% and no further, and `traced`
 * covers the rest — the six letterforms taken off the page rather than
 * described from memory.
 *
 * `plain` is the hand the site had before any of that. Faithful and beautiful
 * are different axes, and until now the only way back was git.
 */
/**
 * Which hand the site writes in.
 *
 * Change this one word to `plain` and every mark on the site — signatures,
 * columns, the name page, the folio — goes back to what it was before the
 * notebook photographs. That is the whole switch; there is no interface for it
 * and it is not meant to be a reader's choice. It exists because the only way
 * back used to be git, and because a hand can be more faithful and less
 * beautiful at the same time, which is a judgement the poet should be able to
 * make by looking rather than by reasoning about a diff.
 */
const HAND = 'notebook';

const HANDS = {
  notebook: {
    slant: -0.06, wide: 1.35, gap: 1.8, lift: 0.16, bounce: 1, steady: 0.35,
    ligature: 0.5, tJoin: 1, capHeight: 1.62, traced: true, curve: true, furniture: true, units: [0.555, 0.901]
  },
  plain: {
    slant: 0.055, wide: 1, gap: 1, lift: 0.45, bounce: 0, steady: 0,
    ligature: 0, tJoin: 0, capHeight: 0, traced: false, curve: false, furniture: false, units: [0.422, 0.863]
  }
};

const RARE = new Set('rvxzq');
const PUNCTUATION = /[.,:;!?()[\]'\u2019"\u201c\u201d\u2013\u2014-]/;
const ASCENDERS = new Set('lhkbdtf');
const DESCENDERS = new Set('gypjq');
const BOWLS = new Set('aoec');
const HUMPS = new Set('nmuw');
// Green recurs like an annotation; rust interrupts it now and then, and navy
// is rarer than either. The order of that frequency is fixed.
const ACCENT_INKS = ['green', 'green', 'green', 'green', 'green', 'rust', 'rust', 'navy'];

/** Deterministic PRNG seeded from a string. */
export function rngFor(seed) {
  let h = 1779033703 ^ String(seed).length;
  for (let i = 0; i < String(seed).length; i++) {
    h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let s = (Math.imul(h ^ (h >>> 16), 2246822507) ^ h) >>> 0;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** One word: the motion a hand makes writing it, with no letters in it. */
function wordMark(x, y, word, size, R, hand) {
  const strokes = [];
  const pen = hand.pen;
  let cur = [];
  let cx = x;

  // A hurried hand is taller and narrower, and runs its letters together.
  //
  // Measured off the writing test of 3 September, where the same four lines
  // were written twice, once at an ordinary pace and once as fast as the poet
  // could go. The ink stands 4 to 15% taller in every pair, mean 11%, and the
  // gaps between words close up: seven became five on one line and seven
  // became four on another.
  //
  // Only those two are modelled. The lines also read 4 to 14% narrower *for
  // their height*, but that is the same finding twice over rather than a second
  // one — recovering the absolute widths gives 1481 against 1475, 1473 against
  // 1473, 1490 against 1465, 1477 against 1469, which is constant inside two
  // percent. The hand grows taller at the width it already had. And that
  // constant width is partly the notebook's margins rather than the hand, so
  // narrowing the letters as well would be modelling the page.
  //
  // The one thing here that was wrong rather than missing: it lifted the pen
  // *more* when hurrying, on the reasoning that haste is untidy. Haste joins
  // letters up rather than chopping them apart, and the gap counts say so.
  const tall = 1 + hand.temper * 0.11;
  const wide = pen.wide;
  const xh = size * 0.52 * tall;
  const asc = size * 0.98 * tall;
  const desc = size * 0.78 * tall;
  // The case is kept now. Every word used to be lowercased before it was
  // drawn, which meant no capital had ever been rendered on this site — and
  // the poet's page opens its sentences with T, J, M, N and F.
  const glyphs = Array.from(String(word || ''));
  if (!glyphs.length) glyphs.push(' ');

  const lift = () => {
    if (cur.length > 1) strokes.push(cur);
    cur = [];
  };
  // Temper is the same hand at a different speed. Above zero it is hurrying:
  // wandering further, lifting more, leaning harder. Below zero it is taking
  // its time, and a slow pen is steadier and leaves more ink.
  const wander = 1 + (hand.temper >= 0 ? hand.temper * 1.8 : hand.temper * 0.55);
  const to = (px, py) => {
    // A hand wanders; it does not teleport independently at every point.
    // Keep that wander proportional to the letter size so the same hand does
    // not become shakier merely because its canvas is smaller.
    hand.dx = hand.dx * 0.88 + (R() - 0.5) * size * 0.018 * wander;
    hand.dy = hand.dy * 0.86 + (R() - 0.5) * size * 0.05 * wander;
    const lineY = py + hand.slope * (px - hand.startX);
    const yy = lineY + hand.dy + hand.bounce;
    cur.push([px + hand.dx + (y - yy) * hand.slant, yy]);
  };

  // Height above the baseline, rather than a y coordinate: the punctuation
  // forms are all written as heights and this keeps them readable.
  const to0 = (px, up) => to(px, y - up);

  const dot = (px, py) => {
    lift();
    to(px, py);
    to(px + size * 0.035, py - size * 0.012);
    lift();
  };

  for (let gi = 0; gi < glyphs.length; gi++) {
    const raw = glyphs[gi];
    const upper = raw !== raw.toLowerCase() && raw === raw.toUpperCase();
    const char = raw.toLowerCase();
    const isAscender = ASCENDERS.has(char);
    const isDescender = DESCENDERS.has(char);
    const h = xh * (0.88 + R() * 0.22);

    // Whether the hand makes this letter its own way this time.
    //
    // Drawing all six traced forms every time made the writing readable, which
    // is the one thing it must not be. What kept this hand illegible was never
    // bad letterforms — it was letters landing on top of one another, and the
    // e landing on the o most of all. Giving six letters their true shapes
    // pulled them apart: rendering each letter twenty-six times and comparing
    // the shapes, confusable pairs fell from 10 of 190 to 5, and sentences came
    // back off the page. At 0.55 that count is exactly what it was before, and
    // this sits below it. So the traced form is what the hand reaches for
    // rather than what it always lands on — which is also the truer account of
    // the notebook, where no letter is made the same way twice.
    const traces = pen.traced && R() < pen.steady;

    // Letters bounce individually on the baseline, not only line by line —
    // a run of them wanders up and down within a word that is itself sitting
    // straight. It is a slow walk rather than a jitter, so each letter starts
    // near where the one before it sat.
    hand.bounce = clamp(
      hand.bounce * 0.55 + (R() - 0.5) * size * 0.08 * pen.bounce,
      -size * 0.09,
      size * 0.09
    );

    // "the" is one continuous gesture with no letters in it. The t keeps a
    // modest stem, nothing like a full ascender, its crossbar overshoots on
    // both sides, and the h behind it is reduced to a single low shoulder —
    // it loses its ascender entirely. This is the hand already asemic at speed.
    //
    // But only when the h has somewhere to go. The shoulder is a *connecting*
    // stroke: of the seven `th` on the photographed page, the five that run on
    // into another letter are all flattened this way — the, that, father — and
    // the two that end their word are not. Both spellings of `with` keep a full
    // ascender on the h, because there is nothing after it to reach for.
    //
    // `ligature` is then how often it happens when it can. The page says almost
    // always; the poet says their hand is humped less often than that, and on
    // seven samples their eye is better evidence than the count. It is a taste
    // setting, deliberately below what the photograph alone would support.
    const joinsOn = gi + 2 < glyphs.length;
    if (pen.traced && char === 't' && glyphs[gi + 1] === 'h' && joinsOn && R() < pen.ligature) {
      const w = size * (0.3 + R() * 0.05) * wide;
      const stem = xh * (1.44 + R() * 0.22);
      to(cx + w * 0.26, y - stem);
      to(cx + w * 0.36, y - h * 0.44);
      to(cx + w * 0.46, y - h * 0.06);
      to(cx + w * 0.68, y - h * 0.46);
      to(cx + w * 0.98, y - h * (0.6 + R() * 0.08));
      to(cx + w * 1.24, y - h * 0.34);
      to(cx + w * 1.34, y - h * 0.06);
      lift();
      to(cx - w * (0.12 + R() * 0.14), y - stem * 0.56);
      to(cx + w * (0.74 + R() * 0.18), y - stem * (0.57 + R() * 0.07));
      lift();
      cx += w * 1.5;
      gi++;
      if (R() < Math.max(0.02, pen.lift - hand.temper * 0.09)) lift();
      cx += size * (0.035 + R() * 0.065) * pen.gap;
      continue;
    }

    // r, v, x and z, which were arches until now, and q, whose tail was wrong.
    //
    // All four of the first were falling through to the hump branch and being
    // drawn as the same broad arch as an n — so `over`, `vixen` and `zigzagged`
    // were written with no v, no x, no z and no r in them, only humps. They come
    // off the writing test of 3 September, which was asked for precisely because
    // none of these had ever been seen: the r is barely a letter, a short stem
    // with a small arm and nothing else; the v is angular where almost
    // everything else in this hand is round; the x is two crossed strokes; and
    // the z has a flat top and a flat foot with the diagonal between them.
    //
    // The q was drawing the generic descender, which finishes with a hook to the
    // left. On the page — `quiet`, `quarry` twice — the tail goes straight down
    // and stops. Its bowl is the ordinary one.
    if (pen.traced && RARE.has(char)) {
      const w = size * (0.3 + R() * 0.06) * wide;

      if (char === 'r') {
        to(cx + w * 0.1, y);
        to(cx + w * 0.2, y - h * (0.9 + R() * 0.1));
        to(cx + w * 0.52, y - h * (0.94 + R() * 0.08));
        to(cx + w * 0.76, y - h * (0.66 + R() * 0.12));
        cx += w * 0.82;
      } else if (char === 'v') {
        to(cx + w * 0.08, y - h * (0.94 + R() * 0.1));
        to(cx + w * (0.46 + R() * 0.06), y - h * 0.03);
        to(cx + w * 0.9, y - h * (0.96 + R() * 0.1));
        cx += w * 0.94;
      } else if (char === 'x') {
        to(cx + w * 0.08, y - h * (0.92 + R() * 0.1));
        to(cx + w * 0.88, y - h * 0.04);
        lift();
        to(cx + w * (0.86 + R() * 0.06), y - h * (0.94 + R() * 0.08));
        to(cx + w * 0.06, y - h * 0.03);
        cx += w * 0.94;
      } else if (char === 'z') {
        to(cx + w * 0.06, y - h * (0.9 + R() * 0.08));
        to(cx + w * (0.84 + R() * 0.08), y - h * (0.9 + R() * 0.06));
        to(cx + w * 0.12, y - h * 0.05);
        to(cx + w * (0.9 + R() * 0.08), y - h * 0.03);
        cx += w * 0.96;
      } else {
        // q: the ordinary bowl, and then straight down
        const drop = desc * (0.8 + R() * 0.26);
        to(cx + w * 0.86, y - h * 0.62);
        to(cx + w * 0.5, y - h * (0.96 + R() * 0.06));
        to(cx + w * 0.12, y - h * 0.56);
        to(cx + w * 0.46, y - h * 0.04);
        to(cx + w * 0.84, y - h * 0.48);
        to(cx + w * (0.88 + R() * 0.04), y + drop);
        cx += w * 0.96;
      }

      lift();
      cx += size * (0.035 + R() * 0.065) * pen.gap;
      continue;
    }

    // Punctuation and figures, which have been drawn as letters until now.
    //
    // Anything that was not a to z fell through to the hump branch, so every
    // comma on this site was a small arch, and a full stop, a question mark and
    // an em-dash were the same arch as each other — all three came out 22 by 25
    // and indistinguishable. The page has them plainly: a comma is a tick under
    // the line, a colon is two marks, a question mark is a hook standing over a
    // dot, brackets are tall thin curves, and the dash the poet writes is very
    // long, nearer a strike-out than an em-rule.
    //
    // The figures are described rather than traced, like most of the alphabet.
    // What the sheet supports is that the 1 is a plain stroke with no flag on it
    // and the 4 is open at the top; the rest are built to sit with those.
    if (pen.traced && PUNCTUATION.test(char)) {
      const w = size * 0.2 * wide;
      const tick = (from, to) => { to0(cx + w * 0.34, from); to0(cx + w * (0.2 + R() * 0.1), to); };
      const speck = (at) => { lift(); to0(cx + w * 0.32, at); to0(cx + w * (0.4 + R() * 0.06), at - h * 0.03); lift(); };

      if (char === '.') speck(h * 0.05);
      else if (char === ',') tick(h * 0.12, -desc * 0.2);
      else if (char === ':') { speck(h * 0.08); speck(h * 0.6); }
      else if (char === ';') { tick(h * 0.12, -desc * 0.18); speck(h * 0.62); }
      else if (char === "'" || char === '\u2019') tick(h * 1.12, h * 0.72);
      else if (char === '"' || char === '\u201c' || char === '\u201d') {
        tick(h * 1.12, h * 0.72); cx += w * 0.42; tick(h * 1.1, h * 0.7);
      } else if (char === '!') { to0(cx + w * 0.34, h * 1.05); to0(cx + w * 0.26, h * 0.24); speck(h * 0.05); }
      else if (char === '?') {
        to0(cx + w * 0.06, h * (0.86 + R() * 0.1));
        to0(cx + w * 0.42, h * 1.12);
        to0(cx + w * 0.72, h * 0.82);
        to0(cx + w * 0.36, h * 0.4);
        to0(cx + w * 0.34, h * 0.24);
        speck(h * 0.05);
      } else if (char === '(' || char === '[') {
        to0(cx + w * 0.62, h * 1.24);
        to0(cx + w * 0.24, h * 0.62);
        to0(cx + w * 0.6, -desc * 0.16);
      } else if (char === ')' || char === ']') {
        to0(cx + w * 0.2, h * 1.24);
        to0(cx + w * 0.58, h * 0.62);
        to0(cx + w * 0.22, -desc * 0.16);
      } else {
        // the long dash, which on the page runs on well past an em
        const run = w * (3.4 + R() * 2.6);
        to0(cx + w * 0.1, h * (0.44 + R() * 0.08));
        to0(cx + run, h * (0.46 + R() * 0.08));
        cx += run - w * 0.9;
      }
      lift();
      cx += w * (1.05 + R() * 0.2) + size * (0.035 + R() * 0.065) * pen.gap;
      continue;
    }

    // A figure. Constructed like a capital rather than written like a letter,
    // and standing a little over the x-height, which is where the 1 and the 4
    // of `14 March` sit against the words either side of them.
    if (pen.traced && char >= '0' && char <= '9') {
      const w = size * (0.26 + R() * 0.05) * wide;
      const top = h * (1.12 + R() * 0.16);
      if (char === '1') {
        to(cx + w * (0.34 + R() * 0.08), y - top);
        to(cx + w * 0.4, y - h * 0.02);
      } else {
        to(cx + w * 0.1, y - top * (0.66 + R() * 0.2));
        to(cx + w * 0.46, y - top);
        to(cx + w * 0.82, y - top * (0.6 + R() * 0.2));
        to(cx + w * (0.3 + R() * 0.3), y - h * 0.44);
        to(cx + w * 0.86, y - h * 0.3);
        to(cx + w * 0.3, y - h * 0.02);
        if (R() < 0.34) { lift(); to(cx + w * 0.08, y - h * 0.5); to(cx + w * 0.92, y - h * 0.54); }
      }
      lift();
      cx += w * (1.0 + R() * 0.14) + size * (0.035 + R() * 0.065) * pen.gap;
      continue;
    }

    // A capital, which this hand builds rather than writes.
    //
    // On the page they are print forms — upright, constructed out of separate
    // strokes, and stopping well short of the tall ascenders beside them. The
    // M in `Monday` is plainly shorter than the d that follows it, and the N in
    // `No` stands about half again the o. That is the whole of what is claimed
    // here, and it is claimed by eye: three attempts at measuring this hand
    // letter by letter all failed, and are written up in the commit. `capHeight`
    // is therefore a described constant like most of the alphabet, not a traced
    // one like the six, and it is a dial rather than a literal so it can be
    // moved by looking.
    //
    // No letter is spelled. A capital here is a treatment — taller, straighter,
    // and lifted between its parts — because that is what separates a capital
    // from a lowercase at a glance, and this hand is asemic by the time anyone
    // reads it.
    if (pen.traced && upper) {
      const capH = xh * (pen.capHeight + R() * 0.18);
      const w = size * (0.34 + R() * 0.07) * wide;
      const up = (px, py) => to(cx + px, y - py);

      up(w * (0.04 + R() * 0.05), 0);
      up(w * (0.1 + R() * 0.06), capH * (0.62 + R() * 0.14));
      up(w * (0.2 + R() * 0.08), capH * (0.98 + R() * 0.06));

      const arms = R() < 0.44 ? 2 : 1;
      for (let a = 0; a < arms; a++) {
        lift();
        const from = capH * (a === 0 ? 0.94 + R() * 0.08 : 0.42 + R() * 0.2);
        up(w * (0.16 + R() * 0.08), from);
        up(w * (0.66 + R() * 0.22), from * (0.72 + R() * 0.26));
        if (R() < 0.4) up(w * (0.88 + R() * 0.16), from * (0.3 + R() * 0.3));
      }
      if (R() < 0.32) {
        lift();
        up(w * (0.14 + R() * 0.1), capH * 0.04);
        up(w * (0.82 + R() * 0.2), capH * (0.02 + R() * 0.08));
      }
      lift();
      cx += w * (1.06 + R() * 0.12);
      cx += size * (0.035 + R() * 0.065) * pen.gap;
      continue;
    }

    // The t is not an ascender, and drawing it as one is what made it read as
    // a stem with a hump next to it rather than as a crossed stroke. On the
    // page it stands about one and a half x-heights — `soft`, `Most`,
    // `futures`, `Fantasy` all show it barely clearing the letters beside it —
    // where h, l, d, b and k run to nearly three. The bar crosses high on that
    // short stem and overshoots on both sides, tilting up to the right. The
    // poet describes the result as a regular t, or at speed something closer
    // to a plus, and `bar` is which of the two this one comes out as.
    if (pen.traced && char === 't') {
      const w = size * (0.26 + R() * 0.05) * wide;
      const stem = xh * (1.46 + R() * 0.26);
      const bar = R() < 0.34 ? 0.56 + R() * 0.09 : 0.74 + R() * 0.1;
      to(cx + w * 0.3, y - stem);
      to(cx + w * 0.34, y - h * 0.5);
      to(cx + w * 0.4, y - h * 0.05);

      // Sometimes the bar is not laid across the stem afterwards but grows out
      // of it: the pen reaches the foot, runs back up the stem it has just
      // drawn, and goes straight out into the crossbar without leaving the
      // page. `futures` on the photographed page is the clearest instance —
      // the bar arrives out of the letter before it and the stem comes down
      // through it — and `soft` carries one bar across both the f and the t.
      // A lifted bar and a joined one are different marks: the joined one
      // doubles the upper stem and meets it at a junction rather than a
      // crossing, which is most of why a written t does not look drawn. The
      // poet picked the always-joined form off a sheet of six, and the writing
      // test they sent back bears it out — `little`, `attempts`, `still` and
      // `flat` all carry the bar out of the stroke rather than across it.
      if (R() < pen.tJoin) {
        to(cx + w * 0.36, y - stem * (bar - 0.06));
        to(cx - w * (0.08 + R() * 0.1), y - stem * (bar - 0.02));
        to(cx + w * (0.84 + R() * 0.18), y - stem * (bar + 0.05));
        lift();
      } else {
        to(cx + w * 0.72, y - h * 0.1);
        lift();
        to(cx - w * (0.1 + R() * 0.12), y - stem * (bar - 0.03));
        to(cx + w * (0.84 + R() * 0.18), y - stem * (bar + 0.04));
        lift();
      }
      cx += w * 0.98;
      if (R() < Math.max(0.02, pen.lift - hand.temper * 0.09)) lift();
      cx += size * (0.035 + R() * 0.065) * pen.gap;
      continue;
    }

    if (isAscender) {
      // ascender — l h k b d t f
      const w = size * (0.31 + R() * 0.055) * wide;
      const tall = asc * (0.88 + R() * 0.2);
      if (traces && char === 'b') {
        // A numeral 6, and unmistakably one at magnification — in bodies, best,
        // blue, Good. The stroke starts at the top, sweeps down and to the left,
        // and closes a bowl at the foot. It is the most recognisable letter in
        // the hand, and it was being drawn as a stem with a bowl hung off it.
        const top = asc * (0.84 + R() * 0.18);
        to(cx + w * 0.62, y - top);
        to(cx + w * 0.44, y - top * 0.97);
        to(cx + w * 0.28, y - top * 0.56);
        to(cx + w * 0.1, y - h * 0.66);
        to(cx + w * 0.06, y - h * 0.22);
        to(cx + w * 0.38, y + h * 0.03);
        to(cx + w * 0.8, y - h * 0.14);
        to(cx + w * 0.86, y - h * 0.52);
        to(cx + w * 0.5, y - h * 0.68);
        to(cx + w * 0.16, y - h * 0.52);
      } else if (char === 'd') {
        // bowl first, then the tall right-hand stroke
        to(cx, y - h * 0.16);
        to(cx + w * 0.04, y - h * 0.76);
        to(cx + w * 0.42, y - h);
        to(cx + w * 0.78, y - h * 0.56);
        to(cx + w * 0.62, y - h * 0.05);
        to(cx + w * 0.74, y - tall);
        to(cx + w * 0.9, y - tall * 0.9);
        to(cx + w * 0.92, y);
      } else {
        // upright stem with a small hook at the top
        to(cx, y);
        to(cx + w * 0.14, y - tall * 0.9);
        to(cx + w * 0.34, y - tall);
        to(cx + w * 0.44, y - tall * 0.9);
        to(cx + w * 0.38, char === 'f' ? y + desc * 0.3 : y - h * 0.06);

        if (char === 'h') {
          to(cx + w * 0.58, y - h * 0.75);
          to(cx + w * 0.88, y - h * 0.9);
          to(cx + w * 1.16, y - h * 0.1);
        } else if (char === 'b') {
          to(cx + w * 0.72, y - h * 0.82);
          to(cx + w * 1.06, y - h * 0.52);
          to(cx + w * 0.92, y - h * 0.06);
          to(cx + w * 0.44, y - h * 0.14);
        } else if (char === 'k') {
          lift();
          to(cx + w * 0.4, y - h * 0.52);
          to(cx + w * 0.94, y - h * 0.92);
          to(cx + w * 0.48, y - h * 0.5);
          to(cx + w * 1.05, y);
        } else {
          to(cx + w * 0.84, y);
        }
      }

      if ((char === 't' || char === 'f') || R() < 0.18) {
        lift();
        to(cx - size * 0.055, y - tall * 0.56);
        to(cx + size * 0.5, y - tall * (0.58 + R() * 0.05));
        lift();
      }
      cx += w * (char === 'l' || char === 't' || char === 'f' ? 1.0 : 1.22);
    } else if (traces && char === 'g') {
      // The g closes a round bowl and then drops almost straight, turning left
      // at the foot into a short flat tail — an L, near enough, where the other
      // descenders swing. Nothing in the notebook loops below the line.
      const w = size * (0.33 + R() * 0.06) * wide;
      const depth = desc * (0.68 + R() * 0.22);
      to(cx + w * 0.84, y - h * 0.7);
      to(cx + w * 0.5, y - h * (0.94 + R() * 0.1));
      to(cx + w * 0.1, y - h * 0.7);
      to(cx + w * 0.14, y - h * 0.22);
      to(cx + w * 0.52, y - h * 0.02);
      to(cx + w * 0.86, y - h * 0.3);
      to(cx + w * 0.9, y - h * 0.64);
      to(cx + w * 0.84, y + depth * 0.54);
      to(cx + w * 0.78, y + depth * 0.94);
      to(cx + w * 0.42, y + depth * (0.98 + R() * 0.06));
      to(cx + w * 0.06, y + depth * 0.82);
      cx += w * 0.98;
    } else if (traces && char === 'e') {
      // An angular epsilon, and a small flat one: the crossbar comes first,
      // the pen loops back over the top and round the foot, and it is left
      // open on the right. It sits well under the x-height of an o.
      const w = size * (0.3 + R() * 0.06) * wide;
      const eh = h * (0.66 + R() * 0.12);
      to(cx, y - eh * 0.5);
      to(cx + w * 0.66, y - eh * 0.58);
      to(cx + w * 0.5, y - eh * 0.94);
      to(cx + w * 0.14, y - eh * 0.86);
      to(cx + w * 0.02, y - eh * 0.34);
      to(cx + w * 0.34, y - eh * 0.02);
      to(cx + w * 0.78, y - eh * 0.12);
      to(cx + w * 0.92, y - eh * 0.44);
      cx += w * 0.96;
    } else if (traces && char === 'w') {
      // Two round valleys, not the two arches the hump branch was giving it.
      // The middle peak stays low — a little over half the x-height — and both
      // ends rise past it and hook, which is what makes the letter read wide.
      const w = size * (0.3 + R() * 0.06) * wide;
      to(cx, y - h * (0.78 + R() * 0.14));
      to(cx + w * 0.2, y - h * 0.14);
      to(cx + w * 0.42, y - h * 0.02);
      to(cx + w * 0.62, y - h * (0.5 + R() * 0.16));
      to(cx + w * 0.84, y - h * 0.14);
      to(cx + w * 1.06, y - h * 0.02);
      to(cx + w * 1.28, y - h * (0.76 + R() * 0.16));
      to(cx + w * 1.4, y - h * 0.52);
      cx += w * 1.46;
    } else if (isDescender) {
      // descender — g y p j q
      const w = size * (0.34 + R() * 0.065) * wide;
      const depth = desc * (0.82 + R() * 0.3);
      to(cx, y - h * 0.78);
      to(cx + w * 0.32, y - h);
      to(cx + w * 0.74, y - h * 0.72);
      to(cx + w * 0.62, y - h * 0.06);
      to(cx + w * 0.56, y + depth * 0.86);
      to(cx + w * 0.28, y + depth);
      to(cx - w * 0.08, y + depth * 0.7);
      if (char === 'j') dot(cx + w * 0.25, y - h * 1.45);
      cx += w * 0.92;
    } else if (BOWLS.has(char)) {
      // The hand's commonest motion: a loose, slightly open single-storey
      // bowl. The points stay irregular so it suggests a letter without
      // resolving into typography.
      const w = size * (0.34 + R() * 0.08) * wide;
      to(cx, y - h * 0.18);
      to(cx - w * 0.03, y - h * 0.58);
      to(cx + w * 0.2, y - h * (0.92 + R() * 0.08));
      to(cx + w * 0.62, y - h * (0.98 + R() * 0.06));
      to(cx + w * 0.9, y - h * 0.58);
      to(cx + w * 0.78, y - h * 0.1);
      to(cx + w * 0.28, y);
      if (char !== 'c') to(cx + w * 0.08, y - h * 0.48);
      if (char === 'a') {
        to(cx + w * 0.82, y - h * 0.9);
        to(cx + w * 0.96, y - h * 0.08);
      }
      cx += w * (char === 'c' ? 0.88 : 1.02);
    } else if (char === 'i') {
      // Mihir's i is a short, nearly upright stroke with a high separate dot.
      const w = size * (0.2 + R() * 0.035) * wide;
      to(cx, y - h * 0.82);
      to(cx + w * 0.2, y);
      to(cx + w, y - h * 0.06);
      dot(cx + w * 0.06, y - h * 1.46);
      cx += w;
    } else if (char === 's') {
      const w = size * (0.31 + R() * 0.06) * wide;
      if (traces) {
        // A round S — a small counter at the top opening left, a diagonal
        // across, a larger one at the foot opening right, and a tail that
        // carries on left along the baseline. It was a six-point zigzag.
        to(cx + w * 0.9, y - h * 0.76);
        to(cx + w * 0.56, y - h * (0.94 + R() * 0.08));
        to(cx + w * 0.18, y - h * 0.74);
        to(cx + w * 0.46, y - h * 0.5);
        to(cx + w * 0.8, y - h * 0.34);
        to(cx + w * 0.88, y - h * 0.1);
        to(cx + w * 0.46, y + h * 0.02);
        to(cx + w * 0.12, y - h * 0.12);
      } else {
        to(cx + w * 0.9, y - h * 0.88);
        to(cx + w * 0.38, y - h);
        to(cx + w * 0.12, y - h * 0.58);
        to(cx + w * 0.72, y - h * 0.4);
        to(cx + w * 0.92, y - h * 0.08);
        to(cx + w * 0.26, y);
      }
      cx += w * 0.92;
    } else {
      // Broad humps rather than a sawtooth. Character identity sets their
      // count, while chance supplies the imperfect widths and shoulders.
      let peaks = HUMPS.has(char) ? (char === 'm' || char === 'w' ? 2 : 1) : 1;
      if (!HUMPS.has(char) && R() < 0.18) peaks++;
      to(cx, y);
      for (let p = 0; p < peaks; p++) {
        const w = size * (0.31 + R() * 0.09) * wide;
        to(cx + w * 0.2, y - h * (0.55 + R() * 0.12));
        to(cx + w * 0.56, y - h * (0.9 + R() * 0.12));
        to(cx + w * 0.82, y - h * (0.74 + R() * 0.1));
        to(cx + w, y);
        cx += w;
      }
    }

    // The notebook hand keeps the pen down and runs a word together — "the"
    // arrives as one gesture. Lifting on nearly half the letters, which is what
    // this did, is a hand printing rather than writing.
    if (R() < Math.max(0.02, pen.lift - hand.temper * 0.09)) lift();
    cx += size * (0.035 + R() * 0.065) * pen.gap;
  }

  if (R() < 0.32) to(cx + size * (0.14 + R() * 0.24), y - xh * (0.12 + R() * 0.32));
  lift();

  return { strokes, end: cx };
}

/**
 * How wide a line will come out, in units of `size`, without drawing it.
 *
 * The coefficients are measured against the generator, not derived from it: an
 * advance is the sum of six different glyph widths and a random gap, and
 * fitting the two numbers over the corpus is shorter and truer than adding that
 * up. They live on the hand because they belong to it — **re-measure whenever a
 * glyph's advance moves.** The width constants moved once and this did not, and
 * `fitSize()` went on choosing a size for the old narrow hand: every signature
 * on the index was drawn a third too large and clipped. Nothing failed. It was
 * only visible in a browser.
 */
function lineUnits(line, pen) {
  const words = line.split(/\s+/).filter(Boolean);
  const chars = line.replace(/\s/g, '').length;
  return pen.units[0] * chars + pen.units[1] * words.length;
}

/**
 * The page furniture — what a notebook has that a clean column does not.
 *
 * The notebook is full of second thoughts, and none of them were modelled: a
 * word struck out as a tight scribbled blob rather than ruled through, a caret
 * where something was left out and the word itself squeezed in above the line,
 * a number ringed in the margin, and an arrow at the foot of a page carrying
 * the sentence over. Without any of it the hand writes as though it never
 * changed its mind, which is the one thing the photographs say it always does.
 *
 * These build their points directly rather than through the wandering `to()`.
 * A scribble has no letterform to lean, and running it through the slant only
 * shears a shape whose whole character is that it was made too fast to aim.
 *
 * All of it is held back from a single-line mark. A row signature is
 * twenty-six pixels tall and a strike-out on it is a smudge, not a correction.
 */
function strikeOut(x, y, span, size, R) {
  // Two strokes, which is what the page shows: a tight scribble worked back
  // and forth over the word, and one longer flatter line across the top of it
  // that overruns the word to the left.
  const lead = size * (0.1 + R() * 0.16);
  const run = Math.max(size * 0.3, span) + lead * 2;
  // Tight and deep. A wide shallow zigzag is a rule with a wobble in it; what
  // the page has is a blob, its loops nearly as tall as the letters under it.
  const swings = Math.max(6, Math.round(run / (size * 0.12)));
  const amp = size * (0.17 + R() * 0.08);
  const mid = y - size * 0.26;
  const scribble = [];
  for (let i = 0; i <= swings; i++) {
    const t = i / swings;
    scribble.push([
      x - lead + run * t,
      mid + (i % 2 ? amp : -amp) * (0.65 + R() * 0.7)
    ]);
  }
  const overrun = size * (0.2 + R() * 0.3);
  return [
    scribble,
    [
      [x - lead - overrun, mid - amp * (0.5 + R() * 0.5)],
      [x + run * 0.5, mid - amp * (0.9 + R() * 0.4)],
      [x - lead + run, mid - amp * (0.4 + R() * 0.6)]
    ]
  ];
}

/** A caret: it sits on the line and points at the gap the word should fill. */
function caret(x, y, size, R) {
  const w = size * (0.13 + R() * 0.07);
  return [
    [x, y + size * 0.05],
    [x + w * 0.48, y - size * (0.2 + R() * 0.1)],
    [x + w, y + size * 0.04]
  ];
}

/** A number ringed in the margin — a tick, and a loop wound round it. */
function ringedNumber(x, y, size, R) {
  const r = size * (0.3 + R() * 0.08);
  const ring = [];
  const start = R() * Math.PI * 2;
  // A hand does not close a ring cleanly, so it runs past where it started.
  for (let i = 0; i <= 11; i++) {
    const a = start + (i / 11) * Math.PI * 2.16;
    ring.push([
      x + Math.cos(a) * r * (0.94 + R() * 0.14),
      y + Math.sin(a) * r * (0.82 + R() * 0.16)
    ]);
  }
  return [
    ring,
    [
      [x - r * 0.1, y - r * 0.42],
      [x + r * 0.06, y - r * 0.1],
      [x - r * 0.02, y + r * 0.36]
    ]
  ];
}

/** The arrow at the foot of a page that carries the sentence over. */
function continuationArrow(x, y, size, R) {
  const len = size * (1.4 + R() * 0.9);
  const rise = size * (0.1 + R() * 0.14);
  return [
    [
      [x, y],
      [x + len * 0.45, y - rise * (0.4 + R() * 0.5)],
      [x + len, y - rise]
    ],
    [
      [x + len - size * (0.24 + R() * 0.1), y - rise - size * 0.16],
      [x + len, y - rise],
      [x + len - size * (0.22 + R() * 0.12), y - rise + size * 0.2]
    ]
  ];
}

/**
 * A row signature is a compact digest rather than the poem's first scrap.
 * Begin at its longest line, then continue through the poem until there is
 * enough material to cross the row at a height-safe letter size.
 */
function signatureLine(lines, width, height, pen) {
  const clean = lines
    .map(raw => raw.replace(/\*/g, '').trim())
    .filter(Boolean);
  if (!clean.length) return '';

  let longest = 0;
  for (let i = 1; i < clean.length; i++) {
    if (clean[i].length > clean[longest].length) longest = i;
  }

  const heightCap = clamp(height / 2.9, 2.4, 16);
  const targetUnits = width * 0.92 / heightCap;
  let joined = clean[longest];

  for (let step = 1; step < clean.length && lineUnits(joined, pen) < targetUnits; step++) {
    joined += ' ' + clean[(longest + step) % clean.length];
  }

  return joined;
}

/**
 * Choose a letter size so the poem's longest line very nearly fills the
 * width and the whole poem fits the height.
 *
 * The advance per glyph is random, so this estimates it: measured against
 * the generator, a line runs about 0.44 units per character plus 0.87 per
 * word gap, per unit of size.
 */
function fitSize(lines, width, height, maxLines, pen) {
  let widest = 0;
  let count = 0;

  for (const raw of lines) {
    const line = raw.replace(/\*/g, '').trim();
    if (!line) continue;
    count++;
    widest = Math.max(widest, lineUnits(line, pen));
  }

  if (!widest) return 5;

  const byWidth = (width * 0.96) / widest;
  if (maxLines === 1) {
    // Ascender + descender + slope room. Width chooses the size; height is
    // only the guardrail, which keeps the signature broad rather than tiny.
    //
    // A single line keeps more of the margin than a column does. It has no
    // wrap to save it, the width model is good to about five percent either
    // way, and a hand that wanders can put its last flourish past where the
    // advance said it would stop. At 0.96 three signatures ended within half
    // a pixel of the right edge of a 257px row.
    const heightCap = height / 2.9;
    return clamp(Math.min(16, (width * 0.92) / widest, heightCap), 2.4, 16);
  }

  const rows = maxLines ? Math.min(count, maxLines) : count;
  // 2.95 is the leading multiple; the extra row leaves the ascenders room
  const byHeight = rows > 0 ? height / ((rows + 0.9) * 2.95) : byWidth;

  return Math.max(2.4, Math.min(16, Math.min(byWidth, byHeight)));
}

/**
 * Settle a single-line mark inside the box it was given.
 *
 * fitSize() chooses a letter size from the space available, but the hand it
 * is sizing wanders: the baseline drifts, the pen shakes, an ascender runs
 * tall, and a line that should have cleared the top of its box by a hair
 * clears it by less than nothing. On a row signature — twenty-six pixels of
 * canvas — that shows as a mark with its head sliced off.
 *
 * Rather than leave more headroom and hope, this measures what was actually
 * drawn and settles it: centred in the box, and scaled down only if the hand
 * genuinely wrote taller than the room it had. Only whole marks are settled.
 * A poem's column is meant to run past the bottom of its plate, and moving it
 * would be moving the composition.
 */
function settle(strokes, height) {
  let top = Infinity;
  let bottom = -Infinity;

  for (const stroke of strokes) {
    for (const point of stroke.pts) {
      if (point[1] < top) top = point[1];
      if (point[1] > bottom) bottom = point[1];
    }
  }

  if (!Number.isFinite(top) || !Number.isFinite(bottom)) return strokes;

  const pad = Math.max(0.5, height * 0.04);
  const room = Math.max(1, height - pad * 2);
  const span = bottom - top;
  const scale = span > room ? room / span : 1;
  const shift = pad + (room - span * scale) / 2 - top * scale;

  if (scale === 1 && Math.abs(shift) < 0.01) return strokes;

  for (const stroke of strokes) {
    for (const point of stroke.pts) {
      point[0] *= scale;
      point[1] = point[1] * scale + shift;
    }
    if (scale !== 1 && Array.isArray(stroke.lw)) {
      stroke.lw = stroke.lw.map(width => width * scale);
    }
  }

  return strokes;
}

/**
 * Render a poem's real lines as unreadable writing inside a box.
 * Blank lines in the source become stanza gaps, so the block keeps the
 * poem's actual shape.
 */
export function ghost(text, opts) {
  const { x = 0, width, height, maxLines = 0 } = opts;
  const temper = clamp(opts.temper || 0, -1, 1);
  const pen = HANDS[opts.hand || HAND] || HANDS.notebook;
  const R = opts.rng;
  const out = [];
  // A column has room for a second thought. A row signature does not: it is
  // twenty-six pixels tall, and a strike-out on it is a smudge.
  const furnished = pen.furniture && maxLines !== 1;
  const sourceLines = String(text || '').split('\n');
  const lines = maxLines === 1
    ? [signatureLine(sourceLines, width, height, pen)]
    : sourceLines;

  // The hand is scaled to the space it is given, so a poem's longest line
  // very nearly fills the column and the whole poem fits the height. Fixing
  // the size instead leaves the marks stranded in a corner of the canvas.
  const size = opts.size || fitSize(lines, width, height, maxLines, pen);
  const leading = size * 2.95;

  let by = size * 1.5;
  const bottom = height - size * 0.6;
  let used = 0;
  let baselineDrift = 0;
  let phraseInk = 'mark';
  let phraseRemaining = 0;

  const nextInk = () => {
    if (phraseRemaining > 0) {
      phraseRemaining--;
      return phraseInk;
    }
    if (R() < 0.17) {
      phraseInk = ACCENT_INKS[Math.floor(R() * ACCENT_INKS.length)];
      phraseRemaining = R() < 0.28 ? 1 : 0;
      return phraseInk;
    }
    phraseInk = 'mark';
    return phraseInk;
  };

  const beginLine = (indent = 0) => {
    const sway = 1 + (temper >= 0 ? temper * 1.4 : temper * 0.6);
    baselineDrift = clamp(
      baselineDrift * 0.72 + (R() - 0.5) * size * 0.24 * sway,
      -size * 0.24 * sway,
      size * 0.24 * sway
    );
    const startX = x + indent + size * (0.08 + R() * 0.34);
    return {
      startX,
      baseline: by + baselineDrift,
      slope: (R() - 0.5) * Math.max(0.0012, 0.0034 + temper * 0.003),
      slant: pen.slant * (1 + temper * 0.55) + (R() - 0.5) * Math.max(0.02, 0.05 + temper * 0.05),
      dx: 0,
      dy: 0,
      bounce: 0,
      pen,
      temper
    };
  };

  // A hand does not rest evenly. It comes off the end of a stanza and does not
  // start the next one immediately, and now and then it stops in the middle of
  // a line for no reason the page records. Neither happens often — a pause that
  // arrives on schedule is a rhythm rather than a hesitation, and stops reading
  // as a person. Which ones happen is drawn from the poem's own seed, so a
  // given mark hesitates in the same places for every reader, forever.
  let afterStanza = false;

  for (const raw of lines) {
    const line = raw.replace(/\*/g, '').trim();
    if (!line) {
      by += leading * 0.62;
      afterStanza = true;
      continue;
    }
    if (maxLines && used >= maxLines) break;
    if (bottom && by > bottom) break;

    const words = line.split(/\s+/);
    let hand = beginLine();
    let cx = hand.startX;
    let wi = 0;
    let guard = 0;
    // What the pen has just done, which is what decides how long it rests
    // before the next mark. A hand pauses between words and rests hardest
    // on the way back to the left margin; inside a word it barely stops.
    // A little over a third of the stanza breaks are also rested on.
    let gap = afterStanza && R() < 0.38 ? 'stanza' : 'line';
    afterStanza = false;

    while (wi < words.length && guard++ < 200) {
      const m = wordMark(cx, hand.baseline, words[wi], size, R, hand);

      // A word that will not fit even on a line of its own is written anyway.
      // Wrapping it again only moves it to another line it cannot fit either,
      // and the guard below then gives up with nothing drawn at all.
      if (m.end > x + width && cx > hand.startX + 0.01) {
        // the line wraps, and the continuation is indented
        by += leading * (0.965 + R() * 0.07);
        used++;
        if (maxLines && used >= maxLines) break;
        if (bottom && by > bottom) break;
        hand = beginLine(size * 0.9);
        cx = hand.startX;
        gap = 'line';
        continue;
      }

      const ink = nextInk();
      const alpha = 0.6 + R() * 0.4;
      // Stroke weight tracks letter size — a pen keeps its nib whatever it
      // writes. A fixed hairline vanishes once the hand is scaled up.
      const baseLw = Math.max(0.55, size * 0.072) * (0.88 + R() * 0.26) * (1 - temper * 0.2);
      let opening = true;
      for (const pts of m.strokes) {
        let previous = baseLw * 0.7;
        let lastDx = 0;
        let lastDy = 0;
        const lw = pts.map((point, index) => {
          if (index === 0) return previous;
          const before = pts[index - 1];
          const dx = point[0] - before[0];
          const dy = point[1] - before[1];
          const length = Math.max(0.001, Math.hypot(dx, dy));
          const vertical = dy / length;
          // A pen leaves more ink where it slows, and it slows to turn. The
          // corners of a letter are its heaviest part for the same reason
          // the downstrokes are.
          const was = Math.hypot(lastDx, lastDy);
          const turn = was > 0
            ? 1 - Math.max(-1, Math.min(1, (dx * lastDx + dy * lastDy) / (length * was)))
            : 0;
          lastDx = dx;
          lastDy = dy;
          const target = baseLw * (
            0.76 +
            Math.max(0, vertical) * 0.64 -
            Math.max(0, -vertical) * 0.22
          ) * (1 + 0.28 * Math.min(turn, 1.2));
          previous = previous * 0.22 + target * 0.78;
          return previous;
        });
        out.push({ pts, ink, alpha, lw, curve: pen.curve, gap: opening ? gap : 'letter' });
        opening = false;
      }

      if (furnished) {
        const scrap = (strokes, weight) => {
          for (const pts of strokes) {
            out.push({
              pts, ink, alpha: 0.66 + R() * 0.34,
              lw: baseLw * weight, curve: pen.curve, gap: 'letter'
            });
          }
        };

        // A word thought better of, scribbled out where it stands.
        if (R() < 0.022) scrap(strikeOut(cx, hand.baseline, m.end - cx, size, R), 1.05);

        // A word left out. The caret goes in where it belongs and the word
        // itself is squeezed in above the line, small, running toward the
        // right margin — the notebook never rewrites the line to make room.
        if (R() < 0.02) {
          scrap([caret(m.end + size * 0.24, hand.baseline, size, R)], 0.9);
          const small = size * 0.62;
          const insert = wordMark(
            Math.min(m.end + size * 0.5, x + width - small * 2.2),
            hand.baseline - size * 1.15,
            words[(wi + 3) % words.length],
            small, R, hand
          );
          for (const pts of insert.strokes) {
            out.push({
              pts, ink, alpha: 0.6 + R() * 0.3,
              lw: Math.max(0.5, baseLw * 0.72), curve: pen.curve, gap: 'letter'
            });
          }
        }
      }

      // Once in every forty-odd words the pen simply stops, mid-line, and picks
      // the sentence up again. Rare enough that a reader meets it perhaps once
      // in a column, which is what makes it read as a thought rather than as
      // a stutter.
      gap = R() < 0.024 ? 'caught' : 'word';
      cx = m.end + size * (0.62 + R() * 0.5);
      wi++;
    }

    // A number ringed out in the left margin, against a line now and then.
    if (furnished && R() < 0.035) {
      // Far enough in that the ring is whole: it can run to 0.41 of the size
      // from its own centre, and at 0.34 it was being cut by the left edge.
      const ring = ringedNumber(x + size * 0.55, hand.baseline - size * 0.3, size, R);
      for (const pts of ring) {
        out.push({
          pts, ink: 'mark', alpha: 0.55 + R() * 0.3,
          lw: Math.max(0.5, size * 0.06), curve: pen.curve, gap: 'letter'
        });
      }
    }

    by += leading * (0.965 + R() * 0.07);
    used++;
  }

  // And an arrow at the foot, carrying the sentence onto a page that is not here.
  if (furnished && used > 2 && R() < 0.3) {
    const arrow = continuationArrow(x + width * (0.52 + R() * 0.24), by - leading * 0.2, size, R);
    for (const pts of arrow) {
      out.push({
        pts, ink: 'mark', alpha: 0.5 + R() * 0.3,
        lw: Math.max(0.5, size * 0.062), curve: pen.curve, gap: 'letter'
      });
    }
  }

  return maxLines === 1 ? settle(out, height) : out;
}

/** Reads the ink triples from CSS so marks follow the active theme. */
export function palette() {
  const s = getComputedStyle(document.documentElement);
  const v = (n, d) => (s.getPropertyValue(n) || d).trim();
  return {
    mark: v('--i-mark', '35,33,28'),
    green: v('--i-green', '26,74,52'),
    rust: v('--i-rust', '112,49,36'),
    navy: v('--i-navy', '48,48,87')
  };
}

function inkOf(pal, s) {
  return 'rgba(' + (pal[s.ink] || pal.mark) + ',' + 0.85 * s.alpha + ')';
}

/**
 * One stroke, optionally stopped part of the way along it.
 *
 * `upto` is {segment, fraction}: the index of the segment the pen is inside
 * and how far it has crossed it. Without it the whole stroke is drawn.
 *
 * The generator lays down points that describe curves and the painter used to
 * join them with straight lines, which is most of what made the hand read as
 * drawn rather than written: every shoulder arrived as a corner. Each point is
 * now the control of a quadratic running between the midpoints of the segments
 * either side of it — the same points, read as a curve rather than a path. The
 * generator is untouched.
 *
 * A quadratic stays inside the triangle of its own control points, so a mark
 * still cannot stray outside the box its points sat in, and the single-line
 * regression test holds by construction rather than by luck.
 */
function drawStroke(ctx, s, pal, upto) {
  const p = s.pts;
  if (!p || p.length < 2) return;
  const last = upto ? Math.min(upto.segment, p.length - 1) : p.length - 1;
  if (last < 1) return;

  ctx.strokeStyle = inkOf(pal, s);
  const mid = (a, b) => [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5];

  if (s.curve === false) {
    // The plain hand joined its points with straight lines, and that is most
    // of what made it read as drawn rather than written. It is kept so there
    // is something to compare the notebook hand against.
    for (let j = 1; j <= last; j++) {
      const a = p[j - 1];
      const b = p[j];
      const to = upto && j === last && upto.fraction < 1
        ? [a[0] + (b[0] - a[0]) * upto.fraction, a[1] + (b[1] - a[1]) * upto.fraction]
        : b;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(to[0], to[1]);
      ctx.lineWidth = Array.isArray(s.lw) ? (s.lw[j - 1] + s.lw[j]) * 0.5 : s.lw;
      ctx.stroke();
    }
    return;
  }

  for (let j = 1; j <= last; j++) {
    // the pen enters where the segment behind was halfway through and leaves
    // halfway through this one; the two ends of a stroke keep their real points
    const from = j === 1 ? p[0] : mid(p[j - 2], p[j - 1]);
    let to = j === p.length - 1 ? p[j] : mid(p[j - 1], p[j]);
    if (upto && j === last && upto.fraction < 1) {
      const a = p[j - 1], b = p[j];
      to = [a[0] + (b[0] - a[0]) * upto.fraction, a[1] + (b[1] - a[1]) * upto.fraction];
    }
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.quadraticCurveTo(p[j - 1][0], p[j - 1][1], to[0], to[1]);
    ctx.lineWidth = Array.isArray(s.lw) ? (s.lw[j - 1] + s.lw[j]) * 0.5 : s.lw;
    ctx.stroke();
  }
}

export function paint(ctx, strokes) {
  const pal = palette();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of strokes) drawStroke(ctx, s, pal, null);
}

/**
 * The time model, in seconds.
 *
 * Ink runs at a speed; corners are taken slowly; and the pen rests at the
 * boundaries a hand actually rests at. The first attempt at this charged a
 * beat to every one of five hundred pen lifts, which spread the hesitation
 * so thinly that no single pause lasted longer than two frames. Almost all
 * of the resting now happens between words, and most of the rest of it on
 * the way back to the left margin.
 */
const PEN_SPEED = 1400;  // canvas units of ink a second
const AIR_SPEED = 1900;  // and how fast the hand crosses a gap
const TURN_COST = 2.1;   // how much a corner slows the pen, per unit of turn
const REST = {
  letter: 0.005,  // inside a word the pen hardly stops
  word: 0.1,      // between words it does
  caught: 0.29,   // and once in a while it stops mid-line for no reason
  line: 0.22,     // it rests hardest before starting a line
  stanza: 0.46    // and hardest of all coming off the end of a stanza
};

/**
 * Measure the marks the way a hand would make them — as one journey, in
 * seconds, so the pacing is stated in a unit a reader can feel rather than
 * in a share of some total.
 *
 * A short mark therefore keeps its real rhythm: ten words with a tenth of a
 * second between them is a hand writing a line. A whole poem's column asks
 * for far longer than anyone would watch, so the caller compresses it — the
 * proportions survive, and the column reads as busy rather than as slow.
 */
export function writingPlan(strokes) {
  const spans = [];
  let total = 0;
  let previousEnd = null;

  for (const s of strokes) {
    const p = s.pts;
    if (!p || p.length < 2) {
      spans.push(null);
      continue;
    }

    if (previousEnd) {
      const reach = Math.hypot(p[0][0] - previousEnd[0], p[0][1] - previousEnd[1]);
      total += reach / AIR_SPEED + (REST[s.gap] ?? REST.letter);
    }

    const marks = [];
    let cost = 0;
    let lastX = null;
    let lastY = null;

    for (let j = 1; j < p.length; j++) {
      const dx = p[j][0] - p[j - 1][0];
      const dy = p[j][1] - p[j - 1][1];
      const length = Math.hypot(dx, dy);

      let turn = 0;
      if (lastX !== null && length > 0) {
        const before = Math.hypot(lastX, lastY);
        if (before > 0) {
          // 0 running straight on, 2 doubling back on itself.
          turn = 1 - Math.max(-1, Math.min(1, (dx * lastX + dy * lastY) / (length * before)));
        }
      }

      cost += (length / PEN_SPEED) * (1 + TURN_COST * turn);
      marks.push(cost);
      lastX = dx;
      lastY = dy;
    }

    spans.push({ start: total, marks, length: cost });
    total += cost;
    previousEnd = p[p.length - 1];
  }

  return { spans, total };
}

/** Draw the journey as far as `t` (0–1) along it. */
export function paintProgress(ctx, strokes, plan, t) {
  const pal = palette();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const travelled = Math.max(0, Math.min(1, t)) * plan.total;

  for (let i = 0; i < strokes.length; i++) {
    const span = plan.spans[i];
    if (!span) continue;
    if (span.start >= travelled) break;

    if (span.start + span.length <= travelled) {
      drawStroke(ctx, strokes[i], pal, null);
      continue;
    }

    // The pen is inside this stroke: find the segment it is crossing.
    const into = travelled - span.start;
    let segment = 0;
    while (segment < span.marks.length - 1 && span.marks[segment] < into) segment++;
    const before = segment === 0 ? 0 : span.marks[segment - 1];
    const width = span.marks[segment] - before;
    drawStroke(ctx, strokes[i], pal, {
      segment: segment + 1,
      fraction: width > 0 ? (into - before) / width : 1
    });
    break;
  }
}
