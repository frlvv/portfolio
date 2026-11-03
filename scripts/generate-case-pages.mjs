import { copyFile, mkdir, readdir, readFile } from 'node:fs/promises';

const content = new URL('../content/', import.meta.url);
const cases = new URL('cases/', content);
const dist = new URL('../dist/', import.meta.url);
const slugs = JSON.parse(await readFile(new URL('case-slugs.json', content), 'utf8'));

for (const file of await readdir(cases)) {
  if (!file.endsWith('.json')) continue;
  const project = JSON.parse(await readFile(new URL(file, cases), 'utf8'));
  if (project.status !== 'published') continue;

  const id = file.slice(0, -5);
  const slug = slugs[id] ?? id;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new Error(`Invalid case slug: ${slug}`);
  const directory = new URL(`${slug}/`, dist);
  await mkdir(directory, { recursive: true });
  await copyFile(new URL('index.html', dist), new URL('index.html', directory));
}
