<template>
  <figure
    ref="frame"
    class="specimen"
    :class="[
      `context-${context}`,
      {
        'has-study': study,
        'is-handled': handled,
        'has-large-hand': poem.path === 'in-of'
      }
    ]"
    :data-specimen="study?.kind || 'asemic'"
    :data-poem="poem.path"
    :data-composition="settings.composition"
    aria-hidden="true"
    @pointermove="handlePointer"
    @pointerdown="beginHandling"
    @pointerup="endHandling"
    @pointercancel="endHandling"
    @lostpointercapture="endHandling"
    @pointerleave="clearPointer"
  >
    <div class="sheet sheet-ground"></div>

    <div v-if="study" class="sheet image-sheet layer-primary">
      <img :src="study.primary" alt="" draggable="false">
    </div>

    <div v-if="study" class="sheet image-sheet layer-secondary">
      <img :src="study.secondary" alt="" draggable="false">
    </div>

    <div v-if="study?.tertiary" class="sheet image-sheet layer-tertiary">
      <img :src="study.tertiary" alt="" draggable="false">
    </div>

    <div class="sheet large-trace-sheet">
      <AsemicMarks
        class="large-trace"
        :text="handText"
        :seed="`${handSeed}::large`"
        :size="largeMarkSize"
        :max-lines="1"
        instant
      />
    </div>

    <div class="sheet trace-sheet">
      <AsemicMarks
        class="trace"
        :text="handText"
        :seed="handSeed"
        :progress="progress"
      />
    </div>

    <p class="title-fragment"><span>{{ returnedTitle }}</span></p>

    <p class="catalogue">
      <span class="catalogue-line">
        <span class="catalogue-id">{{ catalogueId }}</span>
        <span class="catalogue-field"> · {{ vocabulary.field }}</span>
      </span>
      <span class="catalogue-coordinates">{{ vocabulary.coordinates.join(' · ') }}</span>
    </p>
  </figure>
</template>

<script setup>
import { computed, ref } from 'vue';
import AsemicMarks from './AsemicMarks.vue';
import { specimenWordsFor } from '../specimen-vocabulary.js';
import { prototypeSettings as settings } from '../prototype-settings.js';

const props = defineProps({
  poem: { type: Object, required: true },
  context: { type: String, default: 'index' },
  markText: { type: String, default: '' },
  markSeed: { type: String, default: '' },
  progress: { type: Number, default: null }
});

const studies = {
  'a-quiet-family': {
    kind: 'lithic',
    primary: '/collage/crystal-forms.webp',
    secondary: '/collage/geological-chart.webp'
  },
  brahmanda: {
    kind: 'cosmic',
    primary: '/collage/cosmic-egg.webp',
    secondary: '/collage/citrus-aurantium.webp',
    tertiary: '/collage/solar-system.webp'
  }
};

const frame = ref(null);
const handled = ref(false);
const study = computed(() => studies[props.poem.path] || null);
const vocabulary = computed(() => specimenWordsFor(props.poem));
const returnedTitle = computed(() => String(props.poem.title || ''));
const handText = computed(() => props.markText || props.poem.content);
const handSeed = computed(() => props.markSeed || `${props.poem.slug}::folio`);
const catalogueId = computed(() => {
  const number = String(props.poem.slug || '').match(/^\d+/)?.[0] || '00';
  return `MB / ${number}`;
});
const largeMarkSize = computed(() => {
  if (props.poem.path === 'in-of') return props.context === 'index' ? 35 : 30;
  return props.context === 'index' ? 25 : 22;
});

function respondsToHandling() {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return document.documentElement.dataset.prototypeMotion === 'responsive' && !reduced;
}

function handlePointer(event) {
  if (!respondsToHandling()) return;
  const el = frame.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const nx = (event.clientX - rect.left) / rect.width - 0.5;
  const ny = (event.clientY - rect.top) / rect.height - 0.5;
  const dx = nx * 17;
  const dy = ny * 14;

  el.style.setProperty('--shift-x', `${dx}px`);
  el.style.setProperty('--shift-y', `${dy}px`);
  el.style.setProperty('--shift-x-reverse', `${-dx * 0.72}px`);
  el.style.setProperty('--shift-y-reverse', `${-dy * 0.72}px`);
  el.style.setProperty('--crop-x', `${-dx * 0.92}px`);
  el.style.setProperty('--crop-y', `${-dy * 0.92}px`);
  el.style.setProperty('--crop-x-reverse', `${dx * 0.62}px`);
  el.style.setProperty('--crop-y-reverse', `${dy * 0.62}px`);
}

function beginHandling(event) {
  if (!respondsToHandling() || (event.pointerType === 'mouse' && event.button !== 0)) return;
  handled.value = true;
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    // Capture is an enhancement; the reveal still works without it.
  }
}

