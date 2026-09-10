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
 * a mixture of notebook-derived gestures and described forms. Ten lowercase
 * forms and 21 capitals have photographic references; the remaining forms
 * stay described. This is a variable mark generator, not a handwriting font.
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
 * covers the sampled lowercase forms and capitals described below.
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
    // the shape of the hand
    slant: -0.1, wide: 1.35, gap: 1.8, lift: 0.16, bounce: 1,
    // which letterforms it reaches for, and how often
    steady: 0.315, ligature: 0.65, tJoin: 1, plus: 0.45, capHeight: 1.78,
    crossbar: 0.09, flourish: 0.32,
    // what it does at speed
    rise: 0.33, join: 0.09,
    // where it rests
    stanzaRest: 0.38, caught: 0.096,
    // what else ends up on the page
    accent: 0.17, strike: 0.022, caret: 0.02, note: 0.035, arrow: 0.3,
    // switches, and the width model
    traced: true, curve: true, furniture: true, units: [0.554, 0.942]
  },
  plain: {
    slant: 0.055, wide: 1, gap: 1, lift: 0.45, bounce: 0,
    steady: 0, ligature: 0, tJoin: 0, plus: 0, capHeight: 0,
    crossbar: 0.18, flourish: 0.32,
    rise: 0, join: 0,
    stanzaRest: 0, caught: 0,
    accent: 0.17, strike: 0, caret: 0, note: 0, arrow: 0,
    traced: false, curve: false, furniture: false, units: [0.422, 0.863]
  }
};

