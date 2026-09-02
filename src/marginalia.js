/**
 * Marginalia — the marks around the writing rather than the writing itself.
 *
 * Torn edges, drawn rules, and the odd pencil arrow pointing at nothing.
 * Everything here is seeded the way the hand is: a poem's plate is torn the
 * same way on every load, for every reader, so the folio has a fixed shape
 * even though no two sheets in it are cut alike.
 */

import { rngFor } from './asemic.js';

const round = n => Math.round(n * 100) / 100;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * A torn edge rather than a cut one.
 *
 * The old plates all shared four hand-written polygons, so twenty-one poems
 * were torn from the same sheet in the same places. This cuts a sheet in two
 * passes instead. First the shape: corners taken off at their own angles, the
 * sides leaning in a little, which is the difference one plate has from the
 * next at arm's length. Then the tear itself: every side stepped along and
 * pulled off its line by a hair, which is what the edge does close up.
 *
 * `open` names a side that is neither cut nor torn: the layer runs past it
 * and is cropped by the frame, so a mark can carry on off the paper.
 */
export function deckle(seed, options = {}) {
  const R = typeof seed === 'function' ? seed : rngFor(seed);
  const {
    steps = 5,
    tear = 2.1,
    bite = 0.14,
    open = null
  } = options;

  const corners = [
    { at: [0, 0], along: [[1, 0], [0, 1]], sides: ['top', 'left'] },
    { at: [100, 0], along: [[0, 1], [-1, 0]], sides: ['right', 'top'] },
    { at: [100, 100], along: [[-1, 0], [0, -1]], sides: ['bottom', 'right'] },
    { at: [0, 100], along: [[0, -1], [1, 0]], sides: ['left', 'bottom'] }
  ];

  /**
   * Which corners come off.
   *
   * Never two that share a side. Cutting both ends of one edge leaves a
   * pinch between two diagonals — a sheet that reads as a sweet wrapper
   * rather than as torn paper. So a sheet loses one corner, or two opposite
   * ones, and keeps at least two square.
   */
  const first = Math.floor(R() * 4);
  const cutting = new Set([first]);
  if (R() < 0.45) cutting.add((first + 2) % 4);

  const shape = [];
  for (let i = 0; i < corners.length; i++) {
    const corner = corners[i];
    const held = corner.sides.includes(open);
    if (held || !cutting.has(i)) {
      shape.push([
        corner.at[0] + (R() - 0.5) * 3,
        corner.at[1] + (R() - 0.5) * 3
      ]);
      continue;
    }
    // Order matters more than size here. The outline is walked clockwise, so
    // a cut corner has to give up the vertex the walk arrives at before the
    // one it leaves by. Emitting them the other way round folds the outline
    // back through itself, and the sheet comes out pinched at that corner —
    // a sweet wrapper rather than a tear.
    const reach = 7 + R() * 15;
    const drop = 7 + R() * 15;
    shape.push([
      corner.at[0] + corner.along[1][0] * drop,
      corner.at[1] + corner.along[1][1] * drop
    ]);
    shape.push([
      corner.at[0] + corner.along[0][0] * reach,
      corner.at[1] + corner.along[0][1] * reach
    ]);
  }

  // The tear: each side walked, each step pulled off the line, mostly inward.
  const points = [];
  for (let i = 0; i < shape.length; i++) {
    const from = shape[i];
    const to = shape[(i + 1) % shape.length];
    const untorn = open && onSide(from, to, open);
    // A short edge — the diagonal left by a cut corner — cannot be torn as
    // deeply as a long one without the tear crossing the next edge and
    // leaving a spike behind.
    const run = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const bearable = Math.min(1, run / 42);

    for (let step = 0; step < steps; step++) {
      const t = step / steps;
      const x = from[0] + (to[0] - from[0]) * t;
      const y = from[1] + (to[1] - from[1]) * t;
      if (untorn) {
        points.push([x, y]);
        continue;
      }
      // Toward the middle of the sheet, since that is where the paper is.
      const dx = 50 - x;
      const dy = 50 - y;
      const span = Math.hypot(dx, dy) || 1;
      const depth = (R() < bite ? tear * (1.5 + R() * 1.2) : tear * (R() - 0.22)) * bearable;
      points.push([
        clamp(x + (dx / span) * depth, -3, 103),
        clamp(y + (dy / span) * depth, -3, 103)
      ]);
    }
  }

  return 'polygon(' + points.map(([x, y]) => `${round(x)}% ${round(y)}%`).join(', ') + ')';
}

