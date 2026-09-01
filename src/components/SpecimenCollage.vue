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
        <span v-if="showsWords" class="catalogue-field"> · {{ vocabulary.field }}</span>
      </span>
      <span v-if="showsWords" class="catalogue-coordinates">{{ vocabulary.coordinates.join(' · ') }}</span>
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

// One quiet photographic fragment and one sparse line fragment each. The
// engravings that were here before arrived with their own headlines and
// hundreds of labelled hairlines, and won every glance.
const studies = {
  'a-quiet-family': {
    kind: 'lithic',
    primary: '/collage/eroded-strata.webp',
    secondary: '/collage/strata-contours.svg'
  },
  brahmanda: {
    kind: 'cosmic',
    primary: '/collage/lunar-disc.webp',
    secondary: '/collage/orbit-trace.svg'
  }
};

const frame = ref(null);
const handled = ref(false);
const study = computed(() => studies[props.poem.path] || null);
const vocabulary = computed(() => specimenWordsFor(props.poem));
// On a poem page SpecimenVocabulary.vue is the single appearance of the four
// words, so the collage keeps only its identifier.
const showsWords = computed(() => props.context !== 'poem');
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
  // A photograph is heavier than a line of writing: it moves less, and later.
  el.style.setProperty('--photo-x', `${-dx * 0.34}px`);
  el.style.setProperty('--photo-y', `${-dy * 0.34}px`);
  el.style.setProperty('--photo-x-reverse', `${dx * 0.26}px`);
  el.style.setProperty('--photo-y-reverse', `${dy * 0.26}px`);
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
    '--crop-y-reverse',
    '--photo-x',
    '--photo-y',
    '--photo-x-reverse',
    '--photo-y-reverse'
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
  --photo-x: 0px;
  --photo-y: 0px;
  --photo-x-reverse: 0px;
  --photo-y-reverse: 0px;
  position: relative;
  isolation: isolate;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--a-hair);
  background:
    linear-gradient(114deg, transparent 0 64%, color-mix(in srgb, var(--accent) 3%, transparent) 64% 100%),
    color-mix(in srgb, var(--a-bg) 94%, var(--accent));
  color: var(--a-ink);
  cursor: grab;
  touch-action: pan-y;
}

.specimen:active {
  cursor: grabbing;
}