const RARE = new Set('rvxzq');
const NOTEBOOK_CAPITALS = new Set('ABCDEFGHILMNOPQRSTUWY');
const PUNCTUATION = /[.,:;!?()[\]'\u2019"\u201c\u201d\u2013\u2014-]/;
const ASCENDERS = new Set('lhkbdtf');
const DESCENDERS = new Set('gypjq');
const BOWLS = new Set('aoec');
const HUMPS = new Set('nmuw');
/**
 * Green recurs like an annotation; rust interrupts it now and then, and navy
 * is rarer than either. The order of that frequency is fixed. The distances
 * between them are not, and they used to be: written as a bag of eight to be
 * drawn from, the ratio could only ever be a ratio of small whole numbers,
 * and navy was the one that paid for it at a single slot in eight.
 *
 * That put roughly one navy stroke on the page for every six green ones —
 * 2.4% of the marks in a poem's ghost column against green's 13.7% — which
 * is present but too thin to read as a colour at all. Navy takes its extra
 * share from green, which had the most to spare; rust is exactly where it
 * was. It is still the rarest of the three, which is the part that was
 * deliberate.
 */
const ACCENT_INKS = [['green', 55], ['rust', 25], ['navy', 20]];
const ACCENT_TOTAL = ACCENT_INKS.reduce((sum, pair) => sum + pair[1], 0);

/**
 * One draw, from one call to the generator.
 *
 * Weighted rather than indexed, but still a single R() — the marks are
 * seeded, and spending a second random number here would have shifted every
 * letterform on the site sideways to change some of their colours.
 */
function accentInk(R) {
  let n = R() * ACCENT_TOTAL;
  for (const [ink, weight] of ACCENT_INKS) {
    n -= weight;
    if (n < 0) return ink;
  }
  return ACCENT_INKS[0][0];
}

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
  const tall = 1 + hand.temper * pen.rise;
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
    if (pen.traced && !upper && char === 't' && glyphs[gi + 1] === 'h' && joinsOn && R() < pen.ligature) {
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
      if (R() < Math.max(0.02, pen.lift - hand.temper * pen.join)) lift();
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
    if (pen.traced && !upper && RARE.has(char)) {
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
      } else if (char === '-') {
        // A hyphen, which is a short mark and a different thing entirely from
        // the dash below it. Treating the two alike drew a 73-wide rule inside
        // every hyphenated word — `half-light` came out 327 wide where `sun` is
        // 79 — and the book is full of them: Half-light, half-death,
        // high-pitched, honey-colored, future-shaped. The long dash on the page
        // is an em-dash used as a strike-out, in `answer —— none came`, and it
        // is not what joins two words into one.
        to0(cx + w * 0.06, h * (0.44 + R() * 0.06));
        to0(cx + w * (0.86 + R() * 0.16), h * (0.45 + R() * 0.06));
        cx += w * 0.2;
      } else {
        // the en- and em-dash, which on the page run on well past an em
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

    // Capitals from the 7 September notebook. The seven frequent forms have
    // repeated neighbours on the dot grid; the others below have title samples.
    // Every sampled capital keeps its own gesture. The existing steady draw
    // decides whether subsidiary strokes finish: the I's foot, A's bar and
    // H's bridge can fall short. Lowercase collisions still carry the word's
    // ambiguity. Unsampled capitals take the generic construction below.
    if (pen.traced && upper && NOTEBOOK_CAPITALS.has(raw)) {
      const capH = xh * (pen.capHeight + R() * 0.18);
      const breadth = 'MW'.includes(raw) ? 1.35 : 'DOCGQ'.includes(raw) ? 1.10 : 1;
      const w = size * (0.50 + R() * 0.08) * wide * breadth;
      const up = (a, b) => to(cx + w * a, y - capH * b);
      const path = points => { for (const [a, b] of points) up(a, b); };
      let advance = 1.12;
      lift();

      if (raw === 'T') {
        // Ta/Th/To: the stem sits left of centre; the long top reaches right.
        // In The it shelters a low h shoulder, not a second tall ascender.
        path([[0.34, 0.98], [0.36, 0.50], [0.40, 0.08], [0.51, 0.02]]);
        lift();
        path([[-0.08, 0.87], [0.49, 1.00], [1.11, 1.04]]);
        advance = 0.78;
        if (glyphs[gi + 1] === 'h' && joinsOn) {
          lift();
          path([[0.80, 0.48], [0.77, 0.14], [0.94, 0.13],
            [1.15, 0.39], [1.31, 0.12], [1.56, 0.09]]);
          advance = 1.62;
          gi++;
        }
      } else if (raw === 'I') {
        // I Widened / In: a straight stem with definite, unequal end bars.
        path([[0.06, 0.91], [0.76, 1.03]]); lift();
        path([[0.42, 0.96], [0.38, 0.52], [0.40, 0.04]]); lift();
        path([[0.06, 0.01], [traces ? 0.79 : 0.43, 0.09]]);
        advance = 0.90;
      } else if (raw === 'M' || raw === 'W') {
        // Ma/My and Waiter: rounded valleys, low middle, rising right end.
        // The second M pass sometimes barely descends after its middle peak.
        const middle = 0.65 + R() * 0.17;
        path([[0.05, 0.98], [0.02, 0.42], [0.12, 0.05], [0.33, 0.16],
          [0.55, middle], [0.67, 0.29], [0.90, 0.12], [1.16, 0.28],
          [1.24, raw === 'M' ? 0.24 : 0.90]]);
        advance = 1.32;
      } else if (raw === 'A') {
        // Aa/At/Ar: narrow apex, sometimes a loop in the left leg, low bar.
        path([[0.08, 0.03], [0.04, 0.41], [0.27, 1.03],
          [0.32, 1.05], [0.61, 0.38], [0.82, 0.02]]);
        lift(); path([[-0.03, 0.26], [traces ? 0.46 : 0.27, 0.29], [traces ? 0.96 : 0.57, 0.32]]);
        advance = 1.00;
      } else if (raw === 'H') {
        // Ha/He: hooked left entry/foot, shorter right stem, low connecting bar.
        path([[0.16, 1.03], [0.08, 0.64], [0.13, 0.05], [0.29, 0.01]]);
        lift(); path([[0.86, 0.95], [0.73, 0.66], [0.79, 0.03]]);
        lift(); path([[0.11, 0.40], [0.45, 0.32], [traces ? 0.88 : 0.62, 0.40]]);
        advance = 1.02;
      } else if (raw === 'D') {
        // Da/Do and Dallas: a short upright inside an almost circular bowl.
        path([[0.14, 0.96], [0.11, 0.43], [0.19, 0.02]]); lift();
        path([[0.04, 0.96], [0.38, 1.01], [0.82, 0.80], [0.95, 0.43],
          [0.77, 0.13], [0.28, 0.01]]);
      } else if ('OCGQ'.includes(raw)) {
        // Old / Circling / Goethe / Quiet: open circles, with their own exits.
        path([[0.83, 0.80], [0.58, 1.02], [0.20, 0.92], [0.04, 0.55],
          [0.16, 0.13], [0.50, 0.01], [0.87, 0.24]]);
        if (raw !== 'C') path([[0.97, 0.61], [0.77, traces ? 0.92 : 0.76]]);
        if (raw === 'G') { lift(); path([[0.53, 0.46], [1.00, 0.43], [0.91, 0.10]]); }
        if (raw === 'Q') { lift(); path([[0.56, 0.36], [0.87, 0.03], [1.12, -0.14]]); }
      } else if (raw === 'P' || raw === 'R' || raw === 'B') {
        // Problem/Poems, Reflexionen, Brahmanda: loop separate from the stem.
        path([[0.13, 0.01], [0.17, 0.62], [0.20, 0.98]]); lift();
        path([[0.08, 0.93], [0.45, 1.05], [0.88, 0.86], [0.83, 0.59], [0.21, 0.48]]);
        if (raw === 'R') path([[0.49, 0.40], [0.98, 0.04]]);
        if (raw === 'B') path([[0.66, 0.52], [0.94, 0.28], [0.71, 0.02], [0.17, 0.06]]);
      } else if (raw === 'S') {
        // Song/Summer: small upper turn and a broad open lower counter.
        path([[0.88, 0.91], [0.51, 1.04], [0.14, 0.89], [0.17, 0.62],
          [0.63, 0.48], [0.91, 0.25], [0.65, 0.04], [0.12, 0.06]]);
      } else if (raw === 'E' || raw === 'F' || raw === 'L') {
        // Epiphany/Family/Love: separate flat arms on an uneven left stem.
        path([[0.27, 1.00], [0.10, 0.47], [0.14, 0.02]]);
        if (raw !== 'F') up(0.93, 0.05);
        if (raw !== 'L') { lift(); path([[0.18, 0.92], [0.91, 1.02]]); lift(); path([[0.16, 0.52], [0.73, 0.58]]); }
      } else if (raw === 'N') {
        // New: narrow left upright, deep diagonal, right stem rising out of it.
        path([[0.10, 0.04], [0.11, 1.01], [0.22, 0.99],
          [0.77, 0.03], [0.92, 0.03], [0.87, 1.02]]);
      } else if (raw === 'U') {
        // Up: round bottom, a shorter right upright and a small exit.
        path([[0.08, 1.00], [0.04, 0.33], [0.25, 0.01], [0.64, 0.10],
          [0.86, 0.92], [0.85, 0.14], [1.02, 0.04]]);
      } else if (raw === 'Y') {
        // Yellow: two high arms meeting a curved descending stem.
        path([[0.06, 0.96], [0.29, 0.49], [0.62, 0.48], [0.91, 0.96]]);
        lift(); path([[0.83, 0.87], [0.62, 0.15], [0.38, -0.13], [0.12, -0.06]]);
      }
      lift();
      cx += w * advance + size * (0.035 + R() * 0.065) * pen.gap;
      continue;
    }

    // The generic construction remains for unsampled capitals (J/K/V/X/Z)
    // without letting them slip into a lowercase branch.
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
      const bar = R() < pen.plus ? 0.56 + R() * 0.09 : 0.74 + R() * 0.1;
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
      if (R() < Math.max(0.02, pen.lift - hand.temper * pen.join)) lift();
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

      if ((char === 't' || char === 'f') || R() < pen.crossbar) {
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
    if (R() < Math.max(0.02, pen.lift - hand.temper * pen.join)) lift();
    cx += size * (0.035 + R() * 0.065) * pen.gap;
  }

  if (R() < pen.flourish) to(cx + size * (0.14 + R() * 0.24), y - xh * (0.12 + R() * 0.32));
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
 *
 * The digest is also *trimmed* to that target, and this is what decides how
 * big the hand on the index is drawn. It used to only ever grow: it started
 * at the longest line in the poem and appended more lines until the row was
 * full, but never cut anything, so a poem carrying one very long line had
 * its signature sized by that line and written small. Nothing else was
 * holding it back — the row is 257 by 26, and at 26 the height cap never
 * came near binding, which is why making the box taller changes nothing at
 * all. Measured: the same poem at 26px, 40px and 80px of height draws at
 * exactly the same size, while doubling the *width* nearly doubles it.
 *
 * Trimming to the target instead of only growing to it gives the hand about
 * half again the size on most poems, in the same box, still writing a real
 * run of the poem's own lines. It stops at a word so the mark keeps whole
 * words' shapes, which is the whole of what it is imitating.
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

  // Cut back to the target on a word boundary. Never below four words: a
  // signature has to look like writing, and three shapes is a monogram.
  const words = joined.split(/\s+/);
  while (words.length > 4 && lineUnits(words.join(' '), pen) > targetUnits) {
    words.pop();
  }

  return words.join(' ');
}

/**
 * Choose a letter size so the poem's longest line very nearly fills the
 * width and the whole poem fits the height.
 *
 * The advance per glyph is random, so this estimates it: measured against
 * the generator, a line runs about 0.44 units per character plus 0.87 per
 * word gap, per unit of size.
 */
function fitSize(lines, width, height, maxLines, pen, maxSize = 16) {
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
    return clamp(Math.min(maxSize, (width * 0.92) / widest, heightCap), 2.4, maxSize);
  }

  const rows = maxLines ? Math.min(count, maxLines) : count;
  // 2.95 is the leading multiple; the extra row leaves the ascenders room
  const byHeight = rows > 0 ? height / ((rows + 0.9) * 2.95) : byWidth;

  // 16 is the house maximum, and it is a maximum for a mark that sits beside
  // something else — a column next to a poem, a signature under a title. It
  // is not a maximum for a page whose entire content is seven words: there
  // the geometry says 38 and the ceiling was cutting it to 16, which is why
  // seven large words came out the size of a caption. `maxSize` lifts it for
  // that one caller and leaves every other mark exactly where it was.
  return Math.max(2.4, Math.min(maxSize, Math.min(byWidth, byHeight)));
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
 * wrote taller or wider than the room it had, with one uniform scale and
 * the nib included in the bounds. Only whole marks are settled.
 * A poem's column is meant to run past the bottom of its plate, and moving it
 * would be moving the composition.
 */
function settle(strokes, height, width, x = 0) {
  let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity;
  for (const stroke of strokes) {
    // The painter's quadratics stay within their control-point hull. Include
    // half the widest nib as well, so an intact path cannot lose its ink edge.
    const radius = (Array.isArray(stroke.lw) ? Math.max(...stroke.lw) : stroke.lw || 0) / 2;
    for (const [px, py] of stroke.pts) {
      top = Math.min(top, py - radius); bottom = Math.max(bottom, py + radius);
      left = Math.min(left, px - radius); right = Math.max(right, px + radius);
    }
  }
  if (!Number.isFinite(top)) return strokes;

  const padY = Math.max(0.5, height * 0.04);
  const padX = Math.min(2, width * 0.01);
  const roomY = Math.max(1, height - padY * 2);
  const roomX = Math.max(1, width - padX * 2);
  const scale = Math.min(1, roomY / Math.max(1, bottom - top), roomX / Math.max(1, right - left));
  const shiftY = padY + (roomY - (bottom - top) * scale) / 2 - top * scale;
  // Preserve the opening inset when it fits; correct only an overflowing edge.
  const inset = clamp((left - x) * scale, padX, width - padX - (right - left) * scale);
  const shiftX = x + inset - left * scale;

  for (const stroke of strokes) {
    for (const point of stroke.pts) {
      point[0] = point[0] * scale + shiftX;
      point[1] = point[1] * scale + shiftY;
    }
    if (scale !== 1) {
      stroke.lw = Array.isArray(stroke.lw)
        ? stroke.lw.map(weight => weight * scale) : stroke.lw * scale;
    }
  }
  return strokes;
}

/**
 * The longest line anyone in this book has written, and the length a broken
 * paragraph is written at.
 *
 * Every poem here was verse until Atlas, which is prose: its stanzas are
 * paragraphs, and a paragraph arrives as one source line of five hundred
 * characters where the longest line of verse in the book is eighty-six.
 * Exactly two lines in the corpus are over a hundred and twenty, and both of
 * them are Atlas.
 *
 * That gap is the whole of the rule below, and it is why the threshold is a
 * count of characters rather than a share of the box. A share of the box
 * would call a verse line a paragraph whenever the box was narrow — a column
 * beside a poem is three hundred pixels wide and every line in it wraps —
 * and the thing being identified here is not too wide for its column, it is
 * too long to be a line at all. A hand writes in lines of roughly this
 * length whatever it is writing on.
 */
const LINE_LIMIT = 120;
const LINE_TARGET = 80;

/**
 * A paragraph broken into lines, because a paragraph is not a line.
 *
 * `fitSize()` reads the width of the longest source line and picks a size
 * that very nearly fills the column with it, and `ghost()` then wraps
 * anything that still does not fit. Those two are right for verse and wrong
 * for prose in the same way: a five-hundred-character paragraph is measured
 * as a single line to be fitted, so the fitter shrinks the entire page until
 * that paragraph fits across it. Atlas capped the hand at 3.45 where the next
 * worst line in the book allows 16.5 and the median allows 46, and the
 * writing came out as a thin band of ink stranded in the middle of the box —
 * 42 pixels of a 620 pixel plate, against 245 to 748 for every other poem.
 *
 * Wrapping at draw time cannot save it, because by then the size is chosen:
 * the paragraph has already been made small enough not to need wrapping. The
 * break has to happen before the fitter measures anything, and then the rows
 * it becomes are counted against the height like any other lines.
 *
 * Only the multi-line path uses this. A signature is one line by definition
 * and `signatureLine()` already trims a long source line to the width it has.
 */
function breakParagraph(line) {
  if (line.length <= LINE_LIMIT) return [line];

  const words = line.split(/\s+/).filter(Boolean);
  const rows = [];
  let row = '';

  for (const word of words) {
    if (row && row.length + 1 + word.length > LINE_TARGET) {
      rows.push(row);
      row = word;
    } else {
      row = row ? row + ' ' + word : word;
    }
  }
  if (row) rows.push(row);

  // A single unbroken run of characters has no word boundary to break on.
  // It is written as it stands and wrapped at draw time, as before.
  return rows.length ? rows : [line];
}

/**
 * A stroke opens, and it closes.
 *
 * The width model reads direction and turn, so it has nothing to say about the
 * pen arriving on the paper or coming off it: every mark was the same line at
 * its ends as in its middle, finished with a round cap. Measured on a
 * title-size trace, the last sample of a stroke carried 1.00 of the ink its
 * middle carried, and 0.77 of the width.
 *
 * The ramps run in arc length, not in points. The generator's points are not
 * evenly spaced, so an index-counted ramp would taper a long segment and a
 * short one by the same amount. Neither ramp may eat more than its share of a
 * short mark, or a tick would be all opening and close and have no line.
 *
 * The opening is short and firm and the close is longer, because a hand puts a
 * pen down more decisively than it takes it off.
 */
const LEAD = 0.55;        // the share of its own width a stroke opens at
const LIFT = 0.28;        // and the share it closes to
const LEAD_RUN = 0.30;    // how far the opening runs, in units of the letter size
const LIFT_RUN = 0.60;    // and the close

function taperEnds(pts, lw, size) {
  if (!Array.isArray(lw) || lw.length < 3) return lw;

  const arc = [0];
  for (let i = 1; i < pts.length; i++) {
    arc.push(arc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = arc[arc.length - 1];
  if (!(total > 0)) return lw;

  const lead = Math.min(total * 0.22, size * LEAD_RUN);
  const lift = Math.min(total * 0.34, size * LIFT_RUN);

  for (let i = 0; i < lw.length; i++) {
    let f = 1;
    if (lead > 0 && arc[i] < lead) {
      f *= LEAD + (1 - LEAD) * Math.pow(arc[i] / lead, 0.5);
    }
    const back = total - arc[i];
    if (lift > 0 && back < lift) {
      f *= LIFT + (1 - LIFT) * Math.pow(back / lift, 0.85);
    }
    lw[i] *= f;
  }
  return lw;
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
  //
  // Neither does a title, at any number of rows. The furniture is the record
  // of someone changing their mind mid-sentence — a word struck out, a word
  // remembered late and squeezed in above the line on a caret — and a title
  // is not a sentence anybody was midway through. Struck through, a poem
  // reads as withdrawn; carrying a superscript afterthought, it reads as
  // still being decided. `maxLines !== 1` cannot express that on its own,
  // because a two-row title is not a column.
  const furnished = pen.furniture && maxLines !== 1 && opts.furniture !== false;
  const sourceLines = String(text || '').split('\n');
  const lines = maxLines === 1
    ? [signatureLine(sourceLines, width, height, pen)]
    : sourceLines.flatMap(breakParagraph);

  // The hand is scaled to the space it is given, so a poem's longest line
  // very nearly fills the column and the whole poem fits the height. Fixing
  // the size instead leaves the marks stranded in a corner of the canvas.
  const size = opts.size || fitSize(lines, width, height, maxLines, pen, opts.maxSize || 16);
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
    if (R() < pen.accent) {
      phraseInk = accentInk(R);
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
    let gap = afterStanza && R() < pen.stanzaRest ? 'stanza' : 'line';
    afterStanza = false;

    while (wi < words.length && guard++ < 200) {
      const m = wordMark(cx, hand.baseline, words[wi], size, R, hand);

      // A single row is drawn in full and fitted to its actual ink bounds at
      // the end. Wrapping it used to silently discard its last word.
      // A word that will not fit even on a line of its own is written anyway.
      // Wrapping it again only moves it to another line it cannot fit either,
      // and the guard below then gives up with nothing drawn at all.
      if (maxLines !== 1 && m.end > x + width && cx > hand.startX + 0.01) {
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
        taperEnds(pts, lw, size);
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
        if (R() < pen.strike) scrap(strikeOut(cx, hand.baseline, m.end - cx, size, R), 1.05);

        // A word left out. The caret goes in where it belongs and the word
        // itself is squeezed in above the line, small, running toward the
        // right margin — the notebook never rewrites the line to make room.
        if (R() < pen.caret) {
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
      gap = R() < pen.caught ? 'caught' : 'word';
      cx = m.end + size * (0.62 + R() * 0.5);
      wi++;
    }

    // A number ringed out in the left margin, against a line now and then.
    if (furnished && R() < pen.note) {
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
  if (furnished && used > 2 && R() < pen.arrow) {
    const arrow = continuationArrow(x + width * (0.52 + R() * 0.24), by - leading * 0.2, size, R);
    for (const pts of arrow) {
      out.push({
        pts, ink: 'mark', alpha: 0.5 + R() * 0.3,
        lw: Math.max(0.5, size * 0.062), curve: pen.curve, gap: 'letter'
      });
    }
  }

  return maxLines === 1 ? settle(out, height, width, x) : out;
}

/** Reads the ink triples from CSS so marks follow the active theme. */
export function palette() {
  const s = getComputedStyle(document.documentElement);
  const v = (n, d) => (s.getPropertyValue(n) || d).trim();
  return {
    mark: v('--i-mark', '35,33,28'),
    green: v('--i-green', '26,74,52'),
    rust: v('--i-rust', '112,49,36'),
    navy: v('--i-navy', '45,63,120')
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
  ctx.strokeStyle = inkOf(pal, s);
  tracePath(ctx, s, upto, 1);
}

/**
 * The path of one mark, laid down at `nib` times its plotted width.
 *
 * Both painters run through here, so the ballpoint and the old translucent
 * stroke are the same journey at different weights, and the geometry has one
 * home rather than two that can drift apart.
 */
function tracePath(ctx, s, upto, nib, floor = 0) {
  const p = s.pts;
  if (!p || p.length < 2) return;
  const last = upto ? Math.min(upto.segment, p.length - 1) : p.length - 1;
  if (last < 1) return;

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
      ctx.lineWidth = Math.max((Array.isArray(s.lw) ? (s.lw[j - 1] + s.lw[j]) * 0.5 : s.lw) * nib, floor);
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
    ctx.lineWidth = Math.max((Array.isArray(s.lw) ? (s.lw[j - 1] + s.lw[j]) * 0.5 : s.lw) * nib, floor);
    ctx.stroke();
  }
}

/**
 * Lift the ink off one end of a mark.
 *
 * `taperEnds` thins the geometry, but a line drawn on the mask reaches the same
 * peak wherever it is wider than the ball, so thinning alone changes the shape
 * of an end without changing its density: it still arrives at full strength and
 * stops. This takes the ink off with it.
 *
 * The ramp is a gradient laid along the last run of the path, and the path is
 * stroked through it once. Fading segment by segment would erase every shoulder
 * twice, which is the bead the mask was built to remove, turned inside out.
 */
function fadeTip(lc, pts, atEnd, run, fade) {
  const n = pts.length;

  // A short mark has to keep a middle. Without this the two ramps meet and a
  // tick is written entirely in touch-down and lift, with no line in between.
  // The shares are the ones `taperEnds` holds the geometry to.
  let total = 0;
  for (let k = 1; k < n; k++) {
    total += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
  }
  if (!(total > 0)) return;
  run = Math.min(run, total * (atEnd ? 0.34 : 0.22));

  const step = atEnd ? -1 : 1;
  let i = atEnd ? n - 1 : 0;
  const tip = pts[i];
  const path = [tip];
  let widest = tip.width;
  let gone = 0;

  while (i + step >= 0 && i + step < n && gone < run) {
    const next = pts[i + step];
    gone += Math.hypot(next.x - pts[i].x, next.y - pts[i].y);
    path.push(next);
    if (next.width > widest) widest = next.width;
    i += step;
  }
  if (path.length < 2 || gone <= 0) return;

  const back = path[path.length - 1];
  const ramp = lc.createLinearGradient(tip.x, tip.y, back.x, back.y);
  ramp.addColorStop(0, 'rgba(0,0,0,' + fade + ')');
  ramp.addColorStop(1, 'rgba(0,0,0,0)');
  lc.strokeStyle = ramp;
  lc.lineWidth = widest * NIB + 1.4;
  lc.beginPath();
  lc.moveTo(path[0].x, path[0].y);
  for (let k = 1; k < path.length; k++) lc.lineTo(path[k].x, path[k].y);
  lc.stroke();
}

/**
 * The pen: a fine ballpoint line with a little fountain-pen pooling at the turns.
 *
 * The old painter stroked every segment separately at a translucent alpha, so
 * each shoulder was painted twice and the marks wore a dark bead at every join.
 * That is the one thing a written line never does. The ink is now laid down
 * opaquely on a mask and the mask is composited once, so a mark can cross itself
 * as often as it likes and still read as a single pass of a pen.
 *
 * Over that: a nib finer than the plotted width, a faint groove lifted back out
 * along the run with the occasional skip, paper grain taken out in page
 * coordinates rather than along the stroke, and a soft blurred pass at low
 * weight for the wet edge. Ink gathers only where the hand genuinely changes
 * direction. The ballpoint is what you read; the fountain pen is only the
 * weather around it.
 */
const NIB = 0.6;             // the ballpoint runs finer than the plotted width
const HAIRLINE = 1;          // but never thinner than a pixel, or the hand greys out
const BALL = 1;              // and a ball cannot draw under its own width at all
const INK_GAIN = 1.1;        // the mask lays the weight down once, so the line carries it
const BLOOM_SHARE = 0.16;    // share of that weight given to the soft edge
const BLOOM_THIN = 0.07;     // a mark too thin to hold an edge keeps its weight in the line
const BROAD = 1.2;           // px of plotted width at which a mark can carry a wet edge
const BLOOM_BLUR = 0.55;     // px; softer than this and the line stops being fine
const POOL_GAIN = 0.13;      // ink gathered per unit of turn
const POOL_CAP = 0.065;      // and never more than this, or it overpowers the line
const GRAIN = 0.05;          // grain dots per square px of page
const GROOVE = 0.25;         // how much of the groove is lifted out
const TIP_FADE = 0.82;       // ink lifted at the very tip of a finished mark
const TIP_LEAD_RUN = 1.3;    // how far the touch-down fade runs, in plotted widths
const TIP_LIFT_RUN = 2.4;    // and the lift, which the hand takes longer over
const STEP = 1.4;            // px between the samples the groove and pools read

/**
 * How fine this mark's nib runs.
 *
 * A broad mark is thinned to the ballpoint's width. A mark already at or under
 * a pixel is left alone: there is no finer line to be had, and thinning it only
 * spreads it across the antialiasing and drains it.
 */
function nibFor(s) {
  const plotted = Array.isArray(s.lw) ? Math.max(...s.lw) : s.lw;
  if (!plotted) return 1;
  return Math.max(NIB, Math.min(1, HAIRLINE / plotted));
}

/** Coarse samples along a mark, for the effects that read its direction. */
function samplePath(s, upto, step) {
  const p = s.pts;
  if (!p || p.length < 2) return [];
  const last = upto ? Math.min(upto.segment, p.length - 1) : p.length - 1;
  if (last < 1) return [];

  const mid = (a, b) => [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5];
  const widthAt = j => (Array.isArray(s.lw) ? s.lw[j] : s.lw) || 0;
  const out = [];

  for (let j = 1; j <= last; j++) {
    const partial = upto && j === last && upto.fraction < 1;
    const a = p[j - 1];
    const b = p[j];
    const stop = partial
      ? [a[0] + (b[0] - a[0]) * upto.fraction, a[1] + (b[1] - a[1]) * upto.fraction]
      : b;
    const w0 = widthAt(j - 1);
    const w1 = widthAt(j);

    if (s.curve === false) {
      const steps = Math.max(2, Math.ceil(Math.hypot(stop[0] - a[0], stop[1] - a[1]) / step));
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        out.push({ x: a[0] + (stop[0] - a[0]) * t, y: a[1] + (stop[1] - a[1]) * t, width: w0 + (w1 - w0) * t });
      }
      continue;
    }

    // the same quadratic the painter traces: in at the midpoint behind, out at
    // the midpoint ahead, with the plotted point as the control
    const from = j === 1 ? p[0] : mid(p[j - 2], p[j - 1]);
    const to = partial ? stop : (j === p.length - 1 ? p[j] : mid(p[j - 1], p[j]));
    const c = p[j - 1];
    const steps = Math.max(3, Math.ceil(
      (Math.hypot(c[0] - from[0], c[1] - from[1]) + Math.hypot(to[0] - c[0], to[1] - c[1])) / step
    ));
    for (let k = 0; k <= steps; k++) {
      const t = k / steps, u = 1 - t;
      out.push({
        x: u * u * from[0] + 2 * u * t * c[0] + t * t * to[0],
        y: u * u * from[1] + 2 * u * t * c[1] + t * t * to[1],
        width: w0 + (w1 - w0) * t
      });
    }
  }
  return out;
}

/**
 * A scratch surface the size of the canvas being painted.
 *
 * Kept and reused, because the write-on repaints every frame. Where there is no
 * surface to be had — the node tests, which have no canvas at all — the caller
 * falls back to the old painter, which needs nothing but a path.
 */
let scratch = null;
function scratchFor(width, height) {
  if (scratch && scratch.width === width && scratch.height === height) return scratch;
  if (typeof OffscreenCanvas === 'function') {
    scratch = new OffscreenCanvas(width, height);
    return scratch;
  }
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    scratch = document.createElement('canvas');
    scratch.width = width;
    scratch.height = height;
    return scratch;
  }
  return null;
}

/**
 * Paint a set of marks, each optionally stopped part of the way along it.
 *
 * Marks are gathered by ink and by weight before anything is drawn, so the mask
 * is built and composited a handful of times rather than once per mark. Two
 * marks of the same weight may overlap on the mask without darkening, which is
 * the whole point of it.
 */
function paintMarks(ctx, marks, pal) {
  if (!marks.length) return;

  const canvas = ctx.canvas;
  const layer = canvas && canvas.width && canvas.height
    ? scratchFor(canvas.width, canvas.height)
    : null;

  if (!layer || typeof ctx.getTransform !== 'function') {
    // No surface to lay ink on: the old translucent stroke, beads and all.
    for (const mark of marks) drawStroke(ctx, mark.s, pal, mark.upto);
    return;
  }

  const dpr = ctx.getTransform().a || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  const lc = layer.getContext('2d');

  const weights = new Map();
  for (const mark of marks) {
    const step = Math.round((mark.s.alpha == null ? 1 : mark.s.alpha) * 20);
    const plotted = Array.isArray(mark.s.lw) ? Math.max(...mark.s.lw) : mark.s.lw;
    const broad = plotted >= BROAD;
    const key = (mark.s.ink || 'mark') + '|' + step + '|' + (broad ? 'b' : 't');
    let group = weights.get(key);
    if (!group) {
      group = { ink: pal[mark.s.ink] || pal.mark, alpha: step / 20, broad, marks: [] };
      weights.set(key, group);
    }
    group.marks.push(mark);
  }

  for (const group of weights.values()) {
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.clearRect(0, 0, layer.width, layer.height);
    lc.setTransform(dpr, 0, 0, dpr, 0, 0);
    lc.globalCompositeOperation = 'source-over';
    lc.globalAlpha = 1;
    lc.lineCap = 'round';
    lc.lineJoin = 'round';
    lc.strokeStyle = 'rgb(' + group.ink + ')';

    for (const mark of group.marks) tracePath(lc, mark.s, mark.upto, nibFor(mark.s), BALL);

    // The groove a ballpoint leaves, and the skips where it fails to take.
    lc.globalCompositeOperation = 'destination-out';
    lc.lineWidth = 0.8;
    for (const mark of group.marks) {
      // Only a mark broad enough to hold a groove is given one; on a hairline
      // it would read as the line simply fading, which is not the same thing.
      const plotted = Array.isArray(mark.s.lw) ? Math.max(...mark.s.lw) : mark.s.lw;
      lc.globalAlpha = GROOVE * clamp((plotted - 0.9) / 1.1, 0, 1);
      if (!lc.globalAlpha) continue;
      const pts = samplePath(mark.s, mark.upto, STEP);
      lc.beginPath();
      for (let i = 0; i < pts.length; i++) {
        if (i % 48 >= 32) continue;
        if (i % 48 === 0) lc.moveTo(pts[i].x + pts[i].width * 0.07, pts[i].y);
        else lc.lineTo(pts[i].x + pts[i].width * 0.07, pts[i].y);
      }
      lc.stroke();
    }

    // The pen coming off the paper, and arriving on it. Gated on width the way
    // the groove is: on a hairline there is no taper to be had, and fading one
    // only greys it out, which is the thing the ball floor was put in to stop.
    lc.globalAlpha = 1;
    for (const mark of group.marks) {
      const plotted = Array.isArray(mark.s.lw) ? Math.max(...mark.s.lw) : mark.s.lw;
      const strength = clamp((plotted - 0.9) / 1.1, 0, 1);
      if (!strength) continue;
      const pts = samplePath(mark.s, mark.upto, STEP);
      if (pts.length < 4) continue;
      fadeTip(lc, pts, false, plotted * TIP_LEAD_RUN, TIP_FADE * 0.5 * strength);
      // a mark still being written ends at the pen, and the pen is on the paper
      if (!mark.upto) fadeTip(lc, pts, true, plotted * TIP_LIFT_RUN, TIP_FADE * strength);
    }

    lc.globalCompositeOperation = 'source-over';

    const weight = Math.min(1, 0.85 * group.alpha * INK_GAIN);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = weight * (group.broad ? BLOOM_SHARE : BLOOM_THIN);
    ctx.filter = 'blur(' + BLOOM_BLUR + 'px)';
    ctx.drawImage(layer, 0, 0, w, h);
    ctx.filter = 'none';
    ctx.globalAlpha = weight;
    ctx.drawImage(layer, 0, 0, w, h);

    // Ink gathers where the hand actually turns — not at every sampled point,
    // which is what makes a bead rather than a pool.
    ctx.lineCap = 'round';
    for (const mark of group.marks) {
      const pts = samplePath(mark.s, mark.upto, STEP);
      for (let i = 4; i < pts.length - 4; i += 5) {
        const a = pts[i - 4], b = pts[i], c = pts[i + 4];
        const ax = b.x - a.x, ay = b.y - a.y, bx = c.x - b.x, by = c.y - b.y;
        const turn = 1 - (ax * bx + ay * by) /
          Math.max(0.001, Math.hypot(ax, ay) * Math.hypot(bx, by));
        ctx.globalAlpha = clamp(turn * POOL_GAIN, 0, POOL_CAP) * weight;
        ctx.lineWidth = b.width * NIB * 0.55;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(b.x, b.y, c.x, c.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Paper grain, fixed in page coordinates rather than carried along the
  // stroke, so it reads as the sheet and not as a texture painted on the ink.
  const rand = rngFor('paper-grain');
  // How much grain the hand can take: a broad mark is textured by it, a fine one
  // is only eaten away, so the spatter lightens as the marks get finer.
  let broadest = 0;
  for (const mark of marks) {
    const plotted = Array.isArray(mark.s.lw) ? Math.max(...mark.s.lw) : mark.s.lw;
    if (plotted > broadest) broadest = plotted;
  }
  const grainWeight = clamp((broadest - 0.6) / 1.2, 0.25, 1);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  const dots = Math.round(w * h * GRAIN);
  for (let i = 0; i < dots; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const size = 0.15 + rand() * 0.45;
    ctx.globalAlpha = (0.1 + rand() * 0.31) * grainWeight;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.65, -0.65, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function paint(ctx, strokes) {
  const pal = palette();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  paintMarks(ctx, strokes.map(s => ({ s, upto: null })), pal);
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
  const marks = [];

  for (let i = 0; i < strokes.length; i++) {
    const span = plan.spans[i];
    if (!span) continue;
    if (span.start >= travelled) break;

    if (span.start + span.length <= travelled) {
      marks.push({ s: strokes[i], upto: null });
      continue;
    }

    // The pen is inside this stroke: find the segment it is crossing.
    const into = travelled - span.start;
    let segment = 0;
    while (segment < span.marks.length - 1 && span.marks[segment] < into) segment++;
    const before = segment === 0 ? 0 : span.marks[segment - 1];
    const width = span.marks[segment] - before;
    marks.push({
      s: strokes[i],
      upto: { segment: segment + 1, fraction: width > 0 ? (into - before) / width : 1 }
    });
    break;
  }

  paintMarks(ctx, marks, pal);
}
