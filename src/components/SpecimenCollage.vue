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
    :data-composition="composition"
    :style="plateStyle"
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
        :temper="temper"
        instant
      />
    </div>

    <div class="sheet trace-sheet">
      <AsemicMarks
        class="trace"
        :text="handText"
        :seed="handSeed"
        :progress="progress"
        :temper="temper"
      />
    </div>

    <!-- One mark to a plate: an arrow pointing at nothing, a scrawl, a loop,
         a little crossing-out. The gesture of indicating, not an indication. -->
    <svg
      class="pencil-mark"
      :class="`mark-${mark.kind}`"
      viewBox="0 0 64 32"
      :style="markStyle"
      aria-hidden="true"
      focusable="false"
    >
      <path
        :d="mark.d"
        fill="none"
        stroke="currentColor"
        stroke-width="1.1"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <!-- When the sheet was written on, in the corner, the way a date gets
         put on a drawing and then half forgotten. -->
    <p v-if="notation" class="notation">{{ notation }}</p>

    <p class="title-fragment"><span>{{ returnedTitle }}</span></p>

    <p class="catalogue">
      <span class="catalogue-line">
        <span class="catalogue-id">{{ catalogueId }}</span>
        <span class="catalogue-field">{{ vocabulary.field }}</span>
      </span>
      <span class="catalogue-coordinates"><span v-for="word in vocabulary.coordinates" :key="word">{{ word }}</span></span>
    </p>
  </figure>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import AsemicMarks from './AsemicMarks.vue';
import { specimenWordsFor } from '../specimen-vocabulary.js';
import { studyFor } from '../collage-studies.js';
import poems from '../poems.json';
import { rngFor } from '../asemic.js';
import { deckle, marginMark, crop, cropFamily, seamPair } from '../marginalia.js';
import { temperFor } from '../slow-hand.js';
import { prefersReducedMotion } from '../motion.js';

// The published crop. The folio rules in the stylesheet are kept intact, so
// the other composition is one word away.
const composition = 'cutup';

const props = defineProps({
  poem: { type: Object, required: true },
  context: { type: String, default: 'index' },
  markText: { type: String, default: '' },
  markSeed: { type: String, default: '' },
  progress: { type: Number, default: null }
});


const frame = ref(null);

/**
 * The plate fades while the poem is being read.
 *
 * Five minutes from arrival to nothing, on a poem page only — the index keeps
 * its collage, because a reader is passing through it rather than sitting with
 * it. A reload brings the plate back, so it is a property of the sitting rather
 * than anything remembered about the reader.
 *
 * It fades on the clock the reader is actually reading on: the animation is
 * paused whenever the tab is hidden, so a poem left open in a background tab is
 * still there on return. Without that, a reader who steps away for lunch comes
 * back to a page that has quietly emptied itself while nobody was looking at it.
 *
 * Being a CSS animation rather than a per-frame redraw, it costs nothing over
 * the five minutes and the compositor carries it. Restarting it needs the
 * remove-reflow-add idiom, because moving between poems on this site does not
 * remount the collage — the same figure is handed a new poem, and an animation
 * that has already run would stay finished.
 */
const READING_FADE = 'is-reading';

function syncFadeClock() {
  const el = frame.value;
  if (el) el.style.animationPlayState = document.hidden ? 'paused' : 'running';
}

async function restartFade() {
  await nextTick();
  const el = frame.value;
  if (!el) return;
  el.classList.remove(READING_FADE);
  void el.offsetWidth;
  if (props.context === 'poem') el.classList.add(READING_FADE);
  syncFadeClock();
}

onMounted(() => {
  document.addEventListener('visibilitychange', syncFadeClock);
  restartFade();
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', syncFadeClock);
});