function endHandling(event) {
  handled.value = false;
  try {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  } catch {
    // The pointer may already have been released by the browser.
  }
}

function clearPointer(event) {
  if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) return;
  handled.value = false;
  const el = frame.value;
  if (!el) return;
  for (const name of [
    '--shift-x',
    '--shift-y',
    '--shift-x-reverse',
    '--shift-y-reverse',
    '--crop-x',
    '--crop-y',
    '--crop-x-reverse',
    '--crop-y-reverse'
  ]) {
    el.style.setProperty(name, '0px');
  }
}
</script>

<style scoped>
.specimen {
  --shift-x: 0px;
  --shift-y: 0px;
  --shift-x-reverse: 0px;
  --shift-y-reverse: 0px;
  --crop-x: 0px;
  --crop-y: 0px;
  --crop-x-reverse: 0px;
  --crop-y-reverse: 0px;
  position: relative;
  isolation: isolate;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--a-hair);
  background:
    linear-gradient(114deg, transparent 0 64%, color-mix(in srgb, var(--accent) 3%, transparent) 64% 100%),
    color-mix(in srgb, var(--a-bg) 92%, var(--accent));
  color: var(--a-ink);
  cursor: grab;
  touch-action: pan-y;
}

.specimen:active {
  cursor: grabbing;
}

.specimen::after {
  content: '';
  position: absolute;
  z-index: 20;
  inset: 0;
  pointer-events: none;
  opacity: 0.16;
  background-image:
    repeating-linear-gradient(0deg, transparent 0 3px, color-mix(in srgb, var(--a-ink) 3%, transparent) 3px 4px),
    linear-gradient(90deg, color-mix(in srgb, var(--a-bg) 18%, transparent), transparent 28% 74%, color-mix(in srgb, var(--a-bg) 12%, transparent));
  mix-blend-mode: multiply;
}

.context-index {
  height: 100%;
  min-height: 31rem;
}

.context-poem {
  height: clamp(19rem, 42vh, 31rem);
  margin-top: 0.25rem;
}

.sheet {
  position: absolute;
  transition:
    transform 620ms cubic-bezier(0.2, 0.74, 0.16, 1),
    opacity 360ms ease,
    clip-path 620ms cubic-bezier(0.2, 0.74, 0.16, 1);
}

.sheet-ground {
  z-index: 0;
  inset: 6% 7% 7% 8%;
  border: 1px solid var(--a-hair);
  background: color-mix(in srgb, var(--a-bg) 97%, var(--a-ink));
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(-0.55deg);
}

.image-sheet {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--a-ink) 22%, transparent);
  background: var(--a-bg);
  box-shadow: 0 0.9rem 2.2rem color-mix(in srgb, var(--a-ink) 12%, transparent);
}

.image-sheet img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  filter: grayscale(0.78) sepia(0.12) saturate(0.58) contrast(0.94);
  mix-blend-mode: multiply;
  user-select: none;
  transition: transform 760ms cubic-bezier(0.2, 0.74, 0.16, 1), filter 420ms ease;
}

.layer-primary {
  z-index: 2;
  left: 12%;
  top: 10%;
  width: 68%;
  height: 57%;
  transform: translate(var(--shift-x), var(--shift-y)) rotate(-1.2deg);
}

.layer-primary img {
  transform: translate(var(--crop-x), var(--crop-y)) scale(1.08);
}

.layer-secondary {
  z-index: 3;
  right: 7%;
  bottom: 10%;
  width: 56%;
  height: 42%;
  opacity: 0.18;
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(1.8deg);
}

.layer-secondary img,
.layer-tertiary img {
  transform: translate(var(--crop-x-reverse), var(--crop-y-reverse)) scale(1.1);
}

.layer-tertiary {
  z-index: 1;
  left: 4%;
  bottom: 2%;
  width: 46%;
  height: 46%;
  opacity: 0;
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(-3deg);
}

.large-trace-sheet {
  z-index: 4;
  left: -7%;
  top: 33%;
  width: 111%;
  height: 29%;
  overflow: hidden;
  opacity: 0.075;
  mix-blend-mode: multiply;
  transform: translate(var(--shift-x), var(--shift-y)) rotate(-4.5deg);
}

.large-trace {
  width: 100%;
  height: 100%;
}

.has-large-hand .large-trace-sheet {
  top: 28%;
  height: 39%;
  opacity: 0.17;
  transform: translate(var(--shift-x), var(--shift-y)) rotate(-6.2deg);
}

