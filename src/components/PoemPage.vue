<template>
  <div
    class="poem-plate"
    v-if="poem"
    @pointerdown="beginSwipe"
    @pointerup="endSwipe"
    @pointercancel="cancelSwipe"
  >
    <div class="chrome">
      <a href="/">mihir bellamkonda</a>
      <a href="/#index">poems</a>
    </div>

    <main class="grid" id="main" tabindex="-1">
      <div class="margin-meta">
        <div class="num">{{ pad(index) }} / {{ pad(total) }}</div>
        <h1 data-page-heading tabindex="-1">{{ poem.title }}</h1>
        <p v-if="poem.subtitle" class="dedication">{{ poem.subtitle }}</p>

        <div class="provenance">
          <template v-if="poem.unpublished">
            <span class="k">unpublished</span>
            <span v-if="year">{{ year }}</span>
          </template>

          <template v-else-if="poem.published_in">
            <span class="k">first published</span>
            <a
              v-if="poem.external_url"
              :href="poem.external_url"
              target="_blank"
              rel="noopener"
            >{{ poem.published_in }}<template v-if="year">, {{ year }}</template><span
              class="ext" aria-hidden="true">&#8599;</span><span
              class="sr-only"> (opens in a new tab)</span></a>
            <span v-else>{{ poem.published_in }}<template v-if="year">, {{ year }}</template></span>
          </template>

          <template v-else-if="poem.external_url">
            <span class="k">venue not recorded</span>
            <a :href="poem.external_url" target="_blank" rel="noopener">read it<template v-if="year">, {{ year }}</template><span
              class="ext" aria-hidden="true">&#8599;</span><span
              class="sr-only"> (opens in a new tab)</span></a>
          </template>

          <template v-else-if="year">
            <span class="k">written</span>
            <span>{{ year }}</span>
          </template>
        </div>

        <SpecimenVocabulary :poem="poem" />

        <div class="tools">
          <button type="button" class="copy" @click="sharePoem">
            {{ copied ? 'link copied' : 'share poem' }}
          </button>
          <span class="sr-only" role="status" aria-live="polite">{{ copied ? 'Link copied' : '' }}</span>
        </div>

        <div v-if="poem.audio" class="reading">
          <audio
            ref="audioEl"
            class="audio-engine"
            :src="poem.audio"
            preload="metadata"
            @loadedmetadata="syncReading"
            @durationchange="syncReading"
            @timeupdate="syncReading"
            @play="readingStarted = true; isPlaying = true"
            @pause="isPlaying = false"
            @ended="isPlaying = false"
          ></audio>
          <button type="button" class="listen" @click="toggleReading">
            {{ isPlaying ? 'pause reading' : currentTime > 0 ? 'resume reading' : 'listen' }}
          </button>
          <input
            class="reading-position"
            type="range"
            min="0"
            :max="duration || 0"
            step="0.1"
            :value="currentTime"
            aria-label="Reading position"
            @input="seekReading"
          >
          <span class="reading-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        </div>

        <!-- The arrow keys have always worked; nothing ever said so. Hidden
             where there is no keyboard to press. -->
        <p class="hint" v-if="(prev || next) && showsHint">
          <kbd>&#8592;</kbd><kbd>&#8594;</kbd> to move between poems
        </p>

      </div>

      <div class="study">
        <SpecimenCollage
          v-if="ghost && hasSpecimen"
          class="specimen-ghost"
          :poem="poem"
          :mark-text="ghost.content"
          :mark-seed="`${poem.slug}::ghost`"
          :progress="handProgress"
          context="poem"
        />

        <AsemicMarks
          v-else-if="ghost"
          class="ghost"
          :text="ghost.content"
          :seed="poem.slug + '::ghost'"
          :progress="handProgress"
        />
      </div>

      <!-- Nothing in here is styled differently from anything else in here.
           Emphasis, where it appears, is the poet's own. -->
      <div class="verse" ref="verseEl">
        <p class="stanza" v-for="(stanza, s) in stanzas" :key="s">
          <span class="l" v-for="(line, l) in stanza" :key="l" v-html="line"></span>
        </p>
      </div>
    </main>

    <div class="rest"></div>
    <FooterNav :prev="prev" :next="next" :position="pad(index) + ' / ' + pad(total)" :on-go="onGo" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import FooterNav from './FooterNav.vue';
