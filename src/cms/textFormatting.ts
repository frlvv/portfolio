export function toggleBulletList(text: string, start: number, end: number) {
  const first = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
  const lastSelected = end > start && text[end - 1] === '\n' ? end - 1 : end;
  const nextBreak = text.indexOf('\n', lastSelected);
  const last = nextBreak === -1 ? text.length : nextBreak;
  const original = text.slice(first, last);
  const lines = original.split('\n').filter(line => line.trim());
  const marker = /^([ \t]*)[-+*][ \t]+/;
  const remove = lines.length > 0 && lines.every(line => marker.test(line));
  const formatted = (lines.length ? lines : ['']).map(line => remove ? line.replace(marker, '$1') : marker.test(line) ? line : line.replace(/^([ \t]*)/, '$1- ')).join('\n');
  const caret = Math.min(first + formatted.length, Math.max(first, start + formatted.length - original.length));
  return {
    text: text.slice(0, first) + formatted + text.slice(last),
    start: start === end ? caret : first,
    end: start === end ? caret : first + formatted.length,
  };
}
