<template>
  <aside class="studio" :class="{ open }" aria-label="Prototype choices">
    <button
      type="button"
      class="studio-tab"
      :aria-expanded="open"
      aria-controls="prototype-choices"
      @click="open = !open"
    >{{ open ? 'close choices' : 'choices' }}</button>

    <div v-show="open" id="prototype-choices" class="studio-panel">
      <div class="studio-heading">
        <p>prototype choices</p>
        <span>change these while reading</span>
      </div>

      <fieldset>
        <legend>collage</legend>
        <label>
          <input v-model="settings.density" type="radio" value="quiet">
          <span>quiet</span>
        </label>
        <label>
          <input v-model="settings.density" type="radio" value="layered">
          <span>layered</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>type</legend>
        <label>
          <input v-model="settings.type" type="radio" value="current">
          <span>current</span>
        </label>
        <label>
          <input v-model="settings.type" type="radio" value="character">
          <span>character</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>handling</legend>
        <label>
          <input v-model="settings.motion" type="radio" value="still">
          <span>still</span>
        </label>
        <label>
          <input v-model="settings.motion" type="radio" value="responsive">
          <span>responsive</span>
        </label>
      </fieldset>

      <div class="studio-actions">
        <button type="button" @click="copyCombination">{{ copied ? 'link copied' : 'copy combination' }}</button>
        <button type="button" @click="resetPrototypeSettings">reset</button>
      </div>
      <span class="sr-only" role="status" aria-live="polite">{{ copied ? 'Combination link copied' : '' }}</span>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue';
import { prototypeSettings as settings, resetPrototypeSettings } from '../prototype-settings.js';

const open = ref(true);
const copied = ref(false);
let copiedTimer = null;

async function copyCombination() {
  const url = new URL(window.location.href);
  url.searchParams.set('folio_density', settings.density);
  url.searchParams.set('folio_type', settings.type);
  url.searchParams.set('folio_motion', settings.motion);
  try {
    await navigator.clipboard.writeText(url.href);
    copied.value = true;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => { copied.value = false; }, 1800);
  } catch {
    window.prompt('Copy this combination', url.href);
  }
}
</script>

<style scoped>
.studio {
  position: fixed;
  z-index: 80;
  right: clamp(0.8rem, 2vw, 1.5rem);
  bottom: clamp(0.8rem, 2vw, 1.5rem);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.55rem;
  font-family: var(--f-cat);
  color: var(--a-ink);
}

.studio-tab,
.studio-actions button {
  border: 0;
  border-bottom: 1px solid var(--a-hair);
  padding: 0 0 0.12rem;
  background: none;
  color: var(--a-ink-2);
  font: inherit;
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  cursor: pointer;
}

.studio-tab {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--a-hair);
  background: color-mix(in srgb, var(--a-bg) 92%, transparent);
  backdrop-filter: blur(10px);
}

.studio-tab:hover,
.studio-actions button:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.studio-panel {
  width: min(19rem, calc(100vw - 1.6rem));
  padding: 1rem;
  border: 1px solid var(--a-hair);
  background: color-mix(in srgb, var(--a-bg) 96%, transparent);
  box-shadow: 0 0.9rem 2.7rem color-mix(in srgb, var(--a-ink) 11%, transparent);
  backdrop-filter: blur(16px);
}

.studio-heading {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: baseline;
  margin-bottom: 0.9rem;
}

.studio-heading p {
  margin: 0;
  font-size: 0.61rem;
  letter-spacing: 0.17em;
  color: var(--a-ink);
}

.studio-heading span {
  font-size: 0.52rem;
  letter-spacing: 0.06em;
  color: var(--a-faint);
}

fieldset {
  display: grid;
  grid-template-columns: 5.2rem 1fr 1fr;
  gap: 0.45rem;
  align-items: center;
  border: 0;
  border-top: 1px solid var(--a-hair);
  padding: 0.72rem 0 0;
  margin: 0.72rem 0 0;
}

legend {
  float: left;
  width: 5.2rem;
  padding: 0.2rem 0 0;
  font-size: 0.54rem;
  letter-spacing: 0.14em;
  color: var(--a-faint);
}

label {
  position: relative;
  cursor: pointer;
}

label input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

label span {
  display: block;
  padding: 0.38rem 0.42rem;
  border: 1px solid transparent;
  color: var(--a-ink-2);
  font-size: 0.55rem;
  letter-spacing: 0.08em;
  text-align: center;
}

label input:checked + span {
  border-color: var(--accent);
  color: var(--accent);
}

label input:focus-visible + span {
  outline: 1px solid var(--accent);
  outline-offset: 2px;
}

.studio-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
}

@media (max-width: 520px) {
  .studio-heading span { display: none; }
  .studio-panel { padding: 0.85rem; }
}

@media print {
  .studio { display: none; }
}
</style>
