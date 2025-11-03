<template>
  <div class="page-stack">
    <!-- Preview page (underneath) - shows next when swiping left, prev when swiping right -->
    <div
      v-if="previewPageData"
      class="page page-preview"
      :key="previewPageKey"
      :style="{ transform: `scale(${nextPageScale})`, opacity: nextPageOpacity }"
    >
      <component :is="previewPageData.view" v-bind="previewPageData.props" />
    </div>

    <!-- Current page (on top, swipeable) -->
    <div
      class="page page-current"
      :key="currentPageKey"
      :style="{ transform: `translateX(${swipeOffset}px)`, opacity: swipeOpacity }"
      @click="handlePageClick"
    >
      <component :is="currentPageData.view" v-bind="currentPageData.props" />
    </div>

    <ArrowKeyIcons />
    <EdgeGradients />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import poemsData from './poems.json';
import AboutPage from './components/AboutPage.vue';
import PoemsListPage from './components/PoemsListPage.vue';
import PoemPage from './components/PoemPage.vue';

// Navigation hint components - uncomment the one you want to use
import ArrowKeyIcons from './components/hints/ArrowKeyIcons.vue';
import EdgeGradients from './components/hints/EdgeGradients.vue';

// Swipe navigation constants
const SWIPE_THRESHOLD_PERCENT = 0.25;  // 25% of screen width triggers navigation
const SWIPE_DAMPING_FACTOR = 0.8;      // Reduces swipe speed for smoother feel
const SWIPE_MIN_DISTANCE = 10;         // Minimum pixels to register as swipe
const SWIPE_ANIMATION_DELAY = 200;     // Milliseconds before completing navigation
const SWIPE_OPACITY_FADE = 0.2;        // Maximum opacity reduction during swipe
const PREVIEW_SCALE_MIN = 0.98;        // Minimum scale for preview page
const PREVIEW_SCALE_RANGE = 0.02;      // Scale range (0.98 to 1.0)
const PREVIEW_OPACITY_MIN = 0.3;       // Minimum opacity for preview page
const PREVIEW_OPACITY_RANGE = 0.7;     // Opacity range (0.3 to 1.0)

// State
const route = ref(parseRoute());
const swipeOffset = ref(0);
const swipeStartX = ref(0);
const isDragging = ref(false);

// Parse hash to determine current route
function parseRoute() {
  const hash = window.location.hash.slice(1) || '';
  if (hash === '' || hash === 'about') return { page: 'about' };
  if (hash === 'poems' || hash === 'contents') return { page: 'poems' }; // Support both for backwards compat
  if (hash.startsWith('poem/')) {
    const slug = decodeURIComponent(hash.replace('poem/', ''));
    return { page: 'poem', slug };
  }
  return { page: 'about' };
}

// Navigation functions
function navigate(newRoute) {
  const routeStr = newRoute.page === 'about' ? '' :
    newRoute.page === 'poems' ? 'contents' :
    `poem/${encodeURIComponent(newRoute.slug)}`;
  window.location.hash = routeStr;
}

function goToPrevPage() {
  const r = route.value;
  if (r.page === 'poems') navigate({ page: 'about' });
  else if (r.page === 'poem') {
    // Always go back to contents when swiping back from any poem
    navigate({ page: 'poems' });
  }
}

function goToNextPage() {
  const r = route.value;
  if (r.page === 'about') navigate({ page: 'poems' });
  else if (r.page === 'poems' && poemsData[0]) navigate({ page: 'poem', slug: poemsData[0].slug });
  else if (r.page === 'poem') {
    const idx = poemsData.findIndex(p => p.slug === r.slug);
    if (idx === -1 || idx >= poemsData.length - 1) navigate({ page: 'poems' });
    else if (poemsData[idx + 1]) navigate({ page: 'poem', slug: poemsData[idx + 1].slug });
  }
}

// Get page data for rendering
function getPageData(r) {
  if (r.page === 'about') return { view: AboutPage, props: {} };
  if (r.page === 'poems') return { view: PoemsListPage, props: { poems: poemsData, onSelect: (slug) => navigate({ page: 'poem', slug }) } };
  if (r.page === 'poem') {
    const poem = poemsData.find(p => p.slug === r.slug);
    const idx = poemsData.findIndex(p => p.slug === r.slug);

    // If poem not found, go to poems list
    if (!poem || idx === -1) {
      navigate({ page: 'poems' });
      return { view: PoemsListPage, props: { poems: poemsData, onSelect: (slug) => navigate({ page: 'poem', slug }) } };
    }

    return {
      view: PoemPage,
      props: {
        poem,
        index: idx + 1,
        total: poemsData.length
      }
    };
  }
  // Default to about page
  return { view: AboutPage, props: {} };
}

// Get next page for card stack preview
function getNextRoute() {
  const r = route.value;
  if (r.page === 'about') return { page: 'poems' };
  if (r.page === 'poems' && poemsData[0]) return { page: 'poem', slug: poemsData[0].slug };
  if (r.page === 'poem') {
    const idx = poemsData.findIndex(p => p.slug === r.slug);
    if (idx !== -1 && idx < poemsData.length - 1 && poemsData[idx + 1]) {
      return { page: 'poem', slug: poemsData[idx + 1].slug };
    }
    return { page: 'poems' };
  }
  return null;
}

// Get previous page for card stack preview
function getPrevRoute() {
  const r = route.value;
  if (r.page === 'poems') return { page: 'about' };
  if (r.page === 'poem') return { page: 'poems' };
  return null;
}

