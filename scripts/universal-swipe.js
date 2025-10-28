// Universal swipe navigation with card-stack effect
(function() {
  const body = document.body;
  const pageContainer = document.querySelector('.container');

  if (!pageContainer) return;

  // Get navigation data from body data attributes
  const prevUrl = body.dataset.prevPage;
  const nextUrl = body.dataset.nextPage;

  if (!prevUrl && !nextUrl) return; // No navigation available

  let touchStartX = 0;
  let touchStartY = 0;
  let touchCurrentX = 0;
  let isDragging = false;
  let swipeDirection = null;

  const MIN_SWIPE_DISTANCE = 80;
  const SWIPE_THRESHOLD = 0.35; // 35% of screen width triggers navigation

  // Create overlay for next page preview
  const nextPageOverlay = document.createElement('div');
  nextPageOverlay.className = 'swipe-next-page-preview';
  body.appendChild(nextPageOverlay);

  // Touch start handler
  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchCurrentX = touchStartX;
    isDragging = false;
    swipeDirection = null;

    pageContainer.style.transition = 'none';
  }

  // Touch move handler - follow the finger
  function handleTouchMove(e) {
    if (!touchStartX) return;

    touchCurrentX = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;

    const diffX = touchCurrentX - touchStartX;
    const diffY = touchCurrentY - touchStartY;

    // Only handle horizontal swipes
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      isDragging = true;
      e.preventDefault(); // Prevent scrolling while swiping

      // Determine direction and check if navigation exists
      if (diffX > 0 && prevUrl) {
        swipeDirection = 'right';
      } else if (diffX < 0 && nextUrl) {
        swipeDirection = 'left';
      } else {
        swipeDirection = null;
      }

      // Apply transform to follow finger (with resistance)
      if (swipeDirection) {
        const translateX = diffX * 0.8; // Add some resistance
        pageContainer.style.transform = `translateX(${translateX}px)`;

        // Calculate progress based on swipe distance
        const progress = Math.min(Math.abs(diffX) / (window.innerWidth * SWIPE_THRESHOLD), 1);

        // Fade out current page slightly
        pageContainer.style.opacity = 1 - (progress * 0.2);

        // Show next page preview with stronger reveal effect
        nextPageOverlay.style.opacity = progress * 0.5;
        nextPageOverlay.classList.add('visible');
      }
    }
  }

  // Touch end handler - complete or cancel navigation
  function handleTouchEnd(e) {
    if (!isDragging || !swipeDirection) {
      // Reset
      pageContainer.style.transition = '';
      pageContainer.style.transform = '';
      pageContainer.style.opacity = '';
      nextPageOverlay.classList.remove('visible');
      touchStartX = 0;
      return;
    }

    const swipeDistance = touchCurrentX - touchStartX;
    const swipePercent = Math.abs(swipeDistance) / window.innerWidth;

    pageContainer.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';

    // Check if swipe was significant enough
    if (swipePercent >= SWIPE_THRESHOLD && Math.abs(swipeDistance) >= MIN_SWIPE_DISTANCE) {
      // Complete the swipe - slide page off screen
      const slideDistance = window.innerWidth * (swipeDirection === 'right' ? 1.2 : -1.2);
      pageContainer.style.transform = `translateX(${slideDistance}px)`;
      pageContainer.style.opacity = '0';
      nextPageOverlay.style.opacity = '1';

      // Navigate after animation
      setTimeout(() => {
        const targetUrl = swipeDirection === 'right' ? prevUrl : nextUrl;
        window.location.href = targetUrl;
      }, 300);
    } else {
      // Cancel - bounce back
      pageContainer.style.transform = '';
      pageContainer.style.opacity = '';
      nextPageOverlay.classList.remove('visible');
    }

    touchStartX = 0;
    isDragging = false;
  }

  // Keyboard navigation
  function handleKeydown(e) {
    if (e.key === 'ArrowLeft' && prevUrl) {
      pageContainer.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
      pageContainer.style.transform = 'translateX(120vw)';
      pageContainer.style.opacity = '0';
      setTimeout(() => {
        window.location.href = prevUrl;
      }, 300);
    } else if (e.key === 'ArrowRight' && nextUrl) {
      pageContainer.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
      pageContainer.style.transform = 'translateX(-120vw)';
      pageContainer.style.opacity = '0';
      setTimeout(() => {
        window.location.href = nextUrl;
      }, 300);
    }
  }

  // Attach event listeners
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
  document.addEventListener('keydown', handleKeydown);
})();
