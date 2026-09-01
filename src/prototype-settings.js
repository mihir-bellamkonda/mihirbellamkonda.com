import { reactive, watch } from 'vue';

const defaults = {
  composition: 'cutup'
};

const allowed = {
  composition: new Set(['folio', 'cutup'])
};

const canUseBrowser = typeof window !== 'undefined';

function storedSettings() {
  if (!canUseBrowser) return {};
  try {
    return JSON.parse(window.localStorage.getItem('mihir-folio-prototype') || '{}');
  } catch {
    return {};
  }
}

function initialChoice(name) {
  if (!canUseBrowser) return defaults[name];
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get(`folio_${name}`);
  const fromStorage = storedSettings()[name];
  if (allowed[name].has(fromUrl)) return fromUrl;
  if (allowed[name].has(fromStorage)) return fromStorage;

  // Links from the first prototype continue to open to their nearest
  // equivalent. Old stored defaults do not override the new cut-up default;
  // type and handling are intentionally no longer choices.
  if (name === 'composition') {
    const legacy = params.get('folio_density');
    if (legacy === 'quiet') return 'folio';
    if (legacy === 'layered') return 'cutup';
  }
  return defaults[name];
}

export const prototypeSettings = reactive({
  composition: initialChoice('composition')
});

export function resetPrototypeSettings() {
  Object.assign(prototypeSettings, defaults);
}

function applySettings() {
  if (!canUseBrowser) return;

  const root = document.documentElement;
  root.dataset.prototypeComposition = prototypeSettings.composition;
  root.dataset.prototypeType = 'current';
  root.dataset.prototypeMotion = 'responsive';
  delete root.dataset.prototypeDensity;

  try {
    window.localStorage.setItem('mihir-folio-prototype', JSON.stringify(prototypeSettings));
  } catch {
    // A private browsing context may decline storage. The controls still work.
  }

  const url = new URL(window.location.href);
  url.searchParams.set('folio_composition', prototypeSettings.composition);
  url.searchParams.delete('folio_density');
  url.searchParams.delete('folio_type');
  url.searchParams.delete('folio_motion');
  window.history.replaceState(window.history.state, '', url);
}

watch(
  () => prototypeSettings.composition,
  applySettings,
  { immediate: true }
);
