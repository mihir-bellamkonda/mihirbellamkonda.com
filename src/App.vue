<template>
  <component :is="current.view" v-bind="current.props" :key="currentKey" />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import poemsData from './poems.json';
import AboutPage from './components/AboutPage.vue';
import PoemsListPage from './components/PoemsListPage.vue';
import PoemPage from './components/PoemPage.vue';

/**
 * Hash routing.
 *
 *   #            → about
 *   #index       → the index   (#contents and #poems still work; they were
 *                               the old names and may exist in shared links)
 *   #poem/<slug> → one poem
 *
 * The card-stack swipe that used to live here is gone. It hid the index
 * behind a gesture, behaved differently on desktop and phone, and had no
 * keyboard-free way back. Navigation is now ordinary links with real URLs.
 */

const route = ref(parseRoute());

function parseRoute() {
  const hash = decodeURIComponent(window.location.hash.slice(1) || '');
  if (hash === '' || hash === 'about') return { page: 'about' };
  if (hash === 'index' || hash === 'contents' || hash === 'poems') return { page: 'index' };
  if (hash.startsWith('poem/')) return { page: 'poem', slug: hash.slice(5) };
  return { page: 'about' };
}

function hashFor(r) {
  if (r.page === 'about') return '';
  if (r.page === 'index') return 'index';
  return 'poem/' + encodeURIComponent(r.slug);
}

function navigate(r) {
  const next = hashFor(r);
  if (window.location.hash.slice(1) === next) return;
  window.location.hash = next;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

const poemIndex = computed(() =>
  route.value.page === 'poem'
    ? poemsData.findIndex(p => p.slug === route.value.slug)
    : -1
);

const current = computed(() => {
  const r = route.value;

  if (r.page === 'index') {
    return {
      view: PoemsListPage,
      props: { poems: poemsData, onSelect: slug => navigate({ page: 'poem', slug }) }
    };
  }

  if (r.page === 'poem') {
    const i = poemIndex.value;
    // Unknown slug falls back to the index rather than a blank page
    if (i === -1) {
      return {
        view: PoemsListPage,
        props: { poems: poemsData, onSelect: slug => navigate({ page: 'poem', slug }) }
      };
    }
    return {
      view: PoemPage,
      props: {
        poem: poemsData[i],
        index: i + 1,
        total: poemsData.length,
        prev: i > 0 ? poemsData[i - 1] : null,
        next: i < poemsData.length - 1 ? poemsData[i + 1] : null,
        onGo: slug => navigate({ page: 'poem', slug })
      }
    };
  }

  return { view: AboutPage, props: {} };
});

const currentKey = computed(() =>
  route.value.page === 'poem' ? 'poem-' + route.value.slug : route.value.page
);

// Arrow keys still move between poems — a convenience, never the only way.
function handleKeydown(e) {
  if (route.value.page !== 'poem') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const i = poemIndex.value;
  if (i === -1) return;
  if (e.key === 'ArrowLeft' && i > 0) navigate({ page: 'poem', slug: poemsData[i - 1].slug });
  if (e.key === 'ArrowRight' && i < poemsData.length - 1) navigate({ page: 'poem', slug: poemsData[i + 1].slug });
}

function onHashChange() {
  route.value = parseRoute();
}

onMounted(() => {
  window.addEventListener('hashchange', onHashChange);
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('hashchange', onHashChange);
  document.removeEventListener('keydown', handleKeydown);
});
</script>
