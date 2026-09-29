import { useLayoutEffect, useRef, type ChangeEvent, type ReactNode } from 'react';

export function CmsIcon({ name }: { name: 'edit' | 'upload' | 'divider' }) {
  return <img className={`cms-icon cms-icon-${name}`} src={`${import.meta.env.BASE_URL}assets/cms/${name}.svg`} alt="" draggable="false" />;
}
export function InlineText({ value, onChange, label, heading = false, placeholder }: { value?: string; onChange: (value: string) => void; label: string; heading?: boolean; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const field = ref.current;
    if (!field) return;
    let active = true, width = 0;
    const resize = () => { if (!active) return; field.style.height = '0px'; field.style.height = `${field.scrollHeight}px`; };
    resize();
    void document.fonts.ready.then(resize);
    const observer = new ResizeObserver(entries => { const next = entries[0].contentRect.width; if (next !== width) { width = next; resize(); } });
    observer.observe(field);
    return () => { active = false; observer.disconnect(); };
  }, [value]);
  return <textarea ref={ref} className={`inline-text${heading ? ' inline-heading' : ''}`} aria-label={label} value={value ?? ''} rows={1} placeholder={placeholder || label} onChange={event => onChange(event.target.value)} spellCheck={false} />;
}
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="cms-toggle"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} aria-label={label} /><span className="toggle-track"><span /></span></label>;
}
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (value: T) => void; options: { value: T; label: string }[]; label: string }) {
  return <div className="cms-segmented" role="group" aria-label={label}>{options.map((option, index) => <button type="button" key={option.value} className={option.value === value ? 'is-selected' : ''} aria-pressed={option.value === value} onClick={() => onChange(option.value)} onKeyDown={event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    (event.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();
  }}>{option.label}</button>)}</div>;
}
export function TextEditor({ value, onChange, label }: { value?: string; onChange: (value: string) => void; label: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const format = (before: string, after = '') => {
    const input = ref.current;
    if (!input) return;
    const start = input.selectionStart, end = input.selectionEnd, text = value ?? '';
    onChange(text.slice(0, start) + before + text.slice(start, end) + after + text.slice(end));
    requestAnimationFrame(() => { input.focus(); input.setSelectionRange(start + before.length, end + before.length); });
  };
  return <div className="cms-text-editor"><div className="text-tools"><button type="button" onMouseDown={event => event.preventDefault()} onClick={() => format('**', '**')} aria-label="Жирный текст"><b>B</b></button><button type="button" onMouseDown={event => event.preventDefault()} onClick={() => format('*', '*')} aria-label="Курсив"><i>I</i></button><button type="button" onMouseDown={event => event.preventDefault()} onClick={() => format('\n- ')} aria-label="Список">☷</button></div><textarea ref={ref} aria-label={label} placeholder="Начни писать…" value={value ?? ''} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)} /></div>;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="cms-field"><span className="field-label">{label}</span>{children}</div>;
}
