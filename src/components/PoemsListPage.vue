<template>
  <div class="index-page">
    <div class="inner">
      <div class="chrome">
        <a href="/">mihir bellamkonda</a>
        <span>{{ pad(poems.length) }}</span>
      </div>

      <h1 class="sr-only" data-page-heading tabindex="-1">Poems</h1>

      <div class="lead"></div>

      <div class="index-stage">
      <main class="rows" id="main" tabindex="-1">
        <!-- The index is ruled by hand. Same seeds, same lines, every load —
             but no two of them are the same line. -->
        <DrawnRule class="rule opening-rule" seed="index::opening" />

        <template v-for="(poem, i) in poems" :key="poem.slug">
          <h2 v-if="i === 0" class="section-mark">selected</h2>
          <h2 v-else-if="i === 5" class="section-mark">archive</h2>

          <!-- Not a single <a> any more: the venue is its own link, and an
               anchor cannot legally contain another. The poem link is
               stretched across the row instead, so the whole row still
               opens the poem while the venue stays separately clickable. -->
          <div
            class="row"
            :class="{ 'peek-open': openSlug === poem.slug }"
            @mouseenter="approach(poem)"
            @focusin="approach(poem, true)"
            @pointerdown="approach(poem, true)"
          >
            <span class="no">{{ pad(i + 1) }}</span>

            <a
              class="rowlink"
              :href="poem.url"
              @click="follow($event, poem.slug)"
            >
              <span class="title">
                {{ poem.title }}
                <span v-if="poem.subtitle" class="ded">{{ poem.subtitle }}</span>
              </span>
            </a>

            <span class="where">
              <a
                v-if="poem.published_in && poem.external_url"
                class="venue"
                :href="poem.external_url"
                target="_blank"
                rel="noopener"
              >{{ poem.published_in }}<span class="ext" aria-hidden="true">&#8599;</span><span
                class="sr-only"> — read at the publisher, opens in a new tab</span></a>
              <span v-else-if="poem.published_in" class="venue">{{ poem.published_in }}</span>
              <span v-else-if="poem.unpublished" class="venue unpublished">unpublished</span>
              <span v-if="yearOf(poem)" class="yr">{{ yearOf(poem) }}</span>
              <button
                type="button"
                class="peek"
                :aria-expanded="openSlug === poem.slug"
                :aria-controls="`excerpt-${i}`"
                @click.prevent.stop="toggleExcerpt(poem.slug)"
              >{{ openSlug === poem.slug ? 'close' : 'excerpt' }}</button>
            </span>

            <!-- The poet's own line, unaltered, in the reading face. It is a
                 way in, not a caption. -->
            <span class="preview">
              <span
                class="firstline"
                :id="`excerpt-${i}`"
                :aria-hidden="openSlug === poem.slug ? undefined : 'true'"
                v-html="firstLine(poem)"
              ></span>

              <AsemicMarks
                :ref="el => rememberSignature(poem.slug, el)"
                class="sig"
                :text="poem.content"
                :seed="poem.slug + '::sig'"
                :max-lines="1"
                :temper="temperFor(poem.path)"
                instant
              />
            </span>

            <DrawnRule class="rule" :seed="`${poem.slug}::rule`" />
          </div>
        </template>
      </main>

      <!-- The collage opens its poem too. It is a second way in to a link the
           row already provides, so it stays out of the accessibility tree and
           out of the tab order rather than repeating that link for a reader
           who cannot see it. -->
      <aside class="folio-field" aria-hidden="true">
        <a
          class="folio-link"
          :href="activePoem.url"
          tabindex="-1"
          draggable="false"
          @pointerdown="beginCollagePress"
          @click="followCollage"
        >
        <Transition name="specimen-swap" mode="out-in">
          <SpecimenCollage
            :key="activePoem.slug"
            :poem="activePoem"
            :mark-text="activePoem.content"
            :mark-seed="`${activePoem.slug}::folio`"
            context="index"
          />
        </Transition>
        </a>
      </aside>
      </div>

      <div class="rest"></div>
    </div>

    <FooterNav />
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import FooterNav from './FooterNav.vue';
import AsemicMarks from './AsemicMarks.vue';
import SpecimenCollage from './SpecimenCollage.vue';
import DrawnRule from './DrawnRule.vue';
import { temperFor } from '../slow-hand.js';

const props = defineProps({
  poems: Array,
  onSelect: Function
});

const openSlug = ref('');
const activePoem = ref(
  props.poems.find(poem => poem.path === 'a-quiet-family') || props.poems[0]
);
const signatureRefs = new Map();
const approached = new Set();
let approachTimer = null;

