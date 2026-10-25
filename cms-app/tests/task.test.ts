import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caseSchema } from '../lib/validation';

const section = { type: 'task', heading: 'Задача', callout: 'Сделать накопления ближе к жизни', body: 'Описание', showCallout: false, calloutStyle: { icon: '☝️', color: '#F9C02F', backgroundOpacity: '16%' } };
const project = { title: 'Копилка', status: 'published', order: 1, layout: 'savings', sections: [section] };

test('task publication preserves its text, appearance and visibility', () => {
  assert.deepEqual(caseSchema.parse(project).sections[0], section);
  assert.throws(() => caseSchema.parse({ ...project, sections: [{ ...section, calloutStyle: { ...section.calloutStyle, color: 'red;display:none' } }] }));
  assert.throws(() => caseSchema.parse({ ...project, sections: [{ ...section, calloutStyle: { ...section.calloutStyle, backgroundOpacity: '101%' } }] }));
});
