export type CalloutStyle = { icon: string; title: string; color: string; backgroundOpacity: string };
export type CalloutTemplate = CalloutStyle & { id: string };
export type CalloutLibrary = { hypothesis: CalloutStyle; test: CalloutStyle; custom?: CalloutTemplate[] };
export type CalloutNote = { id: string; templateId: string; text: string; enabled?: boolean; position: 'before' | 'after' };
export const calloutTemplates = (library: CalloutLibrary): CalloutTemplate[] => [{ ...library.hypothesis, id: 'hypothesis' }, { ...library.test, id: 'test' }, ...(library.custom ?? [])];
export function normalizeHex(value: string): string | undefined {
  const hex = value.trim().replace(/^#/, '');
  if (/^[a-f\d]{6}$/i.test(hex)) return `#${hex.toUpperCase()}`;
  if (/^[a-f\d]{3}$/i.test(hex)) return `#${hex.split('').map(letter => letter + letter).join('').toUpperCase()}`;
}
