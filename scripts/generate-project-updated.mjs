import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve('content/cases');
const output = resolve('src/generated/project-updated.json');
const timestamps = {};

for (const file of readdirSync(directory).filter(name => name.endsWith('.json'))) {
  const id = file.slice(0, -5);
  try {
    timestamps[id] = execFileSync('git', ['log', '-1', '--format=%cI', '--', `content/cases/${file}`], { encoding: 'utf8' }).trim();
  } catch {
    timestamps[id] = '';
  }
}

writeFileSync(output, `${JSON.stringify(timestamps, null, 2)}\n`);