// Moving between poems is a prop change here, not a remount, so the fade has
// to be told to begin again — otherwise the second poem inherits the first
// one's spent animation and its plate is already gone on arrival.
watch(() => props.poem?.path, restartFade);
const handled = ref(false);
const study = computed(() => studyFor(props.poem.path));
const vocabulary = computed(() => specimenWordsFor(props.poem));
// A poem page carries exactly one set of the four words, but which element
// holds them depends on the width. On a wide screen they belong to the left
// margin, beside the verse, where SpecimenVocabulary.vue sets them; the
// collage then keeps only its identifier. There is no margin on a phone —
// the meta block sits in the reading flow, above the verse — so the words
// were arriving as a third heading between the provenance and the poem. On a
// narrow screen the collage takes them instead, the way the index does, and
// the margin gives them up. The swap is a media query in both files rather
// than a reactive breakpoint here, so a pre-rendered shell cannot flash the
// wrong one before Vue picks up.
const returnedTitle = computed(() => String(props.poem.title || ''));
const handText = computed(() => props.markText || props.poem.content);
const handSeed = computed(() => props.markSeed || `${props.poem.slug}::folio`);
const catalogueId = computed(() => `MB / ${props.poem.catalogue || '00'}`);
const largeMarkSize = computed(() => {
  if (props.poem.path === 'in-of') return props.context === 'index' ? 39 : 33;
  return props.context === 'index' ? 28 : 25;
});

// One plate per session is written by a hand taking its time; every other
// plate gets the ordinary one.
const temper = computed(() => temperFor(props.poem.path));

/**
 * How this particular sheet was torn, and how it came to rest.
 *
 * Every plate used to share four hand-written polygons and six fixed angles,
 * so twenty-one poems were torn from the same sheet in the same places and
 * pinned at the same tilt. These are drawn from the poem's own seed instead:
 * fixed for that poem forever, and different from its neighbours.
 *
 * The large hand's sheet is left untorn on one side, so that line runs off
 * the paper and is cut by the frame rather than stopping at an edge.
 */
/**
 * Which ink the photograph is tinted with.
 *
 * Green five times in eight, rust twice, navy once — the frequency the marks
 * already keep. The house rule fixes the *order* of that frequency, navy rarer
 * than rust rarer than green, and drawing each plate's tint independently does
 * not guarantee it: over these 21 plates an independent draw came out green 14,
 * rust 3, navy 4, which inverts the last two. Twenty-one is simply too small a
 * sample for a ratio to show up in.
 *
 * So the tints are dealt rather than drawn. The whole set is put in a seeded
 * order and cut at the ratio, which makes the counts exact while leaving which
 * poem gets which as arbitrary as before. It is fixed per poem forever, like
 * everything else about a plate.
 */
const TINT_BY_POEM = (() => {
  const order = poems
    .map(poem => ({ path: poem.path, k: rngFor(`${poem.path}::tint`)() }))
    .sort((a, b) => a.k - b.k)
    .map(o => o.path);
  const greens = Math.round(order.length * 5 / 8);
  const rusts = Math.round(order.length * 2 / 8);
  const out = {};
  order.forEach((path, i) => {
    out[path] = i < greens ? 'green' : i < greens + rusts ? 'rust' : 'navy';
  });
  return out;
})();

const tint = computed(() => TINT_BY_POEM[props.poem.path] || 'green');