/* The veil that makes everything beneath it read as one sheet of paper. */
.specimen::after {
  content: '';
  position: absolute;
  z-index: 20;
  inset: 0;
  pointer-events: none;
  opacity: 0.13;
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

/* No border and no shadow. A fragment lying in the page rather than a card
   set on top of it, and it stops by fading rather than by ending. */
.image-sheet {
  overflow: hidden;
  -webkit-mask-image: radial-gradient(108% 104% at 48% 46%, #000 26%, rgba(0, 0, 0, 0.54) 62%, transparent 93%);
  mask-image: radial-gradient(108% 104% at 48% 46%, #000 26%, rgba(0, 0, 0, 0.54) 62%, transparent 93%);
}

.image-sheet img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  filter: grayscale(0.93) sepia(0.09) saturate(0.46) contrast(0.88) brightness(1.0) blur(0.3px);
  mix-blend-mode: multiply;
  user-select: none;
  /* Heavier than the hand: it answers the pointer later and travels less. */
  transition: transform 1100ms cubic-bezier(0.22, 0.68, 0.14, 1), filter 620ms ease;
}

.layer-primary {
  z-index: 2;
  left: 10%;
  top: 9%;
  width: 64%;
  height: 53%;
  opacity: 0.74;
  transform: translate(var(--shift-x), var(--shift-y)) rotate(-0.9deg);
}

.layer-primary img {
  transform: translate(var(--photo-x), var(--photo-y)) scale(1.06);
}

.layer-secondary {
  z-index: 3;
  right: 8%;
  bottom: 11%;
  width: 50%;
  height: 38%;
  opacity: 0.6;
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(1.4deg);
}

.layer-secondary img,
.layer-tertiary img {
  transform: translate(var(--photo-x-reverse), var(--photo-y-reverse)) scale(1.05);
}

.layer-tertiary {
  z-index: 1;
  left: 4%;
  bottom: 2%;
  width: 44%;
  height: 44%;
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
  opacity: 0.085;
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
  opacity: 0.19;
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
  opacity: 0.68;
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

/* Folio keeps one sheet nearly whole: still handled, but archival. It differs
   from cut-up in crop and spacing, not in how much it has been faded out. */
.specimen[data-composition='folio'] .layer-primary {
  left: 11%;
  top: 8%;
  width: 62%;
  height: 55%;
  -webkit-mask-image: radial-gradient(118% 112% at 50% 48%, #000 40%, rgba(0, 0, 0, 0.5) 76%, transparent 100%);
  mask-image: radial-gradient(118% 112% at 50% 48%, #000 40%, rgba(0, 0, 0, 0.5) 76%, transparent 100%);
  transform: translate(var(--shift-x), var(--shift-y)) rotate(-0.75deg);
}

.specimen[data-composition='folio'] .layer-secondary {
  right: 7%;
  bottom: 13%;
  width: 46%;
  height: 34%;
  opacity: 0.58;
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(1.05deg);
}

.specimen[data-composition='folio'] .layer-tertiary {
  opacity: 0;
}

.specimen[data-composition='folio'] .large-trace-sheet {
  opacity: 0.06;
}

.specimen[data-composition='folio'].has-large-hand .large-trace-sheet {
  opacity: 0.13;
}

/* Cut-up changes the crop and the spacing, not the volume. */
.specimen[data-composition='cutup'] .sheet-ground {
  inset: 3% 4% 4% 5%;
  clip-path: polygon(3% 3%, 96% 0, 100% 89%, 88% 97%, 9% 100%, 0 76%);
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(1.15deg);
}

.specimen[data-composition='cutup'] .layer-primary {
  left: 4%;
  top: 5%;
  width: 71%;
  height: 61%;
  clip-path: polygon(0 9%, 88% 0, 100% 28%, 93% 96%, 21% 100%, 3% 57%);
  transform: translate(var(--shift-x), var(--shift-y)) rotate(-2.1deg);
}

.specimen[data-composition='cutup'] .layer-primary img {
  transform: translate(var(--photo-x), var(--photo-y)) scale(1.14);
}

.specimen[data-composition='cutup'] .layer-secondary {
  right: -4%;
  bottom: 3%;
  width: 57%;
  height: 47%;
  opacity: 0.64;
  clip-path: polygon(11% 0, 100% 8%, 93% 82%, 66% 100%, 0 90%, 7% 21%);
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(3deg);
}

.specimen[data-composition='cutup'] .layer-secondary img,
.specimen[data-composition='cutup'] .layer-tertiary img {
  transform: translate(var(--photo-x-reverse), var(--photo-y-reverse)) scale(1.1);
}

.specimen[data-composition='cutup'] .layer-tertiary {
  left: -6%;
  bottom: -7%;
  width: 51%;
  height: 49%;
  opacity: 0.24;
  clip-path: polygon(13% 5%, 91% 0, 100% 72%, 77% 100%, 0 83%, 4% 21%);
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(-5deg);
}

.specimen[data-composition='cutup'] .large-trace-sheet {
  left: -13%;
  top: 29%;
  width: 124%;
  height: 37%;
  opacity: 0.115;
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

/* Pressing separates the layers the way paper comes apart in the hand: they
   part a little and settle. They do not scatter. These follow the composition
   rules on purpose — same specificity, later in the file, so they win. */
.specimen.is-handled .trace-sheet {
  opacity: 0.62;
  transform: translate(calc(var(--shift-x-reverse) + 3.2%), calc(var(--shift-y-reverse) - 1.6%)) rotate(1.5deg);
}

.specimen.is-handled .large-trace-sheet {
  opacity: 0.17;
  transform: translate(calc(var(--shift-x) - 1.2%), calc(var(--shift-y) + 1.8%)) rotate(-5.4deg) scale(1.012);
}

.specimen.is-handled .layer-primary {
  transform: translate(calc(var(--shift-x) - 0.9%), calc(var(--shift-y) + 0.9%)) rotate(-1.6deg);
}

.specimen.is-handled .layer-secondary {
  opacity: 0.66;
  transform: translate(calc(var(--shift-x-reverse) + 1.3%), calc(var(--shift-y-reverse) - 0.9%)) rotate(2.4deg);
}

.specimen.is-handled .layer-tertiary {
  opacity: 0.36;
}

.specimen.is-handled .image-sheet img {
  filter: grayscale(0.85) sepia(0.07) saturate(0.6) contrast(0.94) brightness(0.99) blur(0.2px);
}

.specimen.is-handled .title-fragment {
  opacity: 0.82;
  transform: translate(calc(var(--shift-x-reverse) - 1%), calc(var(--shift-y-reverse) - 4%)) rotate(-0.5deg);
}

/* The stone study: the photograph carries the surface, the drawn lines carry
   the bedding. Nothing here is a chart. */
[data-specimen='lithic'] .layer-primary img {
  object-position: 58% 44%;
}

[data-specimen='lithic'] .layer-secondary img {
  object-position: center 40%;
}

/* The egg study. The oval is the photograph itself, so no mask cuts a circle
   here — a round crop at this size becomes a porthole for the whole page. */
[data-specimen='cosmic'] .layer-primary {
  left: 8%;
  top: 6%;
  width: 60%;
  height: 60%;
}

[data-specimen='cosmic'] .layer-primary img,
[data-specimen='cosmic'] .layer-secondary img {
  object-fit: contain;
  object-position: center center;
}

.specimen[data-composition='folio'][data-specimen='cosmic'] .layer-primary {
  left: 9%;
  top: 6%;
  width: 58%;
  height: 60%;
}

.specimen[data-composition='cutup'][data-specimen='cosmic'] .layer-primary {
  left: 3%;
  top: 4%;
  width: 66%;
  height: 66%;
}

.specimen[data-composition='cutup'][data-specimen='cosmic'] .layer-secondary {
  right: -3%;
  bottom: -2%;
  width: 52%;
  height: 55%;
}

/* Dark mode is a negative rather than a dimming, and multiply has nothing to
   give against a dark ground. The fragments trade with it instead. These are
   ancestor conditions only: no property here reaches the root element. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .image-sheet img {
    filter: grayscale(0.94) contrast(0.72) brightness(1.02) invert(1) blur(0.3px);
    mix-blend-mode: screen;
    opacity: 0.62;
  }

  :root:not([data-theme='light']) .specimen.is-handled .image-sheet img {
    filter: grayscale(0.88) contrast(0.8) brightness(1.04) invert(1) blur(0.2px);
  }
}

:root[data-theme='dark'] .image-sheet img {
  filter: grayscale(0.94) contrast(0.72) brightness(1.02) invert(1) blur(0.3px);
  mix-blend-mode: screen;
  opacity: 0.62;
}

:root[data-theme='dark'] .specimen.is-handled .image-sheet img {
  filter: grayscale(0.88) contrast(0.8) brightness(1.04) invert(1) blur(0.2px);
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
