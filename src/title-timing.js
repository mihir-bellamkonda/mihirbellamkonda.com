// One clock for the whole heading. The stroke plan already orders the words
// within a row; each later row stays blank until the preceding row is complete.
export const TITLE_WRITE = 1100;
export const TITLE_DWELL = 650;

export function titleRowProgress(lines, progress) {
  const weights = lines.map(line => Math.max(1, line.replace(/\s/g, '').length));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const travelled = Math.max(0, Math.min(1, progress)) * total;
  let start = 0;
  return weights.map(weight => {
    const value = Math.max(0, Math.min(1, (travelled - start) / weight));
    start += weight;
    return value;
  });
}
