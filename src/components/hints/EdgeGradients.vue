<template>
  <div class="edge-gradients">
    <div class="gradient-left"></div>
    <div class="gradient-right"></div>
  </div>
</template>

<style scoped>
.edge-gradients {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.gradient-left,
.gradient-right {
  position: absolute;
  top: 0;
  width: 80px;
  height: 100%;
  opacity: 0.15;
}

.gradient-left {
  left: 0;
  background: linear-gradient(
    to right,
    var(--color-accent),
    transparent
  );
}

.gradient-right {
  right: 0;
  background: linear-gradient(
    to left,
    var(--color-accent),
    transparent
  );
}

/* Subtle pulse animation */
@keyframes edgePulse {
  0%, 100% { opacity: 0.1; }
  50% { opacity: 0.2; }
}

.gradient-left,
.gradient-right {
  animation: edgePulse 4s ease-in-out infinite;
}

/* Hide on very small screens */
@media (max-width: 480px) {
  .edge-gradients {
    display: none;
  }
}
</style>
