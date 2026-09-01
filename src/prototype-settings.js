import { reactive, watch } from 'vue';

const defaults = {
  density: 'quiet',
  type: 'character',
  motion: 'responsive'
};

const allowed = {
  density: new Set(['quiet', 'layered']),
  type: new Set(['current', 'character']),
  motion: new Set(['still', 'responsive'])
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
  return defaults[name];
}

export const prototypeSettings = reactive({
  density: initialChoice('density'),
  type: initialChoice('type'),
  motion: initialChoice('motion')
});

export function resetPrototypeSettings() {
  Object.assign(prototypeSettings, defaults);
}

function applySettings() {
  if (!canUseBrowser) return;

  const root = document.documentElement;
  root.dataset.prototypeDensity = prototypeSettings.density;
  root.dataset.prototypeType = prototypeSettings.type;
  root.dataset.prototypeMotion = prototypeSettings.motion;

  try {
    window.localStorage.setItem('mihir-folio-prototype', JSON.stringify(prototypeSettings));
  } catch {
    // A private browsing context may decline storage. The controls still work.
  }

  const url = new URL(window.location.href);
  for (const name of Object.keys(defaults)) {
    url.searchParams.set(`folio_${name}`, prototypeSettings[name]);
  }
  window.history.replaceState(window.history.state, '', url);
}

watch(
  () => [prototypeSettings.density, prototypeSettings.type, prototypeSettings.motion],
  applySettings,
  { immediate: true }
);

