<template>
  <canvas ref="cv" class="asemic" aria-hidden="true"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { rngFor, ghost, paint, paintProgress, writingPlan } from '../asemic.js';
import { prefersReducedMotion } from '../motion.js';

const props = defineProps({
  // The poem whose shape gets drawn — usually not the one on the page.
  text: { type: String, default: '' },
  // Same seed, same marks, every load, for everyone.
  seed: { type: String, required: true },
  // 0 lets the hand scale itself to the space it is given
  size: { type: Number, default: 0 },
  maxLines: { type: Number, default: 0 },
  // Draw straight to full instead of writing itself on.
  instant: { type: Boolean, default: false },
  // When supplied, another medium — an audio reading, the reader's own
  // descent through the poem — holds the pen and decides how far through the
  // mark it has travelled.
  progress: { type: Number, default: null },
  // 0 is the ordinary hand. Below it, the same hand taking its time; above
  // it, the same hand in a hurry.
  temper: { type: Number, default: 0 },
  // The longest the write-on may run, in milliseconds. 0 lifts the ceiling
  // and lets the mark take the time the plan says it costs.
  ceiling: { type: Number, default: 9000 },
  // Multiplies the plan's own time. 1 is pen speed. Because it stretches the
  // whole journey, every rest and every corner keeps its exact share of the
  // total — it is the same hand writing more slowly, not a different one.
  stretch: { type: Number, default: 1 }
});

const cv = ref(null);
let strokes = [];
let plan = null;
let drawn = 0;
let built = null;
let raf = null;
let ro = null;
let mo = null;
let mq = null;
let retryRaf = null;
let resizeTimer = null;
let mounted = false;

function build() {
  const el = cv.value;
  if (!el) return false;

  const w = el.offsetWidth;
  const h = el.offsetHeight;
  if (!w || !h) return false;

  built = { w, h };

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  el.width = Math.floor(w * dpr);
  el.height = Math.floor(h * dpr);
  const ctx = el.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  strokes = ghost(props.text, {
    rng: rngFor(props.seed),
    x: 0,
    width: w,
    height: h,
    size: props.size || 0,
    maxLines: props.maxLines,
    temper: props.temper
  });
  plan = writingPlan(strokes);

  return true;
}

function draw(progress) {
  const el = cv.value;
  if (!el) return;
  drawn = progress;
  const ctx = el.getContext('2d');
  ctx.clearRect(0, 0, el.offsetWidth, el.offsetHeight);
  if (progress >= 1 || !plan || !plan.total) paint(ctx, strokes);
  else paintProgress(ctx, strokes, plan, progress);
}

/**
 * How long this mark takes to write.
 *
 * The plan already answers that in seconds, and a mark short enough to be
 * watched — a row signature, the one large line — comes in under the ceiling
 * and so keeps its true rhythm: a tenth of a second of rest between words,
 * which is a pause a reader can actually see. A whole poem's column asks for
 * half a minute, which nobody would watch, so it is compressed. The
 * proportions survive the squeeze; only the absolute pace changes.
 *
 * The ceiling is there because almost every mark on the site appears beside
 * something a reader came for, and none of them were asked for. A caller with
 * a reader who did ask can pass `ceiling: 0`, and then the plan stands: the
 * rests between words and off the ends of stanzas keep their real length
 * instead of being squeezed under the threshold where they can be seen.
 */
function writingTime(rate = 1) {
  const ms = ((plan ? plan.total : 0) / rate) * 1000 * props.stretch;
  if (!props.ceiling) return Math.max(1000, ms);
  const span = Math.max(1000, Math.min(props.ceiling, ms));
  // A slow hand is allowed past the ceiling, because being slow is the whole
  // of it.
  return Math.min(13000, span / (1 + props.temper * 0.55));
}

function animate(duration) {
  writeBetween(0, 1, duration || writingTime());
}

/**
 * Write from where the pen is to where it now has to be.
 *
 * Small changes are drawn where they land — a reader scrolling, or an audio
 * reading running on, is already moving the pen, and animating on top of that
 * would be a second hand fighting the first. A large jump is written.
 */
