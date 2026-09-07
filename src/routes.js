/** Parse reader-supplied addresses without letting damaged escapes crash the app. */
export function parseRoute({ pathname = '/', hash = '', notHere = false } = {}) {
  if (notHere) return { page: 'nothere' };

  let fragment, path;
  try {
    fragment = decodeURIComponent(hash.replace(/^#/, ''));
    path = decodeURIComponent(pathname);
  } catch {
    return { page: 'nothere' };
  }

  if (fragment === 'about') return { page: 'about' };
  if (['index', 'contents', 'poems'].includes(fragment)) return { page: 'index' };
  if (fragment === 'hand') return { page: 'hand' };
  if (fragment.startsWith('poem/')) return { page: 'poem', slug: fragment.slice(5) };

  const match = path.match(/^\/poem\/([^/]+)\/?$/);
  return match ? { page: 'poem', path: match[1] } : { page: 'about' };
}
