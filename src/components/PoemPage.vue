<template>
  <div class="container" v-if="poem">
    <main class="poem-content-wrapper">
      <div class="poem-container">
        <div class="poem-header">
          <h1 class="section-title">{{ poem.title }}</h1>
        </div>
        <div ref="poemContent" class="poem-content" v-html="poem.html"></div>
        <p v-if="poem.external_url && poem.published_in" class="external-link">
          Also published in <a :href="poem.external_url" target="_blank" rel="noopener">{{ poem.published_in }}</a>
        </p>
      </div>
    </main>
    <div class="poem-number-indicator">
      <span class="poem-number-small">{{ index }}</span>
    </div>
    <footer>
      <nav>
        <a href="#about">About</a>
        <span>•</span>
        <a href="#contents">Contents</a>
      </nav>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  poem: Object,
  index: Number,
  total: Number,
  hasPrev: Boolean,
  hasNext: Boolean,
  onPrev: Function,
  onNext: Function
});

const poemContent = ref(null);

function fitPoemToWidth() {
  if (!poemContent.value) return;

  const container = poemContent.value;
  const maxWidth = container.parentElement.clientWidth - 32; // Account for padding
  let fontSize = 18; // Start at 18px (1.1rem-ish)
  const minFontSize = 10; // Don't go below 10px

  container.style.fontSize = fontSize + 'px';

  // Check if content overflows
  while (container.scrollWidth > maxWidth && fontSize > minFontSize) {
    fontSize -= 0.5;
    container.style.fontSize = fontSize + 'px';
  }
}

onMounted(() => {
  fitPoemToWidth();
  window.addEventListener('resize', fitPoemToWidth);
});

watch(() => props.poem, () => {
  setTimeout(fitPoemToWidth, 10); // Small delay to ensure DOM is updated
});
</script>