.trace-sheet {
  z-index: 5;
  right: 3%;
  top: 5%;
  width: 52%;
  height: 82%;
  padding: 8% 7%;
  overflow: hidden;
  border-left: 1px solid color-mix(in srgb, var(--a-hair) 70%, transparent);
  background: color-mix(in srgb, var(--a-bg) 61%, transparent);
  backdrop-filter: blur(0.45px);
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(0.8deg);
}

.trace {
  width: 100%;
  height: 100%;
  opacity: 0.62;
}

.title-fragment {
  position: absolute;
  z-index: 8;
  right: 4.5%;
  bottom: 3.8%;
  max-width: min(22ch, 62%);
  margin: 0;
  padding: 0.28rem 0.4rem 0.2rem;
  border-top: 1px solid color-mix(in srgb, var(--a-ink) 21%, transparent);
  background: color-mix(in srgb, var(--a-bg) 76%, transparent);
  font-family: var(--f-display);
  font-size: clamp(0.86rem, 1.45vw, 1.18rem);
  font-weight: 300;
  line-height: 1.08;
  letter-spacing: 0.005em;
  color: var(--a-ink);
  text-align: right;
  opacity: 0.6;
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(0.35deg);
  transition: opacity 260ms ease, transform 520ms cubic-bezier(0.2, 0.74, 0.16, 1);
}

.catalogue {
  position: absolute;
  z-index: 9;
  top: 4%;
  left: 4%;
  display: flex;
  flex-direction: column;
  gap: 0.19rem;
  margin: 0;
  font-family: var(--f-cat);
  font-size: 0.53rem;
  line-height: 1.5;
  letter-spacing: 0.14em;
}

.catalogue-line {
  display: flex;
  align-items: baseline;
}

.catalogue-id {
  color: var(--accent);
  opacity: 0.72;
}

.catalogue-field {
  color: var(--accent);
  opacity: 0.24;
  text-transform: uppercase;
  transition: opacity 300ms ease;
}

.catalogue-coordinates {
  color: var(--a-ink-2);
  opacity: 0.2;
  letter-spacing: 0.08em;
  transition: opacity 300ms ease;
}

.specimen:hover .catalogue-field,
.specimen.is-handled .catalogue-field {
  opacity: 0.52;
}

.specimen:hover .catalogue-coordinates,
.specimen.is-handled .catalogue-coordinates {
  opacity: 0.38;
}

.specimen:hover .title-fragment {
  opacity: 0.73;
}

.specimen:not(.has-study) .sheet-ground {
  inset: 8% 9%;
}

.specimen:not(.has-study) .trace-sheet {
  inset: 10% 9% 12%;
  width: auto;
  height: auto;
  border: 0;
  background: transparent;
}

/* Folio keeps one sheet nearly whole: still handled, but archival. */
.specimen[data-composition='folio'] .layer-secondary {
  opacity: 0.14;
}

.specimen[data-composition='folio'] .layer-tertiary {
  opacity: 0;
}

.specimen[data-composition='folio'] .large-trace-sheet {
  opacity: 0.055;
}

.specimen[data-composition='folio'].has-large-hand .large-trace-sheet {
  opacity: 0.12;
}

/* Cut-up changes the crop, not merely the amount of material. */
.specimen[data-composition='cutup'] .sheet-ground {
  inset: 3% 4% 4% 5%;
  clip-path: polygon(3% 3%, 96% 0, 100% 89%, 88% 97%, 9% 100%, 0 76%);
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(1.15deg);
}

.specimen[data-composition='cutup'] .layer-primary {
  left: 5%;
  top: 6%;
  width: 78%;
  height: 66%;
  clip-path: polygon(4% 7%, 91% 0, 100% 24%, 94% 91%, 73% 100%, 6% 91%, 0 38%);
  transform: translate(var(--shift-x), var(--shift-y)) rotate(-2.35deg);
}

.specimen[data-composition='cutup'] .layer-primary img {
  transform: translate(var(--crop-x), var(--crop-y)) scale(1.19);
}

.specimen[data-composition='cutup'] .layer-secondary {
  right: -4%;
  bottom: 1%;
  width: 61%;
  height: 52%;
  opacity: 0.52;
  clip-path: polygon(11% 0, 100% 8%, 93% 82%, 66% 100%, 0 90%, 7% 21%);
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(3.2deg);
}

.specimen[data-composition='cutup'] .layer-secondary img,
.specimen[data-composition='cutup'] .layer-tertiary img {
  transform: translate(var(--crop-x-reverse), var(--crop-y-reverse)) scale(1.22);
}

.specimen[data-composition='cutup'] .layer-tertiary {
  left: -6%;
  bottom: -7%;
  width: 53%;
  height: 51%;
  opacity: 0.29;
  clip-path: polygon(13% 5%, 91% 0, 100% 72%, 77% 100%, 0 83%, 4% 21%);
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(-5deg);
}

