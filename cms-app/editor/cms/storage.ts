import { strToU8, zipSync } from 'fflate';
import { cases, media, profileContent, solutionCallouts, mockupTemplates, type PortfolioCase, type CaseSection, type Profile } from '../content';
import type { MediaSpec, MockupTemplate } from '../mediaTypes';

export type EditorSection = CaseSection & { key: string };
export type EditorCase = Omit<PortfolioCase, 'sections'> & { coverMedia: MediaSpec; heroMedia: MediaSpec; sections: EditorSection[] };
export type EditorState = { version: 1; cases: EditorCase[]; profile: Profile; callouts: typeof solutionCallouts; templates: MockupTemplate[]; revision?: string };
type StoredFile = { id: string; file: File };
const urls = new Map<string, string>();
const files = new Map<string, File>();
let database: Promise<IDBDatabase> | undefined;
let revision: string | undefined;
let baseline: EditorState | undefined;

export const uid = () => crypto.randomUUID();
const source = (src: string, kind: 'image' | 'video' = 'image') => ({ id: uid(), src, kind });
export function emptyMedia(): MediaSpec {
  return { mode: 'photo', motion: 'static', mockupId: 'iphone', screens: [source('')], background: { mode: 'photo' } };
}
export function defaultMedia(image?: string, phones = false): MediaSpec {
  if (!phones) return { ...emptyMedia(), source: image ? source(image) : undefined };
  return { mode: 'mockup', motion: 'static', mockupId: 'iphone', screens: [source('assets/hub-screen.png'), source('assets/goal-screen.png')], background: { mode: 'video', source: source('assets/gradient.mp4', 'video') } };
}
export function initialState(): EditorState {
  return structuredClone({ version: 1, cases: cases.map(item => ({ ...item, coverMedia: item.coverMedia ?? defaultMedia(item.cover, item.layout === 'savings' && !item.cover), heroMedia: item.heroMedia ?? defaultMedia(item.hero, item.layout === 'savings' && !item.hero), sections: item.sections.map(section => ({ ...section, key: uid() })) })), profile: profileContent, callouts: solutionCallouts, templates: mockupTemplates });
}