import AsemicMarks from './AsemicMarks.vue';
import SpecimenCollage from './SpecimenCollage.vue';
import SpecimenVocabulary from './SpecimenVocabulary.vue';
import { studyFor } from '../collage-studies.js';
import { needsArrowHint } from '../arrow-hint.js';
import { prefersReducedMotion } from '../motion.js';

const props = defineProps({
  poem: Object,
  index: Number,
  total: Number,
  prev: { type: Object, default: null },
  next: { type: Object, default: null },
  ghost: { type: Object, default: null },
  onGo: { type: Function, default: null }
});

function pad(n) {
  return (n < 10 ? '0' : '') + n;
}

const copied = ref(false);
const showsHint = ref(needsArrowHint());
let copyTimer = null;
const audioEl = ref(null);
const readingStarted = ref(false);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);

const readingProgress = computed(() => {
  if (!readingStarted.value || !duration.value) return null;
  return Math.max(0, Math.min(1, currentTime.value / duration.value));
});

async function toggleReading() {
  const audio = audioEl.value;
  if (!audio) return;
  if (!audio.paused) {
    audio.pause();
    return;
  }
  readingStarted.value = true;
  try {
    await audio.play();
  } catch {
    isPlaying.value = false;
  }
}

function syncReading() {
  const audio = audioEl.value;
  if (!audio) return;
  currentTime.value = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  duration.value = Number.isFinite(audio.duration) ? audio.duration : 0;
}

function seekReading(event) {
  const audio = audioEl.value;
  if (!audio) return;
  readingStarted.value = true;
  audio.currentTime = Number(event.target.value);
  syncReading();
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/**
 * Open the native share sheet on touch devices; copy the canonical URL
 * everywhere else. Every poem has a real shareable address and card.
 */
async function sharePoem() {
  const url = window.location.origin + props.poem.url;
  const shareData = {
    title: `${props.poem.title} — Mihir Bellamkonda`,
    text: `“${props.poem.title},” a poem by Mihir Bellamkonda.`,
    url
  };

  if (window.matchMedia('(pointer: coarse)').matches && navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
  } catch (e) {
    // Clipboard is unavailable over plain http and in some embedded
    // browsers. Select the address instead of failing silently.
    window.prompt('Copy this link', url);
    return;
  }
  copied.value = true;
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => { copied.value = false; }, 2000);
}

/**
 * The hand keeps pace with the reader.
 *
 * Nothing else on the page knew how far into the poem anyone was: the marks
 * beside it were written once, on arrival, at their own speed. Now the
 * reader's descent through the verse holds the pen, and an audio reading
 * takes it back the moment one starts — a recording of the poet reading is a
 * better authority on where in the poem we are than the scrollbar is.
 *
 * The marks begin part-written. A reader who arrives at a short poem and
 * never scrolls should still find a hand beside it, not a blank column.
 */
const verseEl = ref(null);
const scrollDepth = ref(0);
const paced = ref(true);
let measuring = null;

const handProgress = computed(() => {
  if (readingProgress.value !== null) return readingProgress.value;
  if (!paced.value) return null;
  return 0.16 + 0.84 * scrollDepth.value;
});

function measure() {
  measuring = null;
  const el = verseEl.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const travelled = (window.innerHeight || 1) * 0.78 - rect.top;
  scrollDepth.value = Math.max(0, Math.min(1, travelled / Math.max(rect.height, 1)));
}

function onScroll() {
  if (measuring) return;
  measuring = requestAnimationFrame(measure);
}

/**
 * Swipe between poems, on touch only.
 *
 * The card stack this site once had made the gesture the *only* way through
 * the book and hid the index behind it. This is the opposite arrangement:
 * every link, the footer and the arrow keys still do what they did, and a
 * thumb gets a shortcut. A swipe that begins on the collage belongs to the
 * collage, which has its own gesture.
 */
let swipe = null;
const fingers = new Set();