.specimen[data-composition='cutup'] .large-trace-sheet {
  left: -13%;
  top: 29%;
  width: 124%;
  height: 37%;
  opacity: 0.12;
  clip-path: polygon(0 15%, 96% 0, 100% 75%, 9% 100%);
  transform: translate(var(--shift-x), var(--shift-y)) rotate(-6.5deg);
}

.specimen[data-composition='cutup'].has-large-hand .large-trace-sheet {
  top: 23%;
  height: 48%;
  opacity: 0.2;
}

.specimen[data-composition='cutup'] .trace-sheet {
  right: -1%;
  top: 3%;
  width: 57%;
  height: 88%;
  padding: 9% 8%;
  border: 0;
  clip-path: polygon(10% 0, 100% 4%, 94% 82%, 73% 100%, 0 92%, 5% 21%);
  background: color-mix(in srgb, var(--a-bg) 54%, transparent);
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(1.7deg);
}

.specimen[data-composition='cutup']:not(.has-study) .trace-sheet {
  inset: 7% 4% 7% 28%;
  width: auto;
  height: auto;
  padding: 7%;
  background: color-mix(in srgb, var(--a-bg) 37%, transparent);
}

.specimen.is-handled .trace-sheet {
  opacity: 0.55;
  transform: translate(calc(var(--shift-x-reverse) + 8%), calc(var(--shift-y-reverse) - 4%)) rotate(3.4deg);
}

.specimen.is-handled .large-trace-sheet {
  opacity: 0.22;
  transform: translate(calc(var(--shift-x) - 3%), calc(var(--shift-y) + 5%)) rotate(-8deg) scale(1.035);
}

.specimen.is-handled .layer-primary {
  transform: translate(calc(var(--shift-x) - 2%), calc(var(--shift-y) + 2%)) rotate(-3.4deg);
}

.specimen.is-handled .layer-secondary {
  opacity: 0.76;
  transform: translate(calc(var(--shift-x-reverse) + 3%), calc(var(--shift-y-reverse) - 2%)) rotate(4.8deg);
}

.specimen.is-handled .layer-tertiary {
  opacity: 0.46;
}

.specimen.is-handled .image-sheet img {
  filter: grayscale(0.65) sepia(0.08) saturate(0.72) contrast(0.98);
}

.specimen.is-handled .title-fragment {
  opacity: 0.82;
  transform: translate(calc(var(--shift-x-reverse) - 1%), calc(var(--shift-y-reverse) - 4%)) rotate(-0.5deg);
}

[data-specimen='lithic'] .layer-primary img {
  object-position: 66% center;
}

[data-specimen='lithic'] .layer-secondary img {
  object-position: center 64%;
}

.specimen[data-composition='cutup'][data-specimen='lithic'] .layer-primary {
  clip-path: polygon(0 12%, 84% 0, 100% 31%, 91% 100%, 18% 91%, 4% 62%);
}

[data-specimen='cosmic'] .layer-primary {
  left: 9%;
  top: 8%;
  width: 75%;
  height: 61%;
}

[data-specimen='cosmic'] .layer-primary img {
  object-position: center center;
}

[data-specimen='cosmic'] .layer-secondary {
  right: 8%;
  bottom: 7%;
  width: 38%;
  height: 53%;
}

[data-specimen='cosmic'] .layer-secondary img {
  object-position: center 40%;
}

[data-specimen='cosmic'] .layer-tertiary img {
  object-position: center center;
}

.specimen[data-composition='cutup'][data-specimen='cosmic'] .layer-primary {
  left: 3%;
  top: 4%;
  width: 79%;
  height: 70%;
  clip-path: ellipse(43% 48% at 48% 49%);
}

.specimen[data-composition='cutup'][data-specimen='cosmic'] .layer-secondary {
  right: -1%;
  bottom: -2%;
  width: 47%;
  height: 59%;
  clip-path: polygon(15% 0, 100% 9%, 91% 91%, 21% 100%, 0 57%);
}

.specimen[data-composition='cutup'][data-specimen='cosmic'] .layer-tertiary {
  left: -7%;
  bottom: -9%;
  width: 58%;
  height: 55%;
  clip-path: circle(43% at 48% 50%);
}

@media (max-width: 860px) {
  .context-index { min-height: 25rem; }
  .context-poem { height: 18rem; }
  .title-fragment {
    right: 4%;
    bottom: 3.5%;
    max-width: 68%;
    font-size: clamp(0.82rem, 3.2vw, 1rem);
  }
  .catalogue { top: 3.5%; }
}

@media (prefers-reduced-motion: reduce) {
  .specimen { cursor: default; }
}

@media print {
  .specimen { display: none; }
}
</style>
