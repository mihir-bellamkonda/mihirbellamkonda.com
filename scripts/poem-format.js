const escapeHtml = (ch) =>
  ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch;

/**
 * Split one stanza into lines, each a complete fragment of HTML.
 *
 * Emphasis can span source lines, while the page renders every line as its
 * own block. Close and reopen active tags at each line break so every result
 * remains valid HTML without changing the poet's Markdown.
 */
export function stanzaLines(block) {
  let out = '';
  const open = [];

  const closeAll = () => open.map(tag => `</${tag}>`).reverse().join('');
  const reopenAll = () => open.map(tag => `<${tag}>`).join('');

  const toggle = tag => {
    const at = open.lastIndexOf(tag);
    if (at === -1) {
      open.push(tag);
      return `<${tag}>`;
    }

    const inner = open.splice(at);
    const rest = inner.slice(1);
    open.push(...rest);
    return inner.map(item => `</${item}>`).reverse().join('')
      + rest.map(item => `<${item}>`).join('');
  };

  for (let i = 0; i < block.length; i += 1) {
    const ch = block[i];
    if (ch === '*' && block[i + 1] === '*') {
      out += toggle('strong');
      i += 1;
    } else if (ch === '*') {
      out += toggle('em');
    } else if (ch === '\n') {
      out += closeAll() + '\n' + reopenAll();
    } else {
      out += escapeHtml(ch);
    }
  }
  out += closeAll();

  return out
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '' && !/^(?:<em><\/em>|<strong><\/strong>)+$/.test(line));
}
