// A tab's reading session survives reloads, but does not become a permanent
// preference. If storage is unavailable, navigation still remembers in memory.
const PREFIX = 'mb-title-seen:';

export function createTitleVisits(getStorage = () => window.sessionStorage) {
  const seen = new Set();
  return {
    has(seed) {
      if (seen.has(seed)) return true;
      try {
        return getStorage().getItem(PREFIX + seed) === '1';
      } catch {
        return false;
      }
    },
    mark(seed) {
      seen.add(seed);
      try {
        getStorage().setItem(PREFIX + seed, '1');
      } catch {
        // Remember for this document when the browser refuses storage.
      }
    }
  };
}

export const titleVisits = createTitleVisits();
