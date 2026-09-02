/**
 * Whether the reader has asked for less movement.
 *
 * Three components were each asking the platform this in their own words —
 * the marks before writing themselves on, the collage before answering the
 * pointer, the poem page before letting the reader hold the pen. Asking in
 * one place means a fourth will ask the same question the same way.
 */
export function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}