function db() {
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('portfolio-editor', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('drafts');
      request.result.createObjectStore('files', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
}
function result<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
}
function committed(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error); });
}
async function request<T>(path: string, body?: unknown): Promise<T> {
 const response = await fetch(path, body === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
 const result = await response.json();
 if (!response.ok) throw new Error(result.message || 'Не удалось выполнить запрос.');
 return result as T;
}
export async function loadState(fresh = false): Promise<EditorState> {
 const remote = await request<{ revision: string; state: EditorState }>('/api/portfolio');
 if (!remote.state?.profile || !remote.state.callouts || !Array.isArray(remote.state.templates) || !Array.isArray(remote.state.cases)) throw new Error('Не удалось загрузить содержимое репозитория.');
 baseline = structuredClone(remote.state);
 const normalized = { ...remote.state, cases: remote.state.cases.map(item => ({ ...item, coverMedia: item.coverMedia ?? defaultMedia(item.cover, item.layout === 'savings' && !item.cover), heroMedia: item.heroMedia ?? defaultMedia(item.hero, item.layout === 'savings' && !item.hero), sections: item.sections.map(section => ({ ...section, key: uid() })) })) };
 const connection = await db(), transaction = connection.transaction(['drafts', 'files'], 'readonly');
 const [saved, savedFiles] = await Promise.all([result<EditorState | undefined>(transaction.objectStore('drafts').get('current')), result<StoredFile[]>(transaction.objectStore('files').getAll())]);
 for (const item of savedFiles) { files.set(item.id, item.file); urls.set(item.id, URL.createObjectURL(item.file)); }
 revision = fresh ? remote.revision : saved?.revision ?? remote.revision;
 return !fresh && saved?.version === 1 && Array.isArray(saved.cases) ? saved : { ...normalized, revision };
}
export async function saveState(state: EditorState) {
  const connection = await db();
  const transaction = connection.transaction('drafts', 'readwrite');
  const done = committed(transaction);
  transaction.objectStore('drafts').put({ ...state, revision }, 'current');
  await done;
}
export async function storeFile(file: File) {
  if (!/^(image|video)\//.test(file.type)) throw new Error('Выбери изображение или видео.');
  const id = uid();
  const connection = await db();
  const transaction = connection.transaction('files', 'readwrite');
  const done = committed(transaction);
  transaction.objectStore('files').put({ id, file });
  await done;
  files.set(id, file);
  urls.set(id, URL.createObjectURL(file));
  return { id, src: `cms-media:${id}`, name: file.name, kind: file.type.startsWith('video/') ? 'video' as const : 'image' as const };
}
export function resolveMedia(src?: string) {
  if (src?.startsWith('cms-media:')) return urls.get(src.slice(10)) ?? '';
  return media(src);
}

function documentsFor(state: EditorState, view: string) {
  const documents: Record<string, unknown> = {};
  const project = state.cases.find(item => item.id === view);
  if (view === 'all') {
    documents['content/profile.json'] = state.profile; documents['content/callouts.json'] = state.callouts; documents['content/mockups.json'] = state.templates;
    for (const { id, ...content } of state.cases) documents[`content/cases/${id}.json`] = content;
  } else if (project) {
    const { id, ...content } = project;
    documents[`content/cases/${id}.json`] = content;
    if (JSON.stringify(state.templates) !== JSON.stringify(baseline?.templates ?? mockupTemplates)) documents['content/mockups.json'] = state.templates;
    if (JSON.stringify(state.callouts) !== JSON.stringify(baseline?.callouts ?? solutionCallouts)) documents['content/callouts.json'] = state.callouts;
  } else if (view === 'profile') documents['content/profile.json'] = state.profile;
  else if (view === 'mockups') documents['content/mockups.json'] = state.templates;
  else if (view === 'callouts') documents['content/callouts.json'] = state.callouts;
  return documents;
}
async function prepareContent(state: EditorState, view: string) {
 const connection = await db();
 const stored = await result<StoredFile[]>(connection.transaction('files', 'readonly').objectStore('files').getAll());
 for (const item of stored) files.set(item.id, item.file);
 const used = new Set<string>();
 const replace = (value: unknown): unknown => {
  if (typeof value === 'string' && value.startsWith('cms-media:')) {
   const id = value.slice(10), file = files.get(id);
   if (!file) throw new Error('Загрузи недоступный файл заново.');
   used.add(id);
   const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || (file.type.startsWith('video/') ? 'mp4' : 'png');
   return `assets/cms-${id}.${extension}`;
  }
  if (Array.isArray(value)) return value.map(replace);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'key').map(([key, item]) => [key, replace(item)]));
  return value;
 };
 const documents = replace(documentsFor(state, view)) as Record<string, unknown>;
 const assets = [...used].map(id => ({ id, file: files.get(id)!, path: `public/${replace(`cms-media:${id}`) as string}` }));
 return { documents, assets };
}
export async function publishContent(state: EditorState, view: string) {
 if (!revision) throw new Error('Сначала загрузи данные из GitHub.');
 const { documents, assets } = await prepareContent(state, view);
 if (assets.some(asset => asset.file.size > 3_500_000)) throw new Error('Максимальный размер файла — 3,5 МБ. Сохрани ZIP для файлов большего размера.');
 const blobs: { path: string; sha: string }[] = [];
 for (const asset of assets) {
  const content = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(new Error('Не удалось прочитать файл.')); reader.readAsDataURL(asset.file); });
  blobs.push(await request<{ path: string; sha: string }>('/api/portfolio/uploads', { path: asset.path, content }));
 }
 const published = await request<{ revision: string; changed: boolean }>('/api/portfolio', { revision, view, documents, assets: blobs });
 revision = published.revision;
 if (baseline) { if (documents['content/callouts.json']) baseline.callouts = structuredClone(state.callouts); if (documents['content/mockups.json']) baseline.templates = structuredClone(state.templates); }
 await saveState(state);
 return published;
}
export async function exportContent(state: EditorState, view: string) {
 const { documents, assets } = await prepareContent(state, view);
 const entries: Record<string, Uint8Array> = {};
 for (const [path, value] of Object.entries(documents)) entries[path] = strToU8(`${JSON.stringify(value, null, 2)}\n`);
 for (const asset of assets) entries[asset.path] = new Uint8Array(await asset.file.arrayBuffer());
 const archive = zipSync(entries, { level: 0 });
 const url = URL.createObjectURL(new Blob([archive.buffer as ArrayBuffer], { type: 'application/zip' }));
 const link = document.createElement('a');
 link.href = url; link.download = `portfolio-${view}.zip`;
 document.body.append(link); link.click(); link.remove();
 return { url, filename: link.download };
}