/** Whether an edge runs along the named side of the sheet. */
function onSide(from, to, side) {
  const midX = (from[0] + to[0]) / 2;
  const midY = (from[1] + to[1]) / 2;
  if (side === 'top') return midY < 22;
  if (side === 'bottom') return midY > 78;
  if (side === 'left') return midX < 22;
  if (side === 'right') return midX > 78;
  return false;
}

/**
 * A drawn rule: the hairline between two rows, made by a hand with a ruler it
 * does not entirely trust. Returned as SVG path data in a 1000 × 8 box, to be
 * stretched across the row with a non-scaling stroke.
 *
 * The line is allowed to break — a pen leaves the paper — and to overrun its
 * end, so the rule is a gesture across the page rather than a border on a box.
 */
export function ruleMarks(seed, options = {}) {
  const R = typeof seed === 'function' ? seed : rngFor(seed);
  const { steps = 14, wobble = 0.62, gap = 0.4 } = options;

  const baseline = 4 + (R() - 0.5) * 1.1;
  const drift = (R() - 0.5) * 1.3;
  const start = R() * 9;
  const end = 1000 + (R() < 0.34 ? 6 + R() * 22 : -R() * 14);

  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push([
      start + (end - start) * t,
      baseline + drift * t + (R() - 0.5) * wobble * 2
    ]);
  }

  // One lift, in the middle third, on some of the rules.
  const lift = R() < gap ? 1 + Math.floor(R() * (steps - 2)) : -1;

  let d = '';
  let pen = false;
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    if (i === lift) {
      pen = false;
      continue;
    }
    if (!pen) {
      d += `M${round(x)},${round(y)}`;
      pen = true;
      continue;
    }
    // Smooth through the midpoints: a drawn line curves between its wobbles
    // rather than turning a corner at each one.
    const [px, py] = points[i - 1];
    d += `Q${round(px)},${round(py)} ${round((px + x) / 2)},${round((py + y) / 2)}`;
    if (i === points.length - 1) d += `L${round(x)},${round(y)}`;
  }

  return d;
}

/**
 * One pencil mark to a plate, meaning nothing.
 *
 * Twombly's arrows do not indicate; they are the gesture of indicating, and
 * they keep company with scribbles, spirals and little crossings-out that
 * mean no more than they do. Which one a poem gets is fixed by its seed.
 *
 * All four are drawn in the same 64 × 32 box, placed away from the middle of
 * the plate where the writing is, and turned to an angle that agrees with
 * nothing else in the composition.
 */
export function marginMark(seed) {
  const R = typeof seed === 'function' ? seed : rngFor(seed);

  const draw = R();
  const kind = draw < 0.42 ? 'arrow'
    : draw < 0.66 ? 'scribble'
      : draw < 0.85 ? 'spiral'
        : 'cross';

  const d = kind === 'arrow' ? arrowPath(R)
    : kind === 'scribble' ? scribblePath(R)
      : kind === 'spiral' ? spiralPath(R)
        : crossPath(R);

  // Kept out of the middle, where the writing is.
  const left = R() < 0.5 ? 4 + R() * 16 : 62 + R() * 22;
  const top = R() < 0.45 ? 8 + R() * 16 : 64 + R() * 24;

  return {
    kind,
    d,
    left: `${round(left)}%`,
    top: `${round(top)}%`,
    angle: `${round((R() - 0.5) * 84)}deg`,
    scale: round(0.8 + R() * 0.75)
  };
}