function beginSwipe(event) {
  if (event.pointerType !== 'touch') return;
  fingers.add(event.pointerId);

  // Two fingers on the page is a pinch, or a reader steadying the phone, and
  // neither is a swipe. Abandoning the gesture is not enough on its own: the
  // second finger would otherwise start a gesture of its own and finish it.
  if (fingers.size > 1) {
    swipe = null;
    return;
  }

  swipe = event.target?.closest?.('.specimen, a, button, input, audio, [contenteditable]')
    ? null
    : { id: event.pointerId, x: event.clientX, y: event.clientY, at: Date.now() };
}

function cancelSwipe(event) {
  fingers.delete(event.pointerId);
  swipe = null;
}

function endSwipe(event) {
  fingers.delete(event.pointerId);
  const start = swipe;
  swipe = null;
  if (!start || event.pointerType !== 'touch' || event.pointerId !== start.id) return;
  if (Date.now() - start.at > 800) return;

  const dx = event.clientX - start.x;
  const dy = event.clientY - start.y;
  if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.7) return;

  const destination = dx < 0 ? props.next : props.prev;
  if (destination) props.onGo?.(destination.slug);
}

onMounted(() => {
  paced.value = !prefersReducedMotion();
  measure();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
});

onUnmounted(() => {
  clearTimeout(copyTimer);
  if (measuring) cancelAnimationFrame(measuring);
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onScroll);
});

const year = computed(() => {
  const d = props.poem && props.poem.date;
  if (!d) return '';
  const m = String(d).match(/\d{4}/);
  return m ? m[0] : '';
});

// Every poem carries a study now, so the collage is the illegible column.
const hasSpecimen = computed(() => Boolean(studyFor(props.poem?.path)));


// Prefer the structured stanzas from the build script; fall back to splitting
// the raw markdown so an older poems.json still renders.
const stanzas = computed(() => {
  if (!props.poem) return [];
  if (props.poem.stanzas && props.poem.stanzas.length) return props.poem.stanzas;
  return String(props.poem.content || '')
    .split(/\n[ \t]*\n/)
    .map(block => block.split('\n').map(l => l.trim()).filter(Boolean))
    .filter(block => block.length > 0);
});
</script>