function toggleExcerpt(slug) {
  openSlug.value = openSlug.value === slug ? '' : slug;
}

function rememberSignature(slug, instance) {
  if (instance) signatureRefs.set(slug, instance);
  else signatureRefs.delete(slug);
}

function approach(poem, immediate = false) {
  clearTimeout(approachTimer);

  const show = () => {
    activePoem.value = poem;
    approachTimer = null;
  };

  if (immediate) show();
  else approachTimer = setTimeout(show, 80);

  const slug = poem.slug;
  if (approached.has(slug)) return;
  approached.add(slug);
  signatureRefs.get(slug)?.replay?.();
}

onUnmounted(() => clearTimeout(approachTimer));

// Handling the collage — moving in it, pressing to separate the layers — must
// not count as a click. A press that lingers or travels is the gesture; a
// short, still one is someone asking for the poem.
let collagePress = null;

function beginCollagePress(event) {
  collagePress = { at: Date.now(), x: event.clientX, y: event.clientY };
}

function followCollage(event) {
  const press = collagePress;
  collagePress = null;
  if (press) {
    const travelled = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    if (Date.now() - press.at > 400 || travelled > 8) {
      event.preventDefault();
      return;
    }
  }
  follow(event, activePoem.value.slug);
}

function follow(event, slug) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  props.onSelect?.(slug);
}

function pad(n) {
  return (n < 10 ? '0' : '') + n;
}

function yearOf(poem) {
  if (!poem.date) return '';
  const m = String(poem.date).match(/\d{4}/);
  return m ? m[0] : '';
}

// stanzas[0][0] is already a complete HTML fragment from build-poems.js,
// carrying the poet's emphasis and nothing added. A poem that opens on a
// section header — Dallas on "1. Father", New Orleans on "1. River" — would
// otherwise preview the header instead of a line of the poem.
const SECTION_HEADER = /^<strong>[^<]*<\/strong>$/;

function firstLine(poem) {
  const lines = (poem.stanzas || []).flat();
  return lines.find(line => !SECTION_HEADER.test(line)) || lines[0] || '';
}
</script>