const plate = computed(() => {
  const R = rngFor(`${props.poem.path}::plate`);
  const spin = (base, range) => `${Math.round((base + (R() - 0.5) * range) * 100) / 100}deg`;
  const overshoot = R() < 0.5 ? 'left' : 'right';

  // How this poem's photographs are cut out.
  //
  // Every plate in the folio used to be a torn rectangle. deckle() varies the
  // tear beautifully but never the shape under it, so twenty-one plates rhymed
  // harder than they should have. The photographs now take one of five shapes,
  // each from a particular moment in the history of the thing: a clean Braque
  // quadrilateral with no two sides parallel, a Schwitters band of extreme
  // proportion run off both ends, a Matisse sweep cut freehand with no straight
  // edge in it, a Villeglé bite that opens the sheet so the one beneath shows
  // through, and a Bearden seam where two photographs abut along one shared
  // tear instead of overlapping. The house tear is still the commonest of them.
  //
  // One family to a poem, so a plate is one idea rather than a sampler, and
  // fixed to that poem forever. The ground, the hand's sheets and the large
  // hand stay torn whatever the photographs do — they are the paper, not the
  // picture.
  const family = cropFamily(`${props.poem.path}::crop`);
  const seam = family === 'seam' ? seamPair(`${props.poem.path}::seam`) : null;
  const cutTo = (options) => crop(R, { family: seam ? 'torn' : family, bite: 0.34, ...options });

  return {
    '--clip-ground': deckle(R, { steps: 5, tear: 2.1 }),
    '--clip-primary': seam ? seam.left : cutTo({ steps: 5, tear: 2.6 }),
    '--clip-secondary': seam ? seam.right : cutTo({ steps: 5, tear: 2.6 }),
    '--clip-tertiary': cutTo({ steps: 4, tear: 3 }),
    '--clip-large': deckle(R, { steps: 4, tear: 2.4, open: overshoot }),
    '--clip-trace': deckle(R, { steps: 5, tear: 1.9 }),
    '--spin-ground': spin(1.15, 2.6),
    '--spin-primary': spin(-2.1, 4.2),
    '--spin-secondary': spin(3, 4.6),
    '--spin-tertiary': spin(-5, 5.4),
    // The hand's own sheets carry the widest spread of any layer, and the
    // small one is allowed to cross zero: it leans left on some poems and
    // right on others rather than always settling the same way over.
    '--spin-large': spin(-6, 8.5),
    '--spin-trace': spin(1.1, 9.4),
    '--plate-tint': `var(--i-${tint.value})`
  };
});

const plateStyle = computed(() => ({
  ...plate.value,
  ...(study.value?.focus ? { '--focus': study.value.focus } : null)
}));

const mark = computed(() => marginMark(`${props.poem.path}::arrow`));

const markStyle = computed(() => ({
  left: mark.value.left,
  top: mark.value.top,
  transform: `translate(var(--shift-x), var(--shift-y)) rotate(${mark.value.angle}) scale(${mark.value.scale})`
}));

const MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// A date in the archival hand: month in roman, year in two figures. Taken
// from the poem's own front matter, not from the visit.
const notation = computed(() => {
  const raw = String(props.poem.date || '');
  const parts = raw.match(/^(\d{4})(?:-(\d{2}))?/);
  if (!parts) return '';
  const year = parts[1].slice(2);
  const month = parts[2] ? MONTHS[Number(parts[2]) - 1] : '';
  return month ? `${month} · ${year}` : year;
});

function respondsToHandling() {
  return !prefersReducedMotion();
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
  // The found label is on nothing else's plane. It follows the pointer across
  // and resists it downward, and it swings a little, the way a card laid on a
  // sheet moves differently from the sheet.
  el.style.setProperty('--title-x', `${dx * 0.52}px`);
  el.style.setProperty('--title-y', `${-dy * 0.3}px`);
  el.style.setProperty('--title-tilt', `${nx * 1.3}deg`);

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
    '--photo-y-reverse',
    '--title-x',
    '--title-y'
  ]) {
    el.style.setProperty(name, '0px');
  }
  el.style.setProperty('--title-tilt', '0deg');
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
  --title-x: 0px;
  --title-y: 0px;
  --title-tilt: 0deg;
  --clip-ground: none;
  --clip-primary: none;
  --clip-secondary: none;
  --clip-tertiary: none;
  --clip-large: none;
  --clip-trace: none;
  --spin-ground: 1.15deg;
  --spin-primary: -2.1deg;
  --spin-secondary: 3deg;
  --spin-tertiary: -5deg;
  --spin-large: -6.5deg;
  --spin-trace: 1.7deg;
  position: relative;
  isolation: isolate;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--a-hair);
  background-color: color-mix(in srgb, var(--a-bg) 94%, var(--accent));
  color: var(--a-ink);
  cursor: grab;
  touch-action: pan-y;
}

.specimen:active {
  cursor: grabbing;
}