<style scoped>
.poem-plate {
  position: relative;
  background: var(--a-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}


.chrome {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(1.4rem, 4vw, 2.4rem) clamp(1.25rem, 5vw, 4.5rem) 0;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1.5rem;
  font-family: var(--f-cat);
  font-size: 0.63rem;
  letter-spacing: 0.18em;
  color: var(--a-faint);
}

.chrome a {
  color: var(--a-faint);
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

.chrome a:hover {
  color: var(--a-ink);
  border-bottom-color: var(--a-hair);
}

.grid {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(5rem, 17vh, 10rem) clamp(1.25rem, 5vw, 4.5rem) 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  grid-template-areas:
    'meta verse'
    'study verse';
  grid-template-rows: auto 1fr;
  gap: 0 clamp(2rem, 7vw, 7rem);
  align-items: start;
}

.margin-meta {
  grid-area: meta;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.num {
  font-family: var(--f-cat);
  font-size: 0.63rem;
  letter-spacing: 0.2em;
  color: var(--a-faint);
  font-variant-numeric: tabular-nums;
}

.margin-meta h1 {
  font-family: var(--f-display);
  font-weight: 300;
  font-size: clamp(2.3rem, 5.6vw, 3.7rem);
  line-height: 1;
  margin: 0;
  text-wrap: balance;
  color: var(--a-ink);
}

.dedication {
  font-family: var(--f-display);
  font-style: italic;
  font-size: 1.05rem;
  color: var(--a-ink-2);
  margin: 0;
}

.provenance {
  display: flex;
  flex-direction: column;
  max-width: 28ch;
  font-family: var(--f-cat);
  font-size: 0.64rem;
  line-height: 2;
  color: var(--a-ink-2);
}

.provenance .k {
  color: var(--a-faint);
  letter-spacing: 0.16em;
  font-size: 0.58rem;
}

.provenance a {
  color: var(--a-ink-2);
  text-decoration: none;
  border-bottom: 1px solid var(--a-hair);
}

.provenance a:hover {
  color: var(--a-ink);
  border-bottom-color: var(--a-ink-2);
}

.ext {
  display: inline-block;
  margin-left: 0.3em;
  font-size: 0.85em;
  vertical-align: baseline;
}

.tools {
  display: flex;
  gap: 1.2rem;
  align-items: baseline;
}

.copy {
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-family: var(--f-cat);
  font-size: 0.6rem;
  letter-spacing: 0.16em;
  color: var(--a-faint);
  border-bottom: 1px solid transparent;
  transition: color 0.2s ease;
}

.copy:hover {
  color: var(--a-ink);
  border-bottom-color: var(--a-hair);
}

.copy:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 3px;
}

.hint {
  margin: 0;
  font-family: var(--f-cat);
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  color: var(--a-faint);
}

.reading {
  display: grid;
  grid-template-columns: auto minmax(5rem, 1fr);
  align-items: center;
  gap: 0.55rem 0.9rem;
  max-width: 24rem;
}

.audio-engine {
  display: none;
}

.listen {
  border: 0;
  border-bottom: 1px solid var(--a-hair);
  padding: 0 0 0.12rem;
  background: none;
  color: var(--a-ink-2);
  font-family: var(--f-cat);
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  cursor: pointer;
}

.listen:hover {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.reading-position {
  width: 100%;
  accent-color: var(--accent);
}

.reading-time {
  grid-column: 2;
  font-family: var(--f-cat);
  font-size: 0.56rem;
  letter-spacing: 0.08em;
  color: var(--a-faint);
  font-variant-numeric: tabular-nums;
}

.hint kbd {
  font: inherit;
  border: 1px solid var(--a-hair);
  border-radius: 2px;
  padding: 0.05rem 0.3rem;
  margin-right: 0.25rem;
}

/* No keyboard to press. */
@media (hover: none) {
  .hint { display: none; }
}

/* The illegible column. Its height is the composition — the marks fill
   whatever room they are given, so this is a layout decision. */
.ghost {
  height: clamp(15rem, 40vh, 32rem);
  margin-top: 0.4rem;
}

.specimen-ghost {
  margin-top: 0.4rem;
}

.study {
  grid-area: study;
}

.verse {
  grid-area: verse;
  font-size: clamp(1.02rem, 1.45vw, 1.13rem);
  line-height: 1.78;
  max-width: 40rem;
  color: var(--a-ink);
}

.stanza {
  margin: 0 0 1.78em;
}

.stanza:last-child {
  margin-bottom: 0;
}

/* A section header the poet marked himself. Spectral is self-hosted at 200,
   300 and 400 only, so 400 against the 300 body is a real weight rather than
   the browser synthesising a bold it does not have. */
.verse :deep(strong) {
  font-weight: 400;
}

/* Each line is its own block with a hanging indent, so a wrap is visibly a
   wrap and not a break the poet made. This replaces fitPoemToWidth(), which
   shrank the type until the longest line fit — quietly rendering poems with
   long lines smaller than the rest of the book. */
.l {
  display: block;
  text-indent: -1.4em;
  padding-left: 1.4em;
}

.rest {
  height: clamp(10rem, 34vh, 20rem);
}

@media (max-width: 860px) {
  /* There is no left margin at this width — the meta block is in the reading
     flow, above the verse — so the four words were reading as a heading
     between the provenance and the poem rather than as a note in the margin.
     The collage takes them at this width, the way the index does. */
  :deep(.specimen-vocabulary) {
    display: none;
  }

  .ghost {
    height: 8rem;
  }

  .specimen-ghost {
    height: 18rem;
  }

  .grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      'meta'
      'verse'
      'study';
    gap: 2.6rem;
    padding-top: clamp(4rem, 14vh, 7rem);
  }

  .verse {
    max-width: none;
  }

  .rest {
    height: clamp(6rem, 20vh, 12rem);
  }
}

@media print {
  .chrome, .tools, .hint, .reading, .study { display: none; }
  .poem-plate { min-height: 0; }
  .grid {
    display: grid;
    grid-template-columns: minmax(1.3in, 0.42fr) minmax(0, 1fr);
    grid-template-areas: 'meta verse';
    gap: 0 0.42in;
    max-width: none;
    padding: 0;
  }
  .margin-meta { gap: 0.16in; }
  .margin-meta h1 { font-size: 28pt; }
  .dedication { font-size: 10pt; }
  .verse { max-width: none; font-size: 10.5pt; line-height: 1.48; }
  .stanza { margin-bottom: 1em; break-inside: avoid; }
  .rest { display: none; }
  .num, .provenance { color: #000; }
}
</style>