/** A wobbling line through a run of points, curved rather than cornered. */
function through(points) {
  let d = `M${round(points[0][0])},${round(points[0][1])}`;
  for (let i = 1; i < points.length; i++) {
    const [px, py] = points[i - 1];
    const [x, y] = points[i];
    d += `Q${round(px)},${round(py)} ${round((px + x) / 2)},${round((py + y) / 2)}`;
  }
  const [lx, ly] = points[points.length - 1];
  return d + `L${round(lx)},${round(ly)}`;
}

function arrowPath(R) {
  const length = 34 + R() * 22;
  const y = 16 + (R() - 0.5) * 3;
  const rise = (R() - 0.5) * 7;
  const tipX = 6 + length;
  const tipY = y + rise;

  const shaft = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    shaft.push([6 + length * t, y + rise * t + (R() - 0.5) * 1.5]);
  }

  let d = through(shaft);

  // Two barbs, uneven, the way a hand makes them without lifting much.
  const spread = 6.5 + R() * 4;
  const barb = 9 + R() * 5;
  d += `M${round(tipX)},${round(tipY)}L${round(tipX - barb)},${round(tipY - spread - R() * 2)}`;
  d += `M${round(tipX)},${round(tipY)}L${round(tipX - barb * (0.72 + R() * 0.5))},${round(tipY + spread * (0.8 + R() * 0.5))}`;

  return d;
}

/** A scrawl: the hand moving without writing anything, and not stopping. */
function scribblePath(R) {
  const passes = 3 + Math.floor(R() * 3);
  const left = 6 + R() * 5;
  const right = 46 + R() * 12;
  const top = 9 + R() * 4;
  const drop = (30 - top) * (0.5 + R() * 0.5);
  const points = [];

  for (let pass = 0; pass < passes; pass++) {
    const forward = pass % 2 === 0;
    for (let i = 0; i <= 4; i++) {
      const t = (pass + i / 4) / passes;
      const across = forward ? i / 4 : 1 - i / 4;
      points.push([
        left + (right - left) * across + (R() - 0.5) * 4,
        top + drop * t + (R() - 0.5) * 5
      ]);
    }
  }

  return through(points);
}

/** A loop wound out from nothing — the blackboard gesture, once. */
function spiralPath(R) {
  const cx = 30 + (R() - 0.5) * 6;
  const cy = 16 + (R() - 0.5) * 4;
  const turns = 2.2 + R() * 1.6;
  const grow = (10 + R() * 4) / turns;
  const lean = 0.62 + R() * 0.24;
  const from = R() * Math.PI * 2;
  const steps = Math.round(turns * 16);
  const points = [];

  for (let i = 0; i <= steps; i++) {
    const angle = from + (i / steps) * turns * Math.PI * 2;
    const radius = ((i / steps) * turns) * grow + (R() - 0.5) * 0.9;
    points.push([
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius * lean
    ]);
  }

  return through(points);
}

/** A crooked little x. The strokes are not the same length and do not quite
 *  agree about where the middle is. */
function crossPath(R) {
  const cx = 30 + (R() - 0.5) * 5;
  const cy = 16 + (R() - 0.5) * 4;
  const reach = 8 + R() * 5;
  const bow = (R() - 0.5) * 3;

  const arm = (dx, dy, from, to, bend) => through([
    [cx + dx * from, cy + dy * from],
    [cx + dx * (from + to) * 0.5 + bend, cy + dy * (from + to) * 0.5 - bend * 0.4],
    [cx + dx * to, cy + dy * to]
  ]);

  const first = arm(reach, reach * 0.82, -(0.9 + R() * 0.3), 1 + R() * 0.35, bow);
  const second = arm(-reach * (0.85 + R() * 0.3), reach * (0.9 + R() * 0.3), -(0.8 + R() * 0.4), 1 + R() * 0.3, -bow * 0.7);

  return first + second;
}
