<template>
  <div class="container book-cover">
    <main class="about-content">
      <div class="profile-image-container">
        <img src="/images/mihir.jpg" alt="Mihir Bellamkonda" class="profile-image">
      </div>
      <h1>Mihir Bellamkonda</h1>
      <p class="bio">
        Mihir Bellamkonda is a DC-based poet. They were a finalist for Black Lawrence Press's St. Lawrence Book Award and have work published or forthcoming in Variant Lit, The Offing, and the Nashville Review, among other journals. They can be found on socials @MihirWords. They are honored to be read.
      </p>
      <p><a href="#contents">View Poems →</a></p>
    </main>
    <FooterNav />
  </div>
</template>

<script setup>
import FooterNav from './FooterNav.vue';
</script>

<style scoped>
/* About Page Specific Styles */
.container {
  background: var(--color-accent);
  color: var(--color-background);
}

.about-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 1;
  padding: 0 3rem;
}

.about-content h1 {
  color: var(--color-background);
}

.about-content a {
  color: var(--color-background);
  text-decoration: underline;
}

.about-content a:hover {
  opacity: 0.8;
}

.profile-image-container {
  margin-bottom: var(--spacing-md);
}

.profile-image {
  width: 200px;
  height: 220px;
  border-radius: 0;
  object-fit: cover;
  /* border: 3px solid var(--color-background); */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.book-cover {
  /* border: 8px solid var(--color-background); */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.bio {
  font-size: 1rem;
  color: var(--color-background);
  font-style: normal;
  margin-bottom: var(--spacing-md);
  line-height: 1.7;
  text-align: center;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* Footer styling for about page */
:deep(footer) {
  border-top: 1px solid rgba(249, 247, 244, 0.3);
}

:deep(footer a) {
  color: var(--color-background);
}

:deep(footer a:hover) {
  color: var(--color-background);
  opacity: 0.7;
}

:deep(footer nav span) {
  color: var(--color-background);
}
</style>
