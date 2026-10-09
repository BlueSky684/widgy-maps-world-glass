// Add JSON whitespace only. Preserve the original token spelling/order, number
// precision, escapes and every string byte. Never split an embedded script,
// font name, URL or encoded image. RFC 8259 section 2 permits these line feeds.
export function formatJSONLines(value, width = 160) {
  if (typeof value !== 'string') throw new TypeError('Expected JSON text');
  if (!Number.isInteger(width) || width < 1) throw new RangeError('Invalid width');
  const pieces = [];
  let quoted = false, escaped = false, lineLength = 0, start = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    lineLength = char === '\n' || char === '\r' ? 0 : lineLength + 1;
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') { quoted = true; continue; }
    if (lineLength >= width && '{}[],:'.includes(char) && i + 1 < value.length && value[i + 1] !== '\n' && value[i + 1] !== '\r') {
      pieces.push(value.slice(start, i + 1), '\n');
      start = i + 1; lineLength = 0;
    }
  }
  pieces.push(value.slice(start));
  return pieces.join('');
}
