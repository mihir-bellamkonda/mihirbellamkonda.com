<template>
  <figure
    ref="frame"
    class="specimen"
    :class="[`context-${context}`, { 'has-study': study }]"
    :data-specimen="study?.kind || 'asemic'"
    aria-hidden="true"
    @pointermove="handlePointer"
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

    <div class="sheet trace-sheet">
      <AsemicMarks
        class="trace"
        :text="markText || poem.content"
        :seed="markSeed || `${poem.slug}::folio`"
        :progress="progress"
      />
    </div>

    <p class="title-fragment">{{ shortTitle }}</p>

    <p class="catalogue">
      <span>{{ study?.code || genericCode }}</span>
      <span>{{ study?.note || 'gesture · interval · trace' }}</span>
    </p>
  </figure>
</template>

<script setup>
import { computed, ref } from 'vue';
import AsemicMarks from './AsemicMarks.vue';

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
    code: 'MB / 17 · LITHIC',
    note: 'basalt · quartz · shale',
    primary: '/collage/crystal-forms.webp',
    secondary: '/collage/geological-chart.webp'
  },
  brahmanda: {
    kind: 'cosmic',
    code: 'MB / 16 · COSMIC',
    note: 'citrus · orbit · egg',
    primary: '/collage/cosmic-egg.webp',
    secondary: '/collage/citrus-aurantium.webp',
    tertiary: '/collage/solar-system.webp'
  }
};

const frame = ref(null);
const study = computed(() => studies[props.poem.path] || null);
const shortTitle = computed(() => String(props.poem.title || '').split(':')[0]);
const genericCode = computed(() => {
  const number = String(props.poem.slug || '').match(/^\d+/)?.[0] || '00';
  return `MB / ${number} · TRACE`;
});

function handlePointer(event) {
  if (document.documentElement.dataset.prototypeMotion !== 'responsive') return;
  const el = frame.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const dx = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
  const dy = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
  el.style.setProperty('--shift-x', `${dx}px`);
  el.style.setProperty('--shift-y', `${dy}px`);
  el.style.setProperty('--shift-x-reverse', `${-dx * 0.72}px`);
  el.style.setProperty('--shift-y-reverse', `${-dy * 0.72}px`);
}

function clearPointer() {
  const el = frame.value;
  if (!el) return;
  el.style.setProperty('--shift-x', '0px');
  el.style.setProperty('--shift-y', '0px');
  el.style.setProperty('--shift-x-reverse', '0px');
  el.style.setProperty('--shift-y-reverse', '0px');
}
</script>

<style scoped>
.specimen {
  --shift-x: 0px;
  --shift-y: 0px;
  --shift-x-reverse: 0px;
  --shift-y-reverse: 0px;
  position: relative;
  isolation: isolate;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--a-hair);
  background: color-mix(in srgb, var(--a-bg) 92%, var(--accent));
  color: var(--a-ink);
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
  transition: transform 520ms cubic-bezier(0.22, 0.72, 0.2, 1), opacity 320ms ease;
}

.sheet-ground {
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
}

.layer-primary {
  z-index: 2;
  left: 12%;
  top: 10%;
  width: 68%;
  height: 57%;
  transform: translate(var(--shift-x), var(--shift-y)) rotate(-1.2deg);
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

.layer-tertiary {
  z-index: 1;
  left: 4%;
  bottom: 2%;
  width: 46%;
  height: 46%;
  opacity: 0;
  transform: translate(var(--shift-x-reverse), var(--shift-y-reverse)) rotate(-3deg);
}

.trace-sheet {
  z-index: 5;
  right: 3%;
  top: 5%;
  width: 52%;
  height: 82%;
  padding: 8% 7%;
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
  z-index: 7;
  left: 7%;
  bottom: 5%;
  margin: 0;
  max-width: 9ch;
  font-family: var(--f-display);
  font-size: clamp(1.7rem, 4.1vw, 3.8rem);
  font-weight: 300;
  line-height: 0.86;
  letter-spacing: -0.035em;
  color: var(--a-ink);
  opacity: 0.82;
  mix-blend-mode: multiply;
}

.catalogue {
  position: absolute;
  z-index: 8;
  top: 4%;
  left: 4%;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  margin: 0;
  font-family: var(--f-cat);
  font-size: 0.53rem;
  line-height: 1.5;
  letter-spacing: 0.14em;
  color: var(--accent);
}

.catalogue span:last-child {
  color: var(--a-faint);
  letter-spacing: 0.08em;
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

.specimen:not(.has-study) .title-fragment {
  left: 9%;
  bottom: 9%;
  max-width: 12ch;
  opacity: 0.28;
}

:global(html[data-prototype-density='layered']) .layer-secondary {
  opacity: 0.58;
}

:global(html[data-prototype-density='layered']) .layer-tertiary {
  opacity: 0.34;
}

:global(html[data-prototype-density='layered']) .trace-sheet {
  background: color-mix(in srgb, var(--a-bg) 49%, transparent);
}

:global(html[data-prototype-density='layered']) .title-fragment {
  opacity: 0.94;
}

:global(html[data-prototype-motion='still']) .sheet {
  transform: none;
  transition: opacity 240ms ease;
}

[data-specimen='lithic'] .layer-primary img {
  object-position: 62% center;
}

[data-specimen='lithic'] .layer-secondary img {
  object-position: center 62%;
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

@media (max-width: 860px) {
  .context-index { min-height: 25rem; }
  .context-poem { height: 18rem; }
  .title-fragment { font-size: clamp(1.6rem, 8vw, 2.7rem); }
  .catalogue { top: 3.5%; }
}

@media print {
  .specimen { display: none; }
}
</style>

