import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toggleBulletList } from '../editor/cms/textFormatting';

test('list formats every selected paragraph without adding blank lines', () => {
  const text = 'Первый абзац\n\nВторой абзац\n\nТретий абзац';
  const next = toggleBulletList(text, 0, text.length);
  assert.equal(next.text, '- Первый абзац\n- Второй абзац\n- Третий абзац');
  assert.equal(next.start, 0);
  assert.equal(next.end, next.text.length);
});

test('list covers complete touched lines and preserves surrounding text', () => {
  const text = 'До\nПервый\nВторой\nПосле';
  assert.equal(toggleBulletList(text, 5, 13).text, 'До\n- Первый\n- Второй\nПосле');
  assert.equal(toggleBulletList(text, 3, 10).text, 'До\n- Первый\nВторой\nПосле');
});

test('list inserts at the caret without a leading newline and toggles existing bullets', () => {
  assert.deepEqual(toggleBulletList('', 0, 0), { text: '- ', start: 2, end: 2 });
  assert.deepEqual(toggleBulletList('Текст', 2, 2), { text: '- Текст', start: 4, end: 4 });
  const next = toggleBulletList('- Один\n- Два', 0, 12);
  assert.equal(next.text, 'Один\nДва');
  assert.equal(toggleBulletList('- Один\nДва', 0, 10).text, '- Один\n- Два');
});
