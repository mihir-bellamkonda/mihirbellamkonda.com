const WORD_PATTERN = /[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu;

const stopWords = new Set([
  'about', 'after', 'again', 'against', 'along', 'also', 'always', 'another',
  'because', 'before', 'being', 'between', 'both', 'could', 'does', 'from',
  'have', 'into', 'itself', 'more', 'most', 'never', 'nothing', 'only', 'other',
  'over', 'same', 'should', 'some', 'still', 'than', 'that', 'their', 'them',
  'then', 'there', 'these', 'they', 'thing', 'this', 'those', 'through', 'until',
  'very', 'want', 'what', 'when', 'where', 'which', 'while', 'with', 'would',
  'your'
]);

// Four exact words from each poem: the field word first, then the three
// quieter coordinates. Verification rejects a word if it occurs in the
// title, even when it also occurs in the body.
export const specimenVocabulary = {
  'the-gesture': ['signs', 'meaning', 'emptiness', 'flight'],
  summer: ['coyotes', 'religion', 'rabbit', 'songbirds'],
  'thuragnosia-parable-of-the-man-blind-to-doors': ['diagnosis', 'cobalt', 'arches', 'knocking'],
  'questions-and-answers': ['quartz', 'water', 'sleeping', 'leaves'],
  'the-dinner-party': ['alchemy', 'cicadas', 'whiskey', 'center'],
  'mother-dreams-in-half-light': ['sweetbad', 'starlings', 'hydrants', 'analemma'],
  'in-of': ['innervates', 'fish', 'sweetwater', 'pleasure'],
  mercy: ['kindness', 'bird', 'shovel', 'gravel'],
  'up-above-my-head-i-hear-music-in-the-air': ['extinctions', 'skyscreen', 'fascia', 'seeds'],
  dallas: ['fortune', 'concrete', 'ghost', 'pine'],
  'new-orleans': ['multiplicity', 'river', 'guitar', 'consumption'],
  'circling-figures': ['loop-de-loop', 'signs', 'pigeon', 'beginning'],
  'the-horse': ['domesticity', 'rennet', 'marrow', 'distance'],
  brahmanda: ['egg', 'thyme', 'stars', 'oil'],
  'a-quiet-family': ['taxonomies', 'basalt', 'quartz', 'shale']
};

export function normalizeWords(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .match(WORD_PATTERN) || [];
}

function fallbackWords(poem, unavailable) {
  const seen = new Set(unavailable);
  return normalizeWords(poem.content)
    .filter(word => word.length > 3 && !stopWords.has(word) && !seen.has(word))
    .filter(word => {
      seen.add(word);
      return true;
    })
    .sort((a, b) => b.length - a.length || a.localeCompare(b));
}

export function specimenWordsFor(poem) {
  const body = new Set(normalizeWords(poem.content));
  const title = new Set(normalizeWords(poem.title));
  const curated = specimenVocabulary[poem.path] || [];
  const words = [];

  for (const word of curated) {
    const normalized = normalizeWords(word)[0];
    if (normalized && body.has(normalized) && !title.has(normalized) && !words.includes(normalized)) {
      words.push(normalized);
    }
  }

  for (const word of fallbackWords(poem, new Set([...title, ...words]))) {
    if (words.length === 4) break;
    words.push(word);
  }

  return {
    field: words[0] || '',
    coordinates: words.slice(1, 4)
  };
}