/* The wedge of ground the plate is laid on. It used to be the figure's own
   background, alongside the flat tint. A gradient cannot be animated away —
   background-image is not interpolable, so it would flip at the halfway mark —
   and at the end of the reading fade it was the one thing left drawing a
   rectangle where the plate had been. On its own element it fades like
   everything else. */
.specimen::before {
  content: '';
  position: absolute;
  z-index: 0;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(114deg, transparent 0 64%, color-mix(in srgb, var(--accent) 3%, transparent) 64% 100%);
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

/* No border and no shadow. A fragment lying in the page rather than a card set
   on top of it.

   It used to end by fading through a radial mask, which put a soft circle on
   every photograph — a vignette, and a vignette reads as a filter rather than as
   a torn edge. What ends the fragment now is the tear it already had:
   `clip-path: var(--clip-primary)` and its siblings, generated per poem in
   marginalia.js. That is a real edge with a shape, and it agrees with the rest
   of the folio in a way a circle never did. The rule that a fragment must not
   stop on a hard border still holds — a deckle is not a border. */
.image-sheet {
  overflow: hidden;
}

/* A hint of colour in the photograph itself, at the frequency the inks already
   keep: green five times in eight, rust twice, navy once. Blended as `color`, so
   only hue and saturation cross over and the plate keeps its own tone exactly —
   and at this opacity it is meant to be felt rather than seen. Drawn from its
   own seed rather than the plate's, so adding it does not shift the tear and
   tilt that the plate's own sequence of draws produces. */
.image-sheet::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: rgb(var(--plate-tint));
  mix-blend-mode: color;
  opacity: 0.1;
}

.image-sheet img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: var(--focus, center);
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
  opacity: 0.1;
  mix-blend-mode: multiply;
  clip-path: var(--clip-large);
  /* Pressure, not a switch: the hand darkens under a resting pointer over
     about half a second, and lets go just as slowly. */
  transition:
    transform 620ms cubic-bezier(0.2, 0.74, 0.16, 1),
    opacity 520ms ease,
    clip-path 620ms cubic-bezier(0.2, 0.74, 0.16, 1);
  transform: translate(var(--shift-x), var(--shift-y)) rotate(-4.5deg);
}

.large-trace {
  width: 100%;
  height: 100%;
}

.has-large-hand .large-trace-sheet {
  top: 28%;
  height: 39%;
  opacity: 0.25;
  transform: translate(var(--shift-x), var(--shift-y)) rotate(calc(var(--spin-large) + 0.3deg));
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
  opacity: 0.79;
  transition: opacity 520ms ease;
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
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: 0.005em;
  color: var(--a-ink);
  text-align: right;
  opacity: 0.6;
  transform: translate(var(--title-x), var(--title-y)) rotate(calc(0.35deg + var(--title-tilt)));
  transition: opacity 260ms ease, transform 520ms cubic-bezier(0.2, 0.74, 0.16, 1);
}

.pencil-mark {
  position: absolute;
  z-index: 6;
  width: 3.4rem;
  height: auto;
  color: var(--a-ink);
  opacity: 0.15;
  pointer-events: none;
  transform-origin: 50% 50%;
  transition: opacity 520ms ease, transform 620ms cubic-bezier(0.2, 0.74, 0.16, 1);
}

/* A scrawl covers more paper than an arrow does; it does not need to be as
   present to be seen. */
.mark-scribble { opacity: 0.115; }
.mark-spiral { width: 3rem; }