function writeBetween(from, to, duration) {
  if (raf) cancelAnimationFrame(raf);
  // Nobody is watching a hidden tab, and its frames do not run: writing into
  // one would leave the marks stopped wherever the browser paused them.
  if (document.hidden) {
    draw(to);
    return;
  }
  const span = Math.max(220, duration);

  // Every frame clears the canvas and repaints every stroke, finished ones
  // included, so a page-sized field costs thousands of strokes a frame. At
  // sixty frames a second a minute-long write is four thousand of those, to
  // show a pen that has moved less than its own width between frames. A long
  // write therefore steps instead: at this pace the two are the same picture.
  // Nothing under the ceiling can reach this — a capped write tops out at
  // thirteen seconds — so it is the uncapped page and nothing else.
  const stepMs = span > 20000 ? 70 : 0;

  let t0 = null;
  let last = null;
  const step = (ts) => {
    if (t0 === null) t0 = ts;
    if (stepMs && last !== null && ts - last < stepMs && ts - t0 < span) {
      raf = requestAnimationFrame(step);
      return;
    }
    last = ts;
    const t = Math.min(1, (ts - t0) / span);
    // No easing curve here. The plan is the pacing — it already runs the pen
    // fast through a word, slows it into every corner and rests it between
    // words — and a curve on top of that only smears those distinctions.
    draw(from + (to - from) * t);
    if (t < 1) raf = requestAnimationFrame(step);
  };
  draw(from);
  raf = requestAnimationFrame(step);
}

function run() {
  if (!mounted) return;
  if (!build()) {
    if (retryRaf) cancelAnimationFrame(retryRaf);
    retryRaf = requestAnimationFrame(run);
    return;
  }
  if (retryRaf) {
    cancelAnimationFrame(retryRaf);
    retryRaf = null;
  }
  if (raf) cancelAnimationFrame(raf);

  if (props.progress !== null) {
    const target = Math.max(0, Math.min(1, props.progress));
    if (prefersReducedMotion()) draw(target);
    else writeBetween(0, target, writingTime() * target);
    return;
  }

  if (props.instant || prefersReducedMotion()) {
    draw(1);
    return;
  }

  animate();
}

// The marks are redrawn from scratch — a theme change, say, which alters the
// ink and nothing else.
function repaint() {
  if (!mounted) return;
  if (build()) draw(props.progress === null ? 1 : Math.max(0, Math.min(1, props.progress)));
}

/**
 * Redraw only when the canvas has actually changed size.
 *
 * A ResizeObserver reports the size it starts with, so the observer fired
 * once on mount and repainted — which meant every write-on was cut off a
 * fraction of a second in and snapped to the finished marks. The hand should
 * be interrupted by a window being resized, not by being observed.
 */
function resized() {
  const el = cv.value;
  if (!el) return;
  if (built && el.offsetWidth === built.w && el.offsetHeight === built.h) return;
  repaint();
}

function replay() {
  if (!build()) return;
  if (prefersReducedMotion()) draw(1);
  else animate(writingTime(1.25));
}

defineExpose({ replay });

onMounted(() => {
  mounted = true;
  nextTick(run);

  if (window.ResizeObserver) {
    ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resized, 180);
    });
    ro.observe(cv.value);
  } else {
    window.addEventListener('resize', resized);
  }

  // Marks follow the theme, since their colour comes from CSS variables.
  try {
    mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', repaint);
    mo = new MutationObserver(repaint);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  } catch (e) {
    // older engines simply keep the first ink
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (mounted) resized();
    });
  }
});

onUnmounted(() => {
  mounted = false;
  if (raf) cancelAnimationFrame(raf);
  if (retryRaf) cancelAnimationFrame(retryRaf);
  if (resizeTimer) clearTimeout(resizeTimer);
  if (ro) ro.disconnect();
  if (mo) mo.disconnect();
  if (mq) mq.removeEventListener('change', repaint);
  window.removeEventListener('resize', resized);
});

watch(() => [props.text, props.seed, props.temper, props.size, props.maxLines], run);
watch(() => props.progress, (value) => {
  if (!mounted) return;
  if (value === null) return;
  if (!strokes.length && !build()) return;
  const target = Math.max(0, Math.min(1, value));
  const jump = Math.abs(target - drawn);
  if (jump > 0.28 && !prefersReducedMotion()) {
    // Catching up with a reader who has jumped is a different gesture from
    // writing, and it should not keep them waiting.
    writeBetween(drawn, target, Math.min(1600, writingTime() * jump));
    return;
  }
  if (raf) cancelAnimationFrame(raf);
  draw(target);
});
</script>

<style scoped>
.asemic {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

@media print {
  .asemic { display: none; }
}
</style>
