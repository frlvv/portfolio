import { useRef, useState, type CSSProperties } from 'react';
import type { MockupTemplate } from '../mediaTypes';
import { resolveMedia, storeFile, uid, type EditorState } from './storage';
import { Field, InlineText, Segmented } from './ui';

const deviceOptions = [{ value: 'phone', label: 'Телефон' }, { value: 'laptop', label: 'Ноутбук' }, { value: 'tablet', label: 'Планшет' }, { value: 'other', label: 'Другое' }] as const;
type Device = typeof deviceOptions[number]['value'];
const presets: Record<Device, Pick<MockupTemplate, 'screenWidth' | 'screenHeight' | 'insetX' | 'insetY' | 'insetWidth' | 'insetHeight' | 'radius'>> = {
  phone: { screenWidth: 1206, screenHeight: 2622, insetX: 5, insetY: 2.5, insetWidth: 90, insetHeight: 95, radius: 14 },
  laptop: { screenWidth: 3024, screenHeight: 1964, insetX: 10, insetY: 5, insetWidth: 80, insetHeight: 80, radius: 2 },
  tablet: { screenWidth: 2064, screenHeight: 2752, insetX: 5, insetY: 4, insetWidth: 90, insetHeight: 92, radius: 5 },
  other: { screenWidth: 1000, screenHeight: 1000, insetX: 0, insetY: 0, insetWidth: 100, insetHeight: 100, radius: 0 },
};
export function MockupPreview({ template }: { template: MockupTemplate }) {
  const style = { aspectRatio: `${template.width}/${template.height}`, '--device-ratio': template.width / template.height, '--slot-x': `${template.insetX}%`, '--slot-y': `${template.insetY}%`, '--slot-w': `${template.insetWidth}%`, '--slot-h': `${template.insetHeight}%`, '--slot-radius': `${template.radius}% / ${template.radius * template.screenWidth / template.screenHeight}%` } as CSSProperties;
  return <div className="mockup-template-preview"><div className="mockup-template-device" style={style}><div className="mockup-template-slot"><span>{template.frame ? 'Твой скрин' : '+'}</span></div>{template.frame && <img src={resolveMedia(template.frame)} alt="" draggable="false" />}</div></div>;
}
function dimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => { const image = new Image(), url = URL.createObjectURL(file); image.onload = () => { URL.revokeObjectURL(url); resolve({ width: image.naturalWidth, height: image.naturalHeight }); }; image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Не удалось прочитать изображение.')); }; image.src = url; });
}
function TemplateEditor({ template, used, onChange, onDelete }: { template: MockupTemplate; used: boolean; onChange: (patch: Partial<MockupTemplate>) => void; onDelete: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(!template.frame), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError('');
    try {
      if (!['image/png', 'image/webp'].includes(file.type)) throw new Error('Выбери PNG или WebP с прозрачным экраном.');
      const size = await dimensions(file), item = await storeFile(file);
      onChange({ frame: item.src, ...size }); setExpanded(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось загрузить рамку.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  const device = template.device ?? (template.width > template.height ? 'laptop' : 'phone');
  return <section className="mockup-library-item"><div className="settings-row"><InlineText heading label="Название мокапа" value={template.name} onChange={name => onChange({ name })} /><button type="button" className="quiet-button" disabled={used} title={used ? 'Мокап используется в кейсе' : undefined} onClick={onDelete}>Удалить</button></div><div className="mockup-library-grid"><div className="mockup-library-visual"><button type="button" className="mockup-frame-upload" disabled={busy} aria-label={`Рамка: ${template.name}`} onClick={() => input.current?.click()}><MockupPreview template={template} /><span className="mockup-upload-action">{busy ? 'Загружаю…' : template.frame ? 'Заменить рамку' : 'Загрузить рамку'}</span></button><input ref={input} className="visually-hidden" type="file" accept="image/png,image/webp" onChange={event => void upload(event.target.files?.[0])} />{error && <p className="field-error" role="alert">{error}</p>}</div><div className="mockup-library-controls"><Field label="Устройство"><Segmented label="Тип устройства" value={device} options={[...deviceOptions]} onChange={value => onChange({ device: value, ...presets[value] })} /></Field><p className="mockup-library-hint">Рамка PNG / WebP с прозрачным экраном. Скрины добавляются отдельно в кейсе.</p><span className="mockup-template-size">{template.frame ? `${template.width} × ${template.height} px` : 'Рамка ещё не загружена'}</span><button className="quiet-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Скрыть настройку экрана' : 'Настроить область экрана'}</button>{expanded && <div className="template-dimensions">{(['screenWidth', 'screenHeight', 'insetX', 'insetY', 'insetWidth', 'insetHeight', 'radius'] as const).map((key, index) => <Field key={key} label={['Скрин: ширина, px', 'Скрин: высота, px', 'Слева, %', 'Сверху, %', 'Ширина, %', 'Высота, %', 'Скругление, %'][index]}><input type="number" min={index < 2 ? 1 : 0} max={index < 2 ? undefined : 100} step={index < 2 ? 1 : 0.1} aria-label={`${template.name}: ${key}`} value={template[key]} onChange={event => { const number = Number(event.target.value); if (event.target.value && Number.isFinite(number)) onChange({ [key]: Math.max(index < 2 ? 1 : 0, Math.min(index < 2 ? Infinity : 100, number)) }); }} /></Field>)}</div>}</div></div></section>;
}
export default function Mockups({ state, onChange }: { state: EditorState; onChange: (state: EditorState) => void }) {
  return <section className="cms-settings"><div className="settings-row"><h1>Мокапы</h1><button type="button" className="add-block-button" onClick={() => onChange({ ...state, templates: [...state.templates, { id: uid(), name: 'Новый мокап', device: 'phone', frame: '', width: 450, height: 920, ...presets.phone }] })}>+ Новый шаблон</button></div><div className="mockup-library">{state.templates.filter(template => template.id !== 'none').map(template => { const used = state.cases.some(project => [project.coverMedia, project.heroMedia, ...project.sections.map(section => section.media)].some(visual => visual?.mode === 'mockup' && visual.mockupId === template.id)); return <TemplateEditor key={template.id} template={template} used={used} onChange={patch => onChange({ ...state, templates: state.templates.map(item => item.id === template.id ? { ...item, ...patch } : item) })} onDelete={() => onChange({ ...state, templates: state.templates.filter(item => item.id !== template.id) })} />; })}</div></section>;
}
