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
 * pages: angular rather than looped, sharp peaks joined by straight
 * segments, ascenders near three times the x-height, long hooked
 * descenders, frequent pen lifts, crossbars that overshoot, a fine even
 * line, and a slight forward lean.
 */

const SLANT = 0.13;

const INKS = [
  'mark', 'mark', 'mark', 'mark', 'mark', 'mark', 'mark',
  'green', 'olive', 'blue'
];

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

/** One word: the motion a hand makes writing it, with no letters in it. */
function wordMark(x, y, letters, size, R) {
  const strokes = [];
  let cur = [];
  let cx = x;

  const xh = size * 0.46;
  const asc = size * 1.45;
  const desc = size * 0.72;
  const glyphs = Math.max(1, Math.min(10, Math.round(letters / 1.45)));

  const lift = () => {
    if (cur.length > 1) strokes.push(cur);
    cur = [];
  };
  const to = (px, py) => {
    const yy = py + (R() - 0.5) * 0.55;
    cur.push([px + (y - yy) * SLANT, yy]);
  };

  for (let g = 0; g < glyphs; g++) {
    const r = R();

    if (r < 0.16) {
      // ascender — l h k b d t f
      const w = size * 0.16;
      to(cx, y);
      to(cx + w * 0.6, y - asc * (0.85 + R() * 0.32));
      to(cx + w * 1.1, y - xh * 0.2);
      to(cx + w * 1.7, y);
      if (R() < 0.34) {
        lift();
        to(cx - size * 0.06, y - asc * 0.56);
        to(cx + size * 0.44, y - asc * 0.62);
        lift();
      }
      cx += w * 1.9;
    } else if (r < 0.28) {
      // descender — g y p j q
      to(cx, y - xh);
      to(cx + size * 0.16, y);
      to(cx + size * 0.3, y - xh * 0.9);
      to(cx + size * 0.3, y + desc * (0.8 + R() * 0.5));
      to(cx + size * 0.02, y + desc * (0.9 + R() * 0.4));
      cx += size * 0.36;
    } else {
      // angular peaks — n m w v r i u
      const peaks = 1 + Math.floor(R() * 2.7);
      to(cx, y);
      for (let p = 0; p < peaks; p++) {
        const w = size * (0.15 + R() * 0.1);
        to(cx + w * 0.5, y - xh * (0.85 + R() * 0.35));
        to(cx + w, y);
        cx += w;
      }
    }

    if (R() < 0.24) lift(); // semi-joined, not true cursive
    cx += size * (0.03 + R() * 0.06);
  }

  if (R() < 0.4) to(cx + size * (0.15 + R() * 0.3), y - xh * (0.2 + R() * 0.5));
  lift();

  return { strokes, end: cx };
}

/**
 * Render a poem's real lines as unreadable writing inside a box.
 * Blank lines in the source become stanza gaps, so the block keeps the
 * poem's actual shape.
 */
export function ghost(text, opts) {
  const { x = 0, y = 0, width, bottom, size = 5.2, leading = size * 2.95, maxLines = 0 } = opts;
  const R = opts.rng;
  const out = [];
  const lines = String(text || '').split('\n');

  let by = y;
  let used = 0;

  for (const raw of lines) {
    const line = raw.replace(/\*/g, '').trim();
    if (!line) {
      by += leading * 0.62;
      continue;
    }
    if (maxLines && used >= maxLines) break;
    if (bottom && by > bottom) break;

    const words = line.split(/\s+/);
    const lineInk = INKS[Math.floor(R() * INKS.length)];
    let cx = x;
    let wi = 0;
    let guard = 0;

    while (wi < words.length && guard++ < 200) {
      const m = wordMark(cx, by, words[wi].length, size, R);

      if (m.end > x + width) {
        // the line wraps, and the continuation is indented
        by += leading;
        used++;
        cx = x + size * 0.9;
        if (maxLines && used >= maxLines) break;
        if (bottom && by > bottom) break;
        continue;
      }

      const ink = R() < 0.84 ? lineInk : INKS[Math.floor(R() * INKS.length)];
      const alpha = 0.6 + R() * 0.4;
      const lw = 0.5 + R() * 0.2;
      for (const s of m.strokes) out.push({ pts: s, ink, alpha, lw });

      cx = m.end + size * (0.62 + R() * 0.5);
      wi++;
    }

    by += leading;
    used++;
  }

  return out;
}

/** Reads the ink triples from CSS so marks follow the active theme. */
export function palette() {
  const s = getComputedStyle(document.documentElement);
  const v = (n, d) => (s.getPropertyValue(n) || d).trim();
  return {
    mark: v('--i-mark', '35,33,28'),
    green: v('--i-green', '26,74,52'),
    olive: v('--i-olive', '116,110,62'),
    blue: v('--i-blue', '74,88,110'),
    arc: v('--i-arc', '122,110,66')
  };
}

export function paint(ctx, strokes, upto) {
  const pal = palette();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const n = upto === undefined ? strokes.length : upto;

  for (let i = 0; i < n; i++) {
    const s = strokes[i];
    const p = s.pts;
    if (!p || p.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let j = 1; j < p.length; j++) ctx.lineTo(p[j][0], p[j][1]);
    ctx.strokeStyle = 'rgba(' + (pal[s.ink] || pal.mark) + ',' + 0.62 * s.alpha + ')';
    ctx.lineWidth = s.lw;
    ctx.stroke();
  }
}
