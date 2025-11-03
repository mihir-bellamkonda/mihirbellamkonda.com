<template>
  <div class="container">
    <main class="poems-list-content">
      <h2 class="section-title">Contents</h2>
      <div class="poems-list">
        <div v-for="poem in poems" :key="poem.slug" class="poem-entry">
          <div class="poem-entry-top">
            <a @click.prevent="onSelect(poem.slug)" href="#" class="poem-title">{{ poem.title }}</a>
          </div>
          <div class="poem-meta">
            <span v-if="poem.date">{{ formatDate(poem.date) }}</span>
            <span v-if="poem.date && poem.published_in"> • </span>
            <span v-if="poem.published_in">
              Also published in
              <a v-if="poem.external_url" :href="poem.external_url" target="_blank" rel="noopener">{{ poem.published_in }}</a>
              <span v-else>{{ poem.published_in }}</span>
            </span>
          </div>
        </div>
      </div>
    </main>
    <FooterNav />
  </div>
</template>

<script setup>
import FooterNav from './FooterNav.vue';

defineProps({
  poems: Array,
  onSelect: Function
});

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
</script>

<style scoped>
/* Poems List Page Specific Styles */
.poems-list-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-top: var(--spacing-md);
}

.poems-list-content h2 {
  text-align: center;
  font-family: var(--font-heading);
  font-weight: 400;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.poems-list {
  max-width: 600px;
  margin: 0 auto;
}

.poem-entry {
  margin-bottom: var(--spacing-md);
}

.poem-entry-top {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.poem-title {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  color: var(--color-text);
  text-decoration: none;
  flex-shrink: 1;
  cursor: pointer;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.poem-title:hover {
  color: var(--color-accent);
  text-decoration: none;
}

.poem-meta {
  font-size: 0.85rem;
  color: var(--color-text-light);
  font-style: italic;
}
</style>
