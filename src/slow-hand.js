/**
 * One plate per visit is written slowly.
 *
 * The hand on this site is the same hand everywhere, which is true of a
 * person and slightly untrue of their handwriting: nobody writes every page
 * of a notebook in the same temper. So one poem, chosen once per session and
 * then held for the rest of it, is written by that hand taking its time —
 * steadier, more upright, keeping the pen down, leaving more ink, and moving
 * at about half speed, which is the part a reader actually notices.
 *
 * It is chosen per session rather than per load so a reader is never watching
 * the folio change its mind, and it is never announced.
 */

import poems from './poems.json';

const KEY = 'mb-slow-hand';
const SLOW = -0.8;

let chosen;

function pick() {
  if (chosen !== undefined) return chosen;

  const paths = poems.map(poem => poem.path).filter(Boolean);
  if (!paths.length) {
    chosen = '';
    return chosen;
  }

  try {
    const kept = window.sessionStorage.getItem(KEY);
    if (kept && paths.includes(kept)) {
      chosen = kept;
      return chosen;
    }
  } catch {
    // Private windows and embedded browsers refuse storage. The slow hand
    // then belongs to this page rather than to this visit.
  }

  chosen = paths[Math.floor(Math.random() * paths.length)];

  try {
    window.sessionStorage.setItem(KEY, chosen);
  } catch {
    // As above: nothing to keep it in, nothing to repair.
  }

  return chosen;
}

/**
 * The temper of this poem's hand: 0 everywhere but the one plate a visit is
 * given slowly. Negative is slow and careful, positive would be hurried.
 */
export function temperFor(path) {
  if (!path) return 0;
  return pick() === path ? SLOW : 0;
}