.notation {
  position: absolute;
  z-index: 8;
  left: 4.5%;
  bottom: 4.4%;
  margin: 0;
  font-family: var(--f-cat);
  font-size: 0.5rem;
  letter-spacing: 0.2em;
  color: var(--a-ink-2);
  opacity: 0.3;
  transform: translate(var(--shift-x), var(--shift-y)) rotate(-1.6deg);
  transition: opacity 520ms ease;
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

/* The plate fades while the poem is read — five minutes from arrival to
   nothing, and a reload brings it back. The curve is an ease-in rather than a
   straight ramp: a linear opacity fade is perceived as fast-then-lingering,
   and the point here is that the first minute should be impossible to catch
   happening. `forwards` holds it at nothing rather than snapping back.

   Only on a poem page. The index keeps its collage — a reader is passing
   through the index, not sitting with it — which is why this hangs off
   .context-poem and not off .specimen. */
/* What the fade leaves behind is the four words, and nothing else.

   So it does not run on the figure — that would take the words with it, since
   opacity multiplies and a child cannot climb back out of a parent at zero.
   Every layer is faded on its own instead, and the plate's frame with them:
   the border and the ground go to transparent, leaving only the 3% gradient
   wedge, which is imperceptible. `.catalogue` is the one child left out of it,
   and its identifier is faded back in on its own, so `MB / NN` goes the way of
   the picture and the words stay.

   The keyframe has no `from` on purpose. An explicit `from: 1` would snap every
   sheet to full opacity before starting — they sit at 0.1 to 0.79 — where an
   implicit one starts each layer from wherever it already was. */
.context-poem.is-reading > *:not(.catalogue),
.context-poem.is-reading::before,
.context-poem.is-reading::after,
.context-poem.is-reading .catalogue-id {
  animation: plate-read 300s cubic-bezier(0.62, 0.02, 0.86, 0.55) forwards;
}

.context-poem.is-reading {
  animation: plate-frame 300s cubic-bezier(0.62, 0.02, 0.86, 0.55) forwards;
}

@keyframes plate-read {
  to { opacity: 0; }
}

@keyframes plate-frame {
  to {
    border-color: transparent;
    background-color: transparent;
  }
}

/* A reader who has asked for less movement is not asking to watch a five
   minute dissolve. */
@media (prefers-reduced-motion: reduce) {
  .context-poem.is-reading,
  .context-poem.is-reading > *,
  .context-poem.is-reading::before,
  .context-poem.is-reading::after,
  .context-poem.is-reading .catalogue-id { animation: none; }
}

.catalogue-line {
  display: flex;
  align-items: baseline;
  gap: 0.62em;
}

.catalogue-id {
  color: var(--accent);
  opacity: 0.72;
}

/* See the note by the template: on a poem page the margin owns the words
   above this width, so the collage lets them go. Below it the margin gives
   them up instead (PoemPage.vue), and these are the only set on the page. */
@media (min-width: 861px) {
  .context-poem .catalogue-field,
  .context-poem .catalogue-coordinates {
    display: none;
  }
}

.catalogue-field {
  color: var(--accent);
  opacity: 0.24;
  text-transform: uppercase;
  transition: opacity 300ms ease;
}

/* The words were separated by middots. They are set apart by space now, which
   is the quieter reading of a list that is not a sentence. */
.catalogue-coordinates {
  display: flex;
  gap: 0.62em;
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
  opacity: 0.07;
}

.specimen[data-composition='folio'].has-large-hand .large-trace-sheet {
  opacity: 0.15;
}

/* Cut-up changes the crop and the spacing, not the volume. */
.specimen[data-composition='cutup'] .sheet-ground {
  inset: 3% 4% 4% 5%;
  clip-path: var(--clip-ground);
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(var(--spin-ground));
}

.specimen[data-composition='cutup'] .layer-primary {
  left: 4%;
  top: 5%;
  width: 71%;
  height: 61%;
  clip-path: var(--clip-primary);
  transform: translate(var(--shift-x), var(--shift-y)) rotate(var(--spin-primary));
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
  clip-path: var(--clip-secondary);
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(var(--spin-secondary));
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
  clip-path: var(--clip-tertiary);
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(var(--spin-tertiary));
}

.specimen[data-composition='cutup'] .large-trace-sheet {
  left: -13%;
  top: 29%;
  width: 124%;
  height: 37%;
  opacity: 0.135;
  clip-path: var(--clip-large);
  transform: translate(var(--shift-x), var(--shift-y)) rotate(var(--spin-large));
}

.specimen[data-composition='cutup'].has-large-hand .large-trace-sheet {
  top: 23%;
  height: 48%;
  opacity: 0.225;
}

.specimen[data-composition='cutup'] .trace-sheet {
  right: -1%;
  top: 3%;
  width: 57%;
  height: 88%;
  padding: 9% 8%;
  border: 0;
  clip-path: var(--clip-trace);
  background: color-mix(in srgb, var(--a-bg) 54%, transparent);
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(var(--spin-trace));
}

.specimen[data-composition='cutup']:not(.has-study) .trace-sheet {
  inset: 7% 4% 7% 28%;
  width: auto;
  height: auto;
  padding: 7%;
  background: color-mix(in srgb, var(--a-bg) 37%, transparent);
}

/* A resting pointer is pressure rather than a switch: the hand comes up
   under it over about half a second, and lets go just as slowly. Placed
   after the composition rules and before the handling ones, so pressing a
   plate still overrules merely hovering over it. */
@media (hover: hover) {
  .specimen:hover .trace {
    opacity: 0.78;
  }

  .specimen:hover .large-trace-sheet {
    opacity: 0.155;
  }

  .specimen:hover.has-large-hand .large-trace-sheet {
    opacity: 0.258;
  }

  .specimen:hover .pencil-mark {
    opacity: 0.24;
  }

  .specimen:hover .mark-scribble {
    opacity: 0.185;
  }

  .specimen:hover .notation {
    opacity: 0.46;
  }
}

/* Pressing separates the layers the way paper comes apart in the hand: they
   part a little and settle. They do not scatter. These follow the composition
   rules on purpose — same specificity, later in the file, so they win. */
.specimen.is-handled .trace-sheet {
  opacity: 0.62;
  transform: translate(calc(var(--shift-x-reverse) + 3.2%), calc(var(--shift-y-reverse) - 1.6%)) rotate(calc(var(--spin-trace) - 0.2deg));
}

.specimen.is-handled .large-trace-sheet {
  opacity: 0.19;
  transform: translate(calc(var(--shift-x) - 1.2%), calc(var(--shift-y) + 1.8%)) rotate(calc(var(--spin-large) + 1.1deg)) scale(1.012);
}

.specimen.is-handled.has-large-hand .large-trace-sheet {
  opacity: 0.27;
}

.specimen.is-handled .layer-primary {
  transform: translate(calc(var(--shift-x) - 0.9%), calc(var(--shift-y) + 0.9%)) rotate(calc(var(--spin-primary) + 0.5deg));
}

.specimen.is-handled .layer-secondary {
  opacity: 0.66;
  transform: translate(calc(var(--shift-x-reverse) + 1.3%), calc(var(--shift-y-reverse) - 0.9%)) rotate(calc(var(--spin-secondary) - 0.6deg));
}

.specimen.is-handled .layer-tertiary {
  opacity: 0.36;
}

.specimen.is-handled .image-sheet img {
  filter: grayscale(0.85) sepia(0.07) saturate(0.6) contrast(0.94) brightness(0.99) blur(0.2px);
}

.specimen.is-handled .title-fragment {
  opacity: 0.82;
  transform: translate(calc(var(--title-x) - 1%), calc(var(--title-y) - 4%)) rotate(calc(-0.5deg + var(--title-tilt)));
}

/* A field is a tonal expanse: it fills the panel, and --focus decides what
   part of it the panel is looking at. */

/* A form is a single shape — a disc, a leaf, a spiral in a dark sky — and it
   needs the space around it, so it is contained rather than cropped. No mask
   cuts a circle here: a round crop at this size becomes a porthole. */
[data-specimen='form'] .layer-primary {
  left: 8%;
  top: 6%;
  width: 60%;
  height: 60%;
}

[data-specimen='form'] .layer-primary img,
[data-specimen='form'] .layer-secondary img {
  object-fit: contain;
  object-position: center center;
}

.specimen[data-composition='folio'][data-specimen='form'] .layer-primary {
  left: 9%;
  top: 6%;
  width: 58%;
  height: 60%;
}

.specimen[data-composition='cutup'][data-specimen='form'] .layer-primary {
  left: 3%;
  top: 4%;
  width: 66%;
  height: 66%;
}

.specimen[data-composition='cutup'][data-specimen='form'] .layer-secondary {
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