const currentPageData = computed(() => getPageData(route.value));
const nextPageData = computed(() => {
  const next = getNextRoute();
  return next ? getPageData(next) : null;
});
const prevPageData = computed(() => {
  const prev = getPrevRoute();
  return prev ? getPageData(prev) : null;
});

const currentPageKey = computed(() => route.value.page === 'poem' ? `poem-${route.value.slug}` : route.value.page);
const nextPageKey = computed(() => {
  const next = getNextRoute();
  return next ? (next.page === 'poem' ? `poem-${next.slug}` : next.page) : '';
});
const prevPageKey = computed(() => {
  const prev = getPrevRoute();
  return prev ? (prev.page === 'poem' ? `poem-${prev.slug}` : prev.page) : '';
});

// Show appropriate preview page based on swipe direction
const previewPageData = computed(() => {
  if (swipeOffset.value < 0) return nextPageData.value; // Swiping left, show next
  if (swipeOffset.value > 0) return prevPageData.value; // Swiping right, show prev
  return nextPageData.value; // Default to next when not swiping
});

const previewPageKey = computed(() => {
  if (swipeOffset.value < 0) return nextPageKey.value;
  if (swipeOffset.value > 0) return prevPageKey.value;
  return nextPageKey.value;
});

const swipeOpacity = computed(() => {
  const progress = Math.abs(swipeOffset.value) / (window.innerWidth * SWIPE_THRESHOLD_PERCENT);
  return 1 - Math.min(progress * SWIPE_OPACITY_FADE, SWIPE_OPACITY_FADE);
});

const nextPageScale = computed(() => {
  const progress = Math.abs(swipeOffset.value) / (window.innerWidth * SWIPE_THRESHOLD_PERCENT);
  return PREVIEW_SCALE_MIN + (Math.min(progress, 1) * PREVIEW_SCALE_RANGE);
});

const nextPageOpacity = computed(() => {
  const progress = Math.abs(swipeOffset.value) / (window.innerWidth * SWIPE_THRESHOLD_PERCENT);
  return PREVIEW_OPACITY_MIN + (Math.min(progress, 1) * PREVIEW_OPACITY_RANGE);
});

// Touch handlers
function handleTouchStart(e) {
  swipeStartX.value = e.touches[0].clientX;
  isDragging.value = false;
}

function handleTouchMove(e) {
  if (!swipeStartX.value) return;
  const diff = e.touches[0].clientX - swipeStartX.value;
  if (Math.abs(diff) > SWIPE_MIN_DISTANCE) {
    // Check if swipe direction is valid
    const swipingRight = diff > 0;
    const swipingLeft = diff < 0;

    if ((swipingRight && !prevPageData.value) || (swipingLeft && !nextPageData.value)) {
      // Can't swipe in this direction - no page exists
      return;
    }

    isDragging.value = true;
    swipeOffset.value = diff * SWIPE_DAMPING_FACTOR;
    e.preventDefault();
  }
}

function handleTouchEnd() {
  if (!isDragging.value) {
    swipeOffset.value = 0;
    return;
  }

  const threshold = window.innerWidth * SWIPE_THRESHOLD_PERCENT;
  if (Math.abs(swipeOffset.value) > threshold) {
    // Complete navigation
    if (swipeOffset.value < 0) {
      // Swiped left - go to next
      swipeOffset.value = -window.innerWidth;
      setTimeout(() => {
        goToNextPage();
        swipeOffset.value = 0;
      }, SWIPE_ANIMATION_DELAY);
    } else {
      // Swiped right - go to previous
      swipeOffset.value = window.innerWidth;
      setTimeout(() => {
        goToPrevPage();
        swipeOffset.value = 0;
      }, SWIPE_ANIMATION_DELAY);
    }
  } else {
    // Snap back
    swipeOffset.value = 0;
  }
  isDragging.value = false;
  swipeStartX.value = 0;
}

// Animate page transition
function animatePageTransition(direction) {
  // Check if navigation is possible in this direction
  if (direction === 'next' && !nextPageData.value) return;
  if (direction === 'prev' && !prevPageData.value) return;

  // direction: 'next' or 'prev'
  if (direction === 'next') {
    swipeOffset.value = -window.innerWidth;
    setTimeout(() => {
      goToNextPage();
      swipeOffset.value = 0;
    }, SWIPE_ANIMATION_DELAY);
  } else {
    swipeOffset.value = window.innerWidth;
    setTimeout(() => {
      goToPrevPage();
      swipeOffset.value = 0;
    }, SWIPE_ANIMATION_DELAY);
  }
}

// Click handler
function handlePageClick(e) {
  // Don't navigate if clicking on links or buttons
  if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button')) {
    return;
  }

  // Check which half of the screen was clicked
  const clickX = e.clientX;
  const screenWidth = window.innerWidth;
  const isLeftHalf = clickX < screenWidth / 2;

  if (isLeftHalf) {
    animatePageTransition('prev');
  } else {
    animatePageTransition('next');
  }
}

// Keyboard handlers
function handleKeydown(e) {
  if (e.key === 'ArrowLeft') animatePageTransition('prev');
  if (e.key === 'ArrowRight') animatePageTransition('next');
}

// Lifecycle
onMounted(() => {
  window.addEventListener('hashchange', () => { route.value = parseRoute(); });
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('touchstart', handleTouchStart);
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', handleTouchEnd);
  document.removeEventListener('keydown', handleKeydown);
});
</script>
