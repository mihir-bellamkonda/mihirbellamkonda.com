/**
 * Asemic writing — marks with the shape of writing and no words in them.
 *
 * Every mark on the site is generated from a real poem's line and word
 * structure, so the illegible column beside a poem is genuinely a poem,
 * rendered unreadable. It is seeded from a string, which means a poem's
 * signature is identical on every load, for every reader, forever. It
 * belongs to the poem rather than to the visit.
 *
 * The letterforms are modelled on Mihir's hand, from photographed notebook
 * pages: loose print-cursive, open bowls and broad humps, short upright
 * ascenders, long hooked descenders, high dots, frequent pen lifts,
 * crossbars that overshoot, and a fine line with responsive pressure.
 */

const SLANT = 0.055;

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
  let cur = [];
  let cx = x;

  const xh = size * 0.52;
  const asc = size * 0.98;
  const desc = size * 0.78;
  const glyphs = Array.from(String(word || '').toLowerCase());
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
    const yy = lineY + hand.dy;
    cur.push([px + hand.dx + (y - yy) * hand.slant, yy]);
  };

  const dot = (px, py) => {
    lift();
    to(px, py);
    to(px + size * 0.035, py - size * 0.012);
    lift();
  };

  for (const char of glyphs) {
    const isAscender = ASCENDERS.has(char);
    const isDescender = DESCENDERS.has(char);
    const h = xh * (0.88 + R() * 0.22);

    if (isAscender) {
      // ascender — l h k b d t f
      const w = size * (0.31 + R() * 0.055);
      const tall = asc * (0.88 + R() * 0.2);
      if (char === 'd') {
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
    } else if (isDescender) {
      // descender — g y p j q
      const w = size * (0.34 + R() * 0.065);
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
      const w = size * (0.34 + R() * 0.08);
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
      const w = size * (0.2 + R() * 0.035);
      to(cx, y - h * 0.82);
      to(cx + w * 0.2, y);
      to(cx + w, y - h * 0.06);
      dot(cx + w * 0.06, y - h * 1.46);
      cx += w;
    } else if (char === 's') {
      const w = size * (0.31 + R() * 0.06);
      to(cx + w * 0.9, y - h * 0.88);
      to(cx + w * 0.38, y - h);
      to(cx + w * 0.12, y - h * 0.58);
      to(cx + w * 0.72, y - h * 0.4);
      to(cx + w * 0.92, y - h * 0.08);
      to(cx + w * 0.26, y);
      cx += w * 0.92;
    } else {
      // Broad humps rather than a sawtooth. Character identity sets their
      // count, while chance supplies the imperfect widths and shoulders.
      let peaks = HUMPS.has(char) ? (char === 'm' || char === 'w' ? 2 : 1) : 1;
      if (!HUMPS.has(char) && R() < 0.18) peaks++;
      to(cx, y);
      for (let p = 0; p < peaks; p++) {
        const w = size * (0.31 + R() * 0.09);
        to(cx + w * 0.2, y - h * (0.55 + R() * 0.12));
        to(cx + w * 0.56, y - h * (0.9 + R() * 0.12));
        to(cx + w * 0.82, y - h * (0.74 + R() * 0.1));
        to(cx + w, y);
        cx += w;
      }
    }

    if (R() < 0.45 + hand.temper * 0.16) lift(); // loose print-cursive, not a continuous hand
    cx += size * (0.035 + R() * 0.065);
  }

  if (R() < 0.32) to(cx + size * (0.14 + R() * 0.24), y - xh * (0.12 + R() * 0.32));
  lift();

  return { strokes, end: cx };
}

function lineUnits(line) {
  const words = line.split(/\s+/).filter(Boolean);
  const chars = line.replace(/\s/g, '').length;
  return 0.44 * chars + 0.87 * words.length;
}

/**
 * A row signature is a compact digest rather than the poem's first scrap.
 * Begin at its longest line, then continue through the poem until there is
 * enough material to cross the row at a height-safe letter size.
 */
function signatureLine(lines, width, height) {
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

  for (let step = 1; step < clean.length && lineUnits(joined) < targetUnits; step++) {
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
function fitSize(lines, width, height, maxLines) {
  let widest = 0;
  let count = 0;

  for (const raw of lines) {
    const line = raw.replace(/\*/g, '').trim();
    if (!line) continue;
    count++;
    widest = Math.max(widest, lineUnits(line));
  }

  if (!widest) return 5;

  const byWidth = (width * 0.96) / widest;
  if (maxLines === 1) {
    // Ascender + descender + slope room. Width chooses the size; height is
    // only the guardrail, which keeps the signature broad rather than tiny.
    const heightCap = height / 2.9;
    return clamp(Math.min(16, byWidth, heightCap), 2.4, 16);
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
  const R = opts.rng;
  const out = [];
  const sourceLines = String(text || '').split('\n');
  const lines = maxLines === 1
    ? [signatureLine(sourceLines, width, height)]
    : sourceLines;

  // The hand is scaled to the space it is given, so a poem's longest line
  // very nearly fills the column and the whole poem fits the height. Fixing
  // the size instead leaves the marks stranded in a corner of the canvas.
  const size = opts.size || fitSize(lines, width, height, maxLines);
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
      slant: SLANT * (1 + temper * 0.55) + (R() - 0.5) * Math.max(0.02, 0.05 + temper * 0.05),
      dx: 0,
      dy: 0,
      temper
    };
  };

  for (const raw of lines) {
    const line = raw.replace(/\*/g, '').trim();
    if (!line) {
      by += leading * 0.62;
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
    let gap = 'line';

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
        out.push({ pts, ink, alpha, lw, gap: opening ? gap : 'letter' });
        opening = false;
      }

      gap = 'word';
      cx = m.end + size * (0.62 + R() * 0.5);
      wi++;
    }

    by += leading * (0.965 + R() * 0.07);
    used++;
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
 */
function drawStroke(ctx, s, pal, upto) {
  const p = s.pts;
  if (!p || p.length < 2) return;
  const last = upto ? Math.min(upto.segment, p.length - 1) : p.length - 1;
  if (last < 1) return;

  ctx.strokeStyle = inkOf(pal, s);

  for (let j = 1; j <= last; j++) {
    const a = p[j - 1];
    let b = p[j];
    if (upto && j === last && upto.fraction < 1) {
      b = [a[0] + (b[0] - a[0]) * upto.fraction, a[1] + (b[1] - a[1]) * upto.fraction];
    }
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
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
  line: 0.22      // and it rests hardest before starting a line
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
