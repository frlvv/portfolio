import type { MediaSpec } from './mediaTypes';
export function resizeScreens(value: MediaSpec, count: number, id: () => string): MediaSpec {
 const target = Math.max(1, Math.min(6, count));
 const all = [...value.screens, ...(value.hiddenScreens ?? [])];
 while (all.length < target) all.push({ id: id(), src: '' });
 return { ...value, screens: all.slice(0, target), hiddenScreens: all.slice(target) };
}
