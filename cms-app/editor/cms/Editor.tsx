'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import Markdown from 'react-markdown';
import CaseMedia from '../CaseMedia';
import type { MediaSpec } from '../mediaTypes';
import MediaEditor from './MediaEditor';
import Mockups from './Mockups';
import { CalloutSettings, ExtraNotes, Note, NotesEditor } from './Callouts';
import { defaultMedia, emptyMedia, exportContent, initialState, loadState, resolveMedia, saveState, publishContent, uid, type EditorCase, type EditorSection, type EditorState } from './storage';
import { CmsIcon, Field, InlineText, TextEditor, Toggle } from './ui';

const visualImages = { hub: ['hero-hub.png'], type: ['type-goal-original.png'], plan: ['amount.png', 'plan.png', 'no-plan.png'], goal: ['screen-goal.png'], change: ['plan-overview.png', 'plan-adjust.png'], quick: ['quick-amount.png', 'quick-plan.png', 'quick-hold.png'] };
const blockCount = (count: number) => `${count} ${count % 100 >= 11 && count % 100 <= 14 ? 'блоков' : count % 10 === 1 ? 'блок' : count % 10 >= 2 && count % 10 <= 4 ? 'блока' : 'блоков'}`;
const kindNames = { text: 'Текст', context: 'Контекст', solution: 'Решение', gallery: 'Медиа', image: 'Медиа', result: 'Итог' };
const mediaItem = (src: string) => ({ id: src, src, kind: 'image' as const });
const factOptions = {
  year: ['2026', '2025', '2024', '2023'],
  platform: ['Mobile App', 'iOS', 'Android', 'Web', 'Telegram Mini App', 'Desktop'],
  role: ['Product Design', 'UX/UI', 'Research', 'IA', 'Prototyping', 'Motion', 'Usability Testing', 'Design System'],
};
function QuickFact({ name, value, onChange }: { name: keyof typeof factOptions; value?: string; onChange: (value: string) => void }) {
  const label = { year: 'Год', platform: 'Платформа', role: 'Роль' }[name];
  const selected = (value ?? '').split(',').map(item => item.trim()).filter(Boolean);
  const toggle = (item: string) => onChange(name === 'year' ? item : (selected.includes(item) ? selected.filter(current => current !== item) : [...selected, item]).join(', '));
  return <Field label={label}><div className="fact-entry has-badges"><input className="fact-input" aria-label={label} value={value ?? ''} onChange={event => onChange(event.target.value)} />{<div className="fact-badges" role="group" aria-label={`Быстрый выбор: ${label.toLowerCase()}`}>{factOptions[name].map(item => <button type="button" aria-pressed={selected.includes(item)} key={item} onClick={() => toggle(item)}>{item}</button>)}</div>}</div></Field>;
}
function sectionMedia(section: EditorSection, project: EditorCase): MediaSpec | undefined {
  if (section.media) return section.media;
  if (section.image) return defaultMedia(section.image);
  const screens = section.items?.map(item => mediaItem(item.image)) ?? (section.visual ? visualImages[section.visual].map(file => mediaItem(`assets/${file}`)) : section.type === 'context' ? project.slides?.map(item => mediaItem(item.image)) : undefined);
  if (!screens?.length) return undefined;
  return { mode: 'mockup', motion: 'static', mockupId: 'none', screens, background: { mode: 'photo', source: mediaItem('assets/case-bg.png') } };
}
function Preview({ project, state }: { project: EditorCase; state: EditorState }) {
  return <article className="draft-preview"><h1>{project.heading || project.title}</h1>{project.about && <div className="preview-about"><span>О проекте</span><p>{project.about}</p></div>}<dl>{[['Год', project.year], ['Платформа', project.platform], ['Роль', project.role]].filter(([, text]) => text).map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl><CaseMedia value={project.heroMedia} templates={state.templates} resolve={resolveMedia} />{project.sections.filter(section => section.enabled !== false).map(section => <section key={section.key}><h2>{section.heading}</h2>{section.showHypothesis !== false && section.hypothesis && <Note state={state} type="hypothesis"><p>{section.hypothesis}</p></Note>}{section.callout && <p className="preview-callout">☝️ {section.callout}</p>}<ExtraNotes notes={section.notes} state={state} position="before" /><div className="preview-body"><Markdown>{section.body}</Markdown></div>{section.showTest !== false && section.test && <Note state={state} type="test"><p>{section.test}</p></Note>}<ExtraNotes notes={section.notes} state={state} position="after" />{section.showMedia !== false && sectionMedia(section, project) && <CaseMedia value={sectionMedia(section, project)!} templates={state.templates} resolve={resolveMedia} />}</section>)}</article>;
}
function BlockEditor({ section, project, state, index, total, onChange, onMove, onDelete, onDuplicate }: { section: EditorSection; project: EditorCase; state: EditorState; index: number; total: number; onChange: (patch: Partial<EditorSection>) => void; onMove: (from: number, to: number) => void; onDelete: () => void; onDuplicate: () => void }) {
  const [expanded, setExpanded] = useState(index === 0 || section.body === '');
  const [toolsOpen, setToolsOpen] = useState(false);
  const visual = sectionMedia(section, project);
  return <section className={`cms-block${section.enabled === false ? ' block-disabled' : ''}`} onDragOver={event => { if (event.dataTransfer.types.includes('application/x-portfolio-block')) event.preventDefault(); }} onDrop={event => { const raw = event.dataTransfer.getData('application/x-portfolio-block'); if (!raw) return; event.preventDefault(); const data = JSON.parse(raw) as { project: string; index: number }; if (data.project === project.id) onMove(data.index, index); }}>
    <div className="block-heading"><button className="block-grip" draggable onDragStart={event => { event.dataTransfer.setData('application/x-portfolio-block', JSON.stringify({ project: project.id, index })); event.dataTransfer.effectAllowed = 'move'; }} aria-label={`Переместить блок ${index + 1}`}>⠿</button><button className="block-name" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}><span>{String(index + 1).padStart(2, '0')}</span><strong>{section.heading || 'Без заголовка'}</strong><small>{kindNames[section.type]}</small></button><div className={`block-actions${toolsOpen ? ' is-open' : ''}`}><button disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label="Блок выше">↑</button><button disabled={index === total - 1} onClick={() => onMove(index, index + 1)} aria-label="Блок ниже">↓</button><button onClick={onDuplicate} aria-label="Дублировать блок">⧉</button><button onClick={onDelete} aria-label="Удалить блок">×</button></div><button className="block-more" aria-label="Действия с блоком" aria-expanded={toolsOpen} onClick={() => setToolsOpen(!toolsOpen)}>···</button><Toggle checked={section.enabled !== false} onChange={enabled => onChange({ enabled })} label="Показывать блок" /><button className="block-collapse" onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Свернуть блок' : 'Развернуть блок'} aria-expanded={expanded}>{expanded ? '⌃' : '⌄'}</button></div>
    {expanded && <div className="block-content"><InlineText heading label="Заголовок блока" value={section.heading} onChange={heading => onChange({ heading })} />{section.callout !== undefined && <Field label="Выделенная строка"><InlineText label="Выделенная строка" value={section.callout} onChange={callout => onChange({ callout })} /></Field>}
      {section.type === 'solution' && <div className="note-edit"><div className="note-edit-heading"><span>Гипотеза</span><Toggle label="Показывать гипотезу" checked={section.showHypothesis ?? Boolean(section.hypothesis)} onChange={showHypothesis => onChange({ showHypothesis })} /></div>{(section.showHypothesis ?? Boolean(section.hypothesis)) && <Note state={state} type="hypothesis"><InlineText label="Текст гипотезы" value={section.hypothesis} onChange={hypothesis => onChange({ hypothesis })} /></Note>}</div>}
      <TextEditor label="Текст блока" value={section.body} onChange={body => onChange({ body })} />
      {section.type === 'solution' && <div className="note-edit"><div className="note-edit-heading"><span>Юзабилити-тест</span><Toggle label="Показывать тестирование" checked={section.showTest ?? Boolean(section.test)} onChange={showTest => onChange({ showTest })} /></div>{(section.showTest ?? Boolean(section.test)) && <Note state={state} type="test"><InlineText label="Текст тестирования" value={section.test} onChange={test => onChange({ test })} /></Note>}</div>}
      <NotesEditor notes={section.notes} state={state} onChange={notes => onChange({ notes })} /><div className="block-media-toggle"><span>Медиа после текста</span><Toggle label="Показывать медиа" checked={section.showMedia !== false && Boolean(visual)} onChange={showMedia => onChange({ showMedia, ...(showMedia && !visual ? { media: emptyMedia() } : {}) })} /></div>{section.showMedia !== false && visual && <MediaEditor value={visual} title="Медиа блока" templates={state.templates} onChange={media => onChange({ media })} />}
    </div>}
  </section>;
}

