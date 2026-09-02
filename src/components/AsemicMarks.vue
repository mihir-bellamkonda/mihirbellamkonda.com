<template>
  <canvas ref="cv" class="asemic" aria-hidden="true"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { rngFor, ghost, paint, paintProgress, writingPlan } from '../asemic.js';

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
  temper: { type: Number, default: 0 }
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

const reduced = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
 * A hand is not a metronome and it is not a wipe.
 *
 * It keeps roughly one speed, varies a little inside that, and slows as it
 * arrives at the end of what it is writing. The pen's position along the
 * journey is what `t` means here; how far that is through the *marks* is the
 * plan's business, not this function's.
 */
function pace(t) {
  const eased = 1 - Math.pow(1 - t, 1.22);
  // The plan already slows the pen at corners and rests it at every lift, so
  // this only has to keep the hand from running at one exact rate.
  const varied = eased + 0.03 * Math.sin(t * Math.PI * 5.4);
  return Math.max(0, Math.min(1, varied));
}

// Roughly the speed of a hand writing at this size, in canvas units a second.
// A longer passage therefore takes longer to write, instead of every mark on
// the site taking the same two seconds however much of it there is.
const PEN_SPEED = 1500;

function writingTime(rate = 1) {
  const length = plan ? plan.total : 0;
  const seconds = length / (PEN_SPEED * rate);
  // A whole poem takes longer to write than a single line, but not so much
  // longer that a reader is kept waiting for the end of it. A slow hand is
  // then allowed past that ceiling, because being slow is the whole of it.
  const span = Math.max(1100, Math.min(5500, seconds * 1000));
  return Math.min(8000, span / (1 + props.temper * 0.55));
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
  let t0 = null;
  const step = (ts) => {
    if (t0 === null) t0 = ts;
    const t = Math.min(1, (ts - t0) / span);
    draw(from + (to - from) * pace(t));
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
    if (reduced()) draw(target);
    else writeBetween(0, target, writingTime() * target);
    return;
  }

  if (props.instant || reduced()) {
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
  if (reduced()) draw(1);
  else animate(writingTime(1.7));
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

watch(() => [props.text, props.seed, props.temper], run);
watch(() => props.progress, (value) => {
  if (!mounted) return;
  if (value === null) return;
  if (!strokes.length && !build()) return;
  const target = Math.max(0, Math.min(1, value));
  const jump = Math.abs(target - drawn);
  if (jump > 0.28 && !reduced()) {
    writeBetween(drawn, target, writingTime(1.6) * jump);
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
