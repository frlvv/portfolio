import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDocuments } from '../lib/validation';

const profile = { name: 'Влад', role: 'Дизайнер', sections: [{ label: 'Опыт', text: 'Текст' }], builtTitle: 'Built', projectsTitle: 'Projects', showBuilds: true, portrait: 'assets/portrait.png', builds: [{ id: 'langg', name: 'Langg', description: 'macOS', url: 'https://github.com/frlvv/Langg', icon: 'assets/langg-icon.png', enabled: false }] };

test('saving the home page retains builds, image paths, visibility and section labels', () => {
  const saved = validateDocuments('profile', { 'content/profile.json': profile });
  assert.deepEqual(saved['content/profile.json'], profile);
  assert.throws(() => validateDocuments('profile', { 'content/profile.json': profile, 'content/cases/other.json': {} }));
});

test('home page accepts existing profiles and rejects executable links or duplicate builds', () => {
  assert.doesNotThrow(() => validateDocuments('profile', { 'content/profile.json': { name: 'Влад', role: 'Дизайнер', sections: [] } }));
  assert.throws(() => validateDocuments('profile', { 'content/profile.json': { ...profile, builds: [{ ...profile.builds[0], url: 'javascript:alert(1)' }] } }));
  assert.throws(() => validateDocuments('profile', { 'content/profile.json': { ...profile, builds: [profile.builds[0], profile.builds[0]] } }));
});
