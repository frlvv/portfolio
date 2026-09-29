import { useId, useRef, useState } from 'react';
import CaseMedia from '../CaseMedia';
import type { MediaItem, MediaSpec, MockupTemplate } from '../mediaTypes';
import { resolveMedia, storeFile, uid } from './storage';
import { CmsIcon, Field, Segmented } from './ui';

const modeOptions = [{ value: 'mockup', label: 'Мокапы' }, { value: 'photo', label: 'Дефолт фото' }, { value: 'video', label: 'Дефолт видео' }] as const;
const motionOptions = [{ value: 'static', label: 'Статика' }, { value: 'animated', label: 'Анимация' }] as const;

function Upload({ label, hint, accept, multiple = false, onFiles, children }: { label: string; hint?: string; accept: string; multiple?: boolean; onFiles: (files: File[]) => Promise<void>; children?: React.ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const upload = async (files: File[]) => {
    if (!files.length) return;
    setError(''); setBusy(true);
    try { await onFiles(files); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось загрузить файл.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  return <div className="cms-upload-wrap"><button className={`cms-upload${dragOver ? ' is-drag-over' : ''}${children ? ' has-preview' : ''}`} type="button" aria-label={label} disabled={busy} onClick={() => input.current?.click()} onDragOver={event => { if (event.dataTransfer.types.includes('Files')) { event.preventDefault(); setDragOver(true); } }} onDragLeave={() => setDragOver(false)} onDrop={event => { if (!event.dataTransfer.files.length) return; event.preventDefault(); setDragOver(false); void upload(Array.from(event.dataTransfer.files)); }}>
    {children}<span className="upload-content"><CmsIcon name="upload" /><span>{busy ? 'Загружаю…' : children ? 'Заменить' : label}</span>{hint && !children && <small>{hint}</small>}</span>
  </button><input ref={input} className="visually-hidden" tabIndex={-1} type="file" accept={accept} multiple={multiple} onChange={event => void upload(Array.from(event.target.files ?? []))} />{error && <p className="field-error" role="alert">{error}</p>}</div>;
}
function Thumb({ item }: { item: MediaItem }) {
  return item.kind === 'video' ? <video src={resolveMedia(item.src)} muted playsInline preload="metadata" /> : <img src={resolveMedia(item.src)} alt="" draggable="false" />;
}
function checkFiles(files: File[], video: boolean) {
  if (files.some(file => video ? !file.type.startsWith('video/') : !file.type.startsWith('image/'))) throw new Error(video ? 'Здесь нужно видео.' : 'Здесь нужно изображение.');
}

export default function MediaEditor({ value, onChange, templates, title, layout = 'hero' }: { value: MediaSpec; onChange: (value: MediaSpec) => void; templates: MockupTemplate[]; title: string; layout?: 'cover' | 'hero' }) {
  const [expanded, setExpanded] = useState(true);
  const group = useId();
  const template = templates.find(item => item.id === value.mockupId) ?? templates[0];
  const resize = (count: number) => onChange({ ...value, screens: Array.from({ length: count }, (_, index) => value.screens[index] ?? { id: uid(), src: '' }) });
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.screens.length || from === to) return;
    const screens = [...value.screens]; const [item] = screens.splice(from, 1); screens.splice(to, 0, item); onChange({ ...value, screens });
  };
  const addScreens = async (files: File[], replaceIndex?: number) => {
    checkFiles(files, value.motion === 'animated');
    if (replaceIndex === undefined && value.screens.filter(item => item.src).length + files.length > 6) throw new Error('В одном визуале можно разместить до 6 мокапов.');
    const uploaded = await Promise.all(files.map(storeFile));
    const screens = [...value.screens];
    if (replaceIndex !== undefined) screens.splice(replaceIndex, 1, uploaded[0]);
    else { for (const item of uploaded) { const empty = screens.findIndex(screen => !screen.src); if (empty >= 0) screens[empty] = item; else screens.push(item); } }
    onChange({ ...value, screens });
  };
  const videoScreens = value.motion === 'animated';
  return <section className="cms-media-section"><div className="media-heading"><h3>{title}</h3><button className="quiet-button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>{expanded ? 'Свернуть' : 'Развернуть'}</button></div>{expanded && <div className="media-editor-grid"><div className="media-controls">
    <Segmented label={`${title}: тип медиа`} value={value.mode} onChange={mode => onChange({ ...value, mode })} options={[...modeOptions]} />
    {value.mode === 'mockup' ? <>
      <div className="mockup-config"><Field label="Кол-во мокапов"><div className="cms-stepper"><button disabled={value.screens.length <= 1} onClick={() => resize(value.screens.length - 1)} aria-label="Убрать мокап">−</button><span>{value.screens.length}</span><button disabled={value.screens.length >= 6} onClick={() => resize(value.screens.length + 1)} aria-label="Добавить мокап">+</button></div></Field><Field label="Мокап"><select aria-label="Модель мокапа" value={value.mockupId} onChange={event => onChange({ ...value, mockupId: event.target.value })}>{templates.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field></div>
      <Field label="Мокапы"><Segmented label="Анимация мокапов" value={value.motion} onChange={motion => onChange({ ...value, motion })} options={[...motionOptions]} /></Field>
      <div className="upload-thumbnails">{value.screens.some(item => item.src) && value.screens.map((item, index) => <div className="upload-thumb" key={item.id} onDragOver={event => { if (event.dataTransfer.types.includes('application/x-portfolio-screen')) event.preventDefault(); }} onDrop={event => { const data = event.dataTransfer.getData('application/x-portfolio-screen'); if (!data) return; event.preventDefault(); const moved = JSON.parse(data) as { group: string; index: number }; if (moved.group === group) move(moved.index, index); }}>
        <Upload label={`Заменить скрин ${index + 1}`} accept={videoScreens ? 'video/mp4,video/webm' : 'image/*'} onFiles={files => addScreens(files, index)}>{item.src && <Thumb item={item} />}</Upload>
        <span className="thumb-number">{index + 1}</span><div className="thumb-actions"><button className="drag-handle" draggable onDragStart={event => { event.dataTransfer.setData('application/x-portfolio-screen', JSON.stringify({ group, index })); event.dataTransfer.effectAllowed = 'move'; }} aria-label={`Перетащить скрин ${index + 1}`}>⠿</button><button onClick={() => move(index, index - 1)} disabled={index === 0} aria-label="Влево">←</button><button onClick={() => move(index, index + 1)} disabled={index === value.screens.length - 1} aria-label="Вправо">→</button><button onClick={() => onChange({ ...value, screens: value.screens.length > 1 ? value.screens.filter((_, current) => current !== index) : [{ id: uid(), src: '' }] })} aria-label="Удалить скрин">×</button></div>
      </div>)}</div>
      <Upload label={value.screens.some(item => item.src) ? 'Добавить скрины' : 'Загрузить скрины'} hint={`${template.screenWidth} × ${template.screenHeight} px · ${videoScreens ? 'MP4, WebM' : 'PNG, JPG, WebP'}`} accept={videoScreens ? 'video/mp4,video/webm' : 'image/*'} multiple onFiles={files => addScreens(files)} />
      <Field label="Фон"><Segmented label="Фон мокапов" value={value.background.mode} onChange={mode => onChange({ ...value, background: { ...value.background, mode } })} options={[{ value: 'photo', label: 'Статика' }, { value: 'video', label: 'Анимация' }]} /></Field>
      <Upload label="Загрузить фон" hint={`${layout === 'cover' ? '1280 × 1280' : '1896 × 1416'} px · ${value.background.mode === 'video' ? 'MP4, WebM' : 'PNG, JPG, WebP'}`} accept={value.background.mode === 'video' ? 'video/mp4,video/webm' : 'image/*'} onFiles={async files => { checkFiles(files, value.background.mode === 'video'); const [item] = await Promise.all(files.slice(0, 1).map(storeFile)); onChange({ ...value, background: { ...value.background, source: item } }); }}>{value.background.source?.src && <Thumb item={value.background.source} />}</Upload>
    </> : <Upload label={value.mode === 'video' ? 'Загрузить видео' : 'Загрузить фото'} hint={`${layout === 'cover' ? '1280 × 1280' : '1896 × 1416'} px · ${value.mode === 'video' ? 'MP4, WebM' : 'PNG, JPG, WebP'}`} accept={value.mode === 'video' ? 'video/mp4,video/webm' : 'image/*'} onFiles={async files => { checkFiles(files, value.mode === 'video'); const item = await storeFile(files[0]); onChange({ ...value, source: item }); }}>{value.source?.src && <Thumb item={value.source} />}</Upload>}
  </div><div className="media-preview"><p>Превью</p><CaseMedia value={value} layout={layout} templates={templates} resolve={resolveMedia} /></div></div>}</section>;
}
