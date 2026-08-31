<template>
  <canvas ref="cv" class="asemic" aria-hidden="true"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { rngFor, ghost, paint } from '../asemic.js';

const props = defineProps({
  // The poem whose shape gets drawn — usually not the one on the page.
  text: { type: String, default: '' },
  // Same seed, same marks, every load, for everyone.
  seed: { type: String, required: true },
  // 0 lets the hand scale itself to the space it is given
  size: { type: Number, default: 0 },
  maxLines: { type: Number, default: 0 },
  // Draw straight to full instead of writing itself on.
  instant: { type: Boolean, default: false }
});

const cv = ref(null);
let strokes = [];
let raf = null;
let ro = null;
let mo = null;
let mq = null;

const reduced = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function build() {
  const el = cv.value;
  if (!el) return false;

  const w = el.offsetWidth;
  const h = el.offsetHeight;
  if (!w || !h) return false;

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
    maxLines: props.maxLines
  });

  return true;
}

function draw(progress) {
  const el = cv.value;
  if (!el) return;
  const ctx = el.getContext('2d');
  ctx.clearRect(0, 0, el.offsetWidth, el.offsetHeight);
  paint(ctx, strokes, Math.floor(progress * strokes.length));
}

function run() {
  if (!build()) {
    requestAnimationFrame(run);
    return;
  }
  if (raf) cancelAnimationFrame(raf);

  if (props.instant || reduced()) {
    draw(1);
    return;
  }

  let t0 = null;
  const step = (ts) => {
    if (t0 === null) t0 = ts;
    const p = Math.min(1, (ts - t0) / 2200);
    draw(p);
    if (p < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

function repaint() {
  if (build()) draw(1);
}

onMounted(() => {
  nextTick(run);

  if (window.ResizeObserver) {
    let t = null;
    ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(repaint, 180);
    });
    ro.observe(cv.value);
  } else {
    window.addEventListener('resize', repaint);
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
    document.fonts.ready.then(repaint);
  }
});

onUnmounted(() => {
  if (raf) cancelAnimationFrame(raf);
  if (ro) ro.disconnect();
  if (mo) mo.disconnect();
  if (mq) mq.removeEventListener('change', repaint);
  window.removeEventListener('resize', repaint);
});

watch(() => [props.text, props.seed], run);
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
