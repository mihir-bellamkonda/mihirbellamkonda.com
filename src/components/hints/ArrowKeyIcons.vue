<template>
  <div class="arrow-key-hints">
    <div class="arrow-hint arrow-left">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 10L15 20L25 30" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="arrow-hint arrow-right">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 10L25 20L15 30" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.arrow-key-hints {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.arrow-hint {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-light);
  opacity: 0.2;
  transition: opacity 0.3s ease;
}

.arrow-hint:hover {
  opacity: 0.5;
}

.arrow-left {
  left: 20px;
}

.arrow-right {
  right: 20px;
}

/* Hide on mobile */
@media (max-width: 768px) {
  .arrow-key-hints {
    display: none;
  }
}

/* Subtle pulse animation */
@keyframes pulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.4; }
}

.arrow-hint {
  animation: pulse 3s ease-in-out infinite;
}
</style>