export default function Editor() {
  const [state, setState] = useState<EditorState>(initialState);
  const [ready, setReady] = useState(false), [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saved');
  const [view, setView] = useState(state.cases[0]?.id ?? 'profile');
  const [notice, setNotice] = useState(''), [exporting, setExporting] = useState(false), [addMenu, setAddMenu] = useState(false), [navOpen, setNavOpen] = useState(false);
  const [deleted, setDeleted] = useState<{ caseId: string; section: EditorSection; index: number }>();
  const [download, setDownload] = useState<{ url: string; filename: string }>();
  useEffect(() => () => { if (download) URL.revokeObjectURL(download.url); }, [download]);
  const [loadError, setLoadError] = useState('');
  const [saveTime, setSaveTime] = useState(''), [publishing, setPublishing] = useState(false);
  const publish = async () => { setPublishing(true); try { await publishContent(state, view); setNotice('Сохранено в GitHub. Сайт обновляется.'); } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Не удалось сохранить.'); } finally { setPublishing(false); } };
  const refresh = async () => { setPublishing(true); try { const latest = await loadState(true); const backup = await exportContent(state, 'all'); setDownload(backup); await saveState(latest); setState(latest); if (!['profile','mockups','callouts'].includes(view) && !latest.cases.some(item => item.id === view)) setView(latest.cases[0]?.id ?? 'profile'); setNotice('Загружена актуальная версия. Прежний черновик сохранён в ZIP.'); } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Не удалось обновить данные.'); } finally { setPublishing(false); } };
  const addButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let active = true;
    void loadState().then(saved => { if (active && saved) { setState(saved); setView(saved.cases[0]?.id ?? 'profile'); } }).catch(error => { if (active) setLoadError(error instanceof Error ? error.message : 'Не удалось открыть редактор.'); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!ready || publishing) return;
    let active = true; setSaveStatus('saving');
    const timer = setTimeout(() => { void saveState(state).then(() => { if (active) { setSaveStatus('saved'); setSaveTime(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })); } }).catch(() => { if (active) { setSaveStatus('error'); setNotice('Не удалось сохранить черновик. Можно скачать экспорт.'); } }); }, 500);
    return () => { active = false; clearTimeout(timer); };
  }, [state, ready, publishing]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6000); return () => clearTimeout(timer); }, [notice]);
  const project = state.cases.find(item => item.id === view);
  const updateProject = (patch: Partial<EditorCase>) => setState(current => ({ ...current, cases: current.cases.map(item => item.id === view ? { ...item, ...patch } : item) }));
  const updateSection = (key: string, patch: Partial<EditorSection>) => { if (project) updateProject({ sections: project.sections.map(section => section.key === key ? { ...section, ...patch } : section) }); };
  const moveSection = (from: number, to: number) => {
    if (!project || to < 0 || to >= project.sections.length || from === to) return;
    const sections = [...project.sections]; const [section] = sections.splice(from, 1); sections.splice(to, 0, section); updateProject({ sections });
  };
  const addSection = (type: 'text' | 'solution' | 'gallery') => {
    if (!project) return;
    const section = { key: uid(), type, heading: type === 'solution' ? 'Новое решение' : type === 'gallery' ? 'Новый визуал' : 'Новый блок', body: '', ...(type === 'gallery' ? { media: emptyMedia() } : {}) };
    updateProject({ sections: [...project.sections, section] }); setAddMenu(false);
    requestAnimationFrame(() => document.getElementById(`block-${section.key}`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' }));
  };
  const addCase = () => {
    const id = `case-${uid().slice(0, 8)}`;
    const item: EditorCase = { id, title: 'Новый кейс', heading: 'Новый кейс', status: 'pending', order: state.cases.length + 1, layout: 'standard', coverMedia: { ...emptyMedia(), mode: 'mockup', screens: [{ id: uid(), src: '' }, { id: uid(), src: '' }] }, heroMedia: emptyMedia(), sections: [] };
    setState(current => ({ ...current, cases: [...current.cases, item] })); setView(id); setNavOpen(false); window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const selectView = (next: string) => { setView(next); setNavOpen(false); setAddMenu(false); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const exportDraft = async () => {
    setExporting(true);
    try { const file = await exportContent(state, view); setDownload(file); setNotice('Экспорт готов.'); } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Не удалось скачать экспорт.'); } finally { setExporting(false); }
  };
  if (loadError) return <div className="cms-loading"><div><p>{loadError}</p><button className="cms-secondary-action" onClick={() => window.location.reload()}>Повторить</button><a className="site-link" href="/sign-in">Войти через GitHub</a></div></div>;
  if (!ready) return <div className="cms-loading">Открываю редактор…</div>;
  return <div inert={publishing} className={`cms-shell${navOpen ? ' nav-open' : ''}`}>
    <button className="mobile-nav-button" onClick={() => setNavOpen(!navOpen)} aria-label="Меню" aria-expanded={navOpen}>☰</button>
    <aside className="cms-sidebar"><div className="cms-brand">Портфолио <span>/ CMS</span></div><nav aria-label="Редактор"><p className="nav-label">Кейсы</p>{state.cases.map(item => <button className={`nav-item${view === item.id ? ' is-active' : ''}`} key={item.id} onClick={() => selectView(item.id)}><span className={`case-dot${item.status === 'published' ? ' is-published' : ''}`} /><span>{item.heading || item.title}</span></button>)}<button className="nav-add" onClick={addCase}>+ Новый кейс</button><div className="nav-divider" />{[['profile', 'Профиль'], ['mockups', 'Мокапы'], ['callouts', 'Плашки']].map(([id, label]) => <button className={`nav-item${view === id ? ' is-active' : ''}`} key={id} onClick={() => selectView(id)}>{label}</button>)}</nav><div className="sidebar-footer"><div className="draft-status" role="status"><span className={saveStatus === 'error' ? 'status-error' : ''}>{saveStatus === 'saving' ? 'Сохраняю…' : saveStatus === 'error' ? 'Не сохранено' : `Черновик сохранён${saveTime ? ` · ${saveTime}` : ''}`}</span><small>Черновик в этом браузере</small></div>{project && <Dialog.Root><Dialog.Trigger className="cms-primary-action">Предпросмотр</Dialog.Trigger><Dialog.Portal><Dialog.Backdrop className="cms-dialog-backdrop" /><Dialog.Popup className="cms-preview-dialog"><div className="preview-bar"><Dialog.Title>Предпросмотр кейса</Dialog.Title><Dialog.Close aria-label="Закрыть">×</Dialog.Close></div><Dialog.Description className="visually-hidden">{project.heading}</Dialog.Description><Preview project={project} state={state} /></Dialog.Popup></Dialog.Portal></Dialog.Root>}<button className="cms-primary-action" disabled={publishing} onClick={() => void publish()}>{publishing ? 'Сохраняю…' : 'Сохранить в GitHub'}</button><button className="cms-secondary-action" disabled={exporting} onClick={() => void exportDraft()}>{exporting ? 'Готовлю экспорт…' : 'Скачать экспорт'}</button>{download && <a className="site-link" href={download.url} download={download.filename}>Скачать готовый ZIP ↓</a>}<button className="site-link" disabled={publishing} onClick={() => void refresh()}>Обновить из GitHub</button><form action="/api/logout" method="post"><button type="submit" className="site-link" style={{width:'100%'}}>Выйти</button></form><a className="site-link" href="https://frlvv.github.io/portfolio/" target="_blank" rel="noreferrer">Открыть сайт ↗</a></div></aside>
    <main className="cms-workspace">{project ? <>
      <header className="case-editor-header"><div className="inline-title"><span className="title-size" aria-hidden="true">{project.title || 'Заголовок кейса'}</span><InlineText label="Заголовок кейса" heading value={project.title} onChange={title => updateProject({ title })} /><CmsIcon name="edit" /></div><Toggle label="Кейс опубликован" checked={project.status === 'published'} onChange={published => updateProject({ status: published ? 'published' : 'pending' })} /></header>
      <MediaEditor title="Обложка кейса" value={project.coverMedia} onChange={coverMedia => updateProject({ coverMedia })} templates={state.templates} layout="cover" />
      <CmsIcon name="divider" />
      <section className="cms-info"><h2>Информация</h2><Field label="Название внутри кейса"><InlineText heading label="Название внутри кейса" value={project.heading} onChange={heading => updateProject({ heading })} /></Field><Field label="О проекте"><TextEditor label="О проекте" value={project.about} onChange={about => updateProject({ about })} /></Field><div className="info-facts">{(['year', 'platform', 'role'] as const).map(key => <QuickFact key={key} name={key} value={project[key]} onChange={value => updateProject({ [key]: value })} />)}</div><MediaEditor title="Первое медиа в кейсе" value={project.heroMedia} onChange={heroMedia => updateProject({ heroMedia })} templates={state.templates} /></section>
      <CmsIcon name="divider" />
      <section className="cms-content"><div className="content-heading"><div><h2>Контент</h2><span>{blockCount(project.sections.length)}</span></div><div className="add-block-control"><button ref={addButton} className="add-block-button" onClick={() => setAddMenu(!addMenu)} aria-expanded={addMenu}>+ Добавить блок</button>{addMenu && <><button className="menu-dismiss" aria-label="Закрыть меню блоков" onClick={() => setAddMenu(false)} /><div className="add-block-menu">{[['text', 'Текст', 'Заголовок, текст и медиа'], ['solution', 'Решение', 'Гипотеза, решение и тест'], ['gallery', 'Медиа', 'Мокапы, фото или видео']].map(([type, title, hint]) => <button key={type} onClick={() => addSection(type as 'text' | 'solution' | 'gallery')}><strong>{title}</strong><span>{hint}</span></button>)}</div></>}</div></div>
        {project.sections.length ? project.sections.map((section, index) => <div id={`block-${section.key}`} key={section.key}><BlockEditor section={section} project={project} state={state} index={index} total={project.sections.length} onChange={patch => updateSection(section.key, patch)} onMove={moveSection} onDuplicate={() => { const sections = [...project.sections]; sections.splice(index + 1, 0, { ...structuredClone(section), key: uid() }); updateProject({ sections }); }} onDelete={() => { setDeleted({ caseId: project.id, section, index }); updateProject({ sections: project.sections.filter(item => item.key !== section.key) }); setNotice('Блок удалён'); }} /></div>) : <button className="empty-content" onClick={() => setAddMenu(true)}><span>+</span>Добавь первый блок</button>}
      </section>
    </> : view === 'profile' ? <section className="cms-settings"><h1>Профиль</h1><Field label="Имя"><InlineText heading label="Имя" value={state.profile.name} onChange={name => setState(current => ({ ...current, profile: { ...current.profile, name } }))} /></Field><Field label="Профессия"><InlineText label="Профессия" value={state.profile.role} onChange={role => setState(current => ({ ...current, profile: { ...current.profile, role } }))} /></Field>{state.profile.sections.map((section, index) => <section className="profile-editor-block" key={index}><div className="settings-row"><InlineText heading label="Название раздела" value={section.label} onChange={label => setState(current => ({ ...current, profile: { ...current.profile, sections: current.profile.sections.map((item, i) => i === index ? { ...item, label } : item) } }))} /><button className="quiet-button" onClick={() => setState(current => ({ ...current, profile: { ...current.profile, sections: current.profile.sections.filter((_, i) => i !== index) } }))}>Удалить</button></div><TextEditor label="Текст раздела" value={section.text} onChange={text => setState(current => ({ ...current, profile: { ...current.profile, sections: current.profile.sections.map((item, i) => i === index ? { ...item, text } : item) } }))} /></section>)}<button className="add-block-button" onClick={() => setState(current => ({ ...current, profile: { ...current.profile, sections: [...current.profile.sections, { label: 'Новый раздел', text: '' }] } }))}>+ Добавить раздел</button></section>
    : view === 'callouts' ? <CalloutSettings state={state} onChange={setState} />
    : <Mockups state={state} onChange={setState} />}</main>
    {notice && <div className="cms-notice" role="status"><span>{notice}</span>{notice === 'Экспорт готов.' && download && <a href={download.url} download={download.filename}>Скачать ZIP</a>}{notice === 'Блок удалён' && deleted && <button onClick={() => { setState(current => ({ ...current, cases: current.cases.map(item => { if (item.id !== deleted.caseId) return item; const sections = [...item.sections]; sections.splice(deleted.index, 0, deleted.section); return { ...item, sections }; }) })); setDeleted(undefined); setNotice('Блок восстановлен'); }}>Вернуть</button>}<button onClick={() => setNotice('')} aria-label="Закрыть уведомление">×</button></div>}
  </div>;
}