<style scoped>
.index-page {
  background: var(--a-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.inner {
  flex: 1;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 clamp(1.25rem, 5vw, 4.5rem);
}

.chrome {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1.5rem;
  padding: clamp(1.4rem, 4vw, 2.4rem) 0 0;
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

/* The list explains itself; it gets space instead of a heading. */
.lead {
  height: clamp(3.5rem, 11vh, 7rem);
}

.index-stage {
  display: grid;
  grid-template-columns: minmax(31rem, 0.92fr) minmax(27rem, 1.08fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: start;
}

.rows {
  display: flex;
  flex-direction: column;
}

/* The rules straddle the row edge rather than sitting on it, so the line
   reads as drawn across the page and not as the boundary of a box. */
.rule {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  color: var(--a-hair);
}

.opening-rule {
  position: relative;
  bottom: auto;
  margin-bottom: -4px;
}

.folio-field {
  position: sticky;
  top: clamp(1.4rem, 4vw, 2.4rem);
  height: clamp(32rem, 76vh, 49rem);
}

.folio-link {
  display: block;
  height: 100%;
  color: inherit;
  text-decoration: none;
  -webkit-user-drag: none;
}

.specimen-swap-enter-active,
.specimen-swap-leave-active {
  transition: opacity 180ms ease, transform 260ms ease;
}

.specimen-swap-enter-from {
  opacity: 0;
  transform: translateY(0.5rem);
}

.specimen-swap-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

.row {
  position: relative;
  display: grid;
  grid-template-columns: 2.8rem minmax(0, 1fr) minmax(7.5rem, 9.5rem);
  gap: 0 clamp(0.8rem, 2vw, 1.45rem);
  align-items: baseline;
  width: 100%;
  padding: clamp(1rem, 2.1vw, 1.45rem) 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
}

.rowlink {
  grid-column: 2 / 3;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

/* Stretched across the whole row, so the row remains one large target
   without the markup nesting one link inside another. */
.rowlink::after {
  content: '';
  position: absolute;
  inset: 0;
}

/* The venue rides above the stretched link so it stays clickable. */
.where a {
  position: relative;
  z-index: 1;
}

/* The opening group is deliberately selected; the remainder is the archive.
   Naming that choice keeps the non-chronological order from looking accidental. */
.section-mark {
  margin: 0;
  padding: clamp(1.6rem, 3.5vw, 2.4rem) 0 0.55rem;
  font-family: var(--f-cat);
  font-weight: 400;
  font-size: 0.58rem;
  letter-spacing: 0.22em;
  color: var(--a-faint);
}

.no {
  font-family: var(--f-cat);
  font-size: 0.63rem;
  letter-spacing: 0.16em;
  color: var(--a-faint);
  font-variant-numeric: tabular-nums;
}

.title {
  font-family: var(--f-display);
  font-weight: 300;
  font-size: clamp(1.24rem, 2vw, 1.68rem);
  line-height: 1.18;
  color: var(--a-ink);
  transition: color 0.2s ease;
}

.ded {
  display: block;
  font-family: var(--f-cat);
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  color: var(--a-faint);
  margin-top: 0.35rem;
}

.where {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
  font-family: var(--f-cat);
  font-size: 0.62rem;
  line-height: 1.6;
  color: var(--a-ink-2);
  text-align: right;
}

.where .yr {
  color: var(--a-faint);
  font-variant-numeric: tabular-nums;
}

.where .venue.unpublished {
  color: var(--a-faint);
  font-style: italic;
}

.where a.venue {
  color: var(--a-ink-2);
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

.where a.venue:hover {
  color: var(--a-ink);
  border-bottom-color: var(--a-hair);
}

.where a.venue:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 3px;
}

.peek {
  display: none;
  position: relative;
  z-index: 2;
  border: 0;
  border-bottom: 1px solid var(--a-hair);
  padding: 0 0 0.08rem;
  background: none;
  color: var(--a-faint);
  font: inherit;
  letter-spacing: 0.08em;
  cursor: pointer;
}

.ext {
  display: inline-block;
  margin-left: 0.25em;
  font-size: 0.85em;
}

/* Signature and excerpt share one reserved line, so browsing never makes the
   rows jump under the pointer. */
/* The signature and the poet's line occupy one cell and cross-fade in it, so
   the reserved area is exactly as tall as the taller of the two and the row
   does not move when a reader arrives at it. It used to be a fixed 2.1rem,
   which was one line of verse: any first line long enough to wrap was cut
   through the middle, and ten of the twenty-one are. */
.preview {
  grid-column: 2 / 3;
  display: grid;
  margin-top: 0.5rem;
}

.preview > * {
  grid-area: 1 / 1;
}

.firstline {
  display: block;
  align-self: center;
  font-family: var(--f-verse);
  font-weight: 300;
  font-size: 0.94rem;
  line-height: 1.6;
  color: var(--a-ink-2);
  opacity: 0;
  transition: opacity 0.24s ease;
}

.row:hover .firstline,
.row:focus-within .firstline,
.row.peek-open .firstline {
  opacity: 1;
}

@media (hover: none) {
  .peek { display: inline-block; }

  .index-stage {
    grid-template-columns: 1fr;
  }

  .folio-field {
    display: none;
  }
}

.row:hover .title,
.row:focus-within .title { color: var(--accent); }

.rowlink:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 4px;
}

.sig {
  align-self: center;
  width: 100%;
  height: 26px;
  transition: opacity 0.24s ease;
}

.row:hover .sig,
.row:focus-within .sig,
.row.peek-open .sig {
  opacity: 0;
}

.rest {
  height: clamp(8rem, 30vh, 18rem);
}

@media (max-width: 1080px) {
  .index-stage {
    grid-template-columns: minmax(27rem, 1fr) minmax(22rem, 0.82fr);
    gap: 2rem;
  }

  .row {
    grid-template-columns: 2.6rem minmax(0, 1fr);
  }

  .where {
    grid-column: 2 / 3;
    align-items: flex-start;
    text-align: left;
    flex-direction: row;
    gap: 0.6rem;
    margin-top: 0.45rem;
  }
}

@media (max-width: 860px) {
  .index-stage {
    grid-template-columns: 1fr;
  }

  .folio-field {
    display: none;
  }

  .row {
    grid-template-columns: 2.6rem minmax(0, 1fr);
  }

  .where {
    grid-column: 2 / 3;
    align-items: flex-start;
    text-align: left;
    flex-direction: row;
    gap: 0.6rem;
    margin-top: 0.45rem;
  }
}

/* Paper wants a printed rule; the drawn ones stay on the screen. The marks do
   not print either, so rather than leave the band they occupied empty, the
   poet's own first line takes it — which is the more useful printed index. */
@media print {
  .rows { border-top: 1px solid #d5d0c2; }
  .row { border-bottom: 1px solid #d5d0c2; }
  .firstline { opacity: 1; }
}
</style>
