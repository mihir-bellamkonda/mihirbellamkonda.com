/**
 * The line that says the arrow keys work.
 *
 * It exists to be read once. A reader who has moved between poems with the
 * keyboard twice knows; leaving the instruction on the page after that is the
 * site talking over the poems. It is remembered across visits, because so is
 * the knowledge.
 */

const KEY = 'mb-arrow-keys';
const ENOUGH = 2;

let used = null;

function read() {
  if (used !== null) return used;
  try {
    used = Number(window.localStorage.getItem(KEY)) || 0;
  } catch {
    // No storage: the hint simply lasts as long as the page does.
    used = 0;
  }
  return used;
}

/** Count one arrow-key move between poems. */
export function arrowUsed() {
  used = read() + 1;
  try {
    window.localStorage.setItem(KEY, String(used));
  } catch {
    // As above.
  }
}

/** Whether the reader still needs telling. */
export function needsArrowHint() {
  return read() < ENOUGH;
}
