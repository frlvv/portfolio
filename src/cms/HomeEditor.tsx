import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import BuiltCard, { buildHref } from '../BuiltCard';
import CaseMedia from '../CaseMedia';
import type { PortfolioBuild, Profile, ProfileSection } from '../content';
import { resolveMedia, storeFile, uid, type EditorState } from './storage';
import { Field, InlineText, Toggle } from './ui';
import './home-editor.css';

type Props = { state: EditorState; onChange: Dispatch<SetStateAction<EditorState>>; onEditCase: (id: string) => void; onAddCase: () => void; onNotice: (text: string) => void };

export default function HomeEditor({ state, onChange, onEditCase, onAddCase, onNotice }: Props) {
  const [editing, setEditing] = useState<string>();
  const [activeCase, setActiveCase] = useState<string>();
  const [deleted, setDeleted] = useState<{ item: PortfolioBuild; index: number }>();
  const [uploading, setUploading] = useState(false);
  const iconInput = useRef<HTMLInputElement>(null), portraitInput = useRef<HTMLInputElement>(null);
  const profile = state.profile, builds = profile.builds ?? [], build = builds.find(item => item.id === editing);
  const patchProfile = (patch: Partial<Profile>) => onChange(current => ({ ...current, profile: { ...current.profile, ...patch } }));
  const patchSection = (index: number, patch: Partial<ProfileSection>) => onChange(current => ({ ...current, profile: { ...current.profile, sections: current.profile.sections.map((section, i) => i === index ? { ...section, ...patch } : section) } }));
  const patchBuild = (patch: Partial<PortfolioBuild>) => onChange(current => ({ ...current, profile: { ...current.profile, builds: (current.profile.builds ?? []).map(item => item.id === editing ? { ...item, ...patch } : item) } }));
  const moveBuild = (index: number, direction: number) => {
    const next = index + direction;
    if (next < 0 || next >= builds.length) return;
    const ordered = [...builds]; [ordered[index], ordered[next]] = [ordered[next], ordered[index]]; patchProfile({ builds: ordered });
  };
  const uploadImage = async (file: File | undefined, type: 'icon' | 'portrait') => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|avif|gif)$/.test(file.type)) { onNotice('Выбери PNG, JPG, WebP, AVIF или GIF.'); return; }
    setUploading(true);
    try { const image = await storeFile(file); if (type === 'portrait') patchProfile({ portrait: image.src }); else patchBuild({ icon: image.src }); }
    catch { onNotice('Не удалось загрузить изображение.'); }
    finally { setUploading(false); }
  };
  const addBuild = () => { const item: PortfolioBuild = { id: uid(), name: 'Новый build', description: '', url: '', enabled: true }; patchProfile({ builds: [...builds, item] }); setEditing(item.id); };
  return <section className="home-editor">
    <header className="home-editor-header"><h1>Главная</h1><a href="https://frlvv.github.io/portfolio/" target="_blank" rel="noreferrer">Открыть сайт ↗</a></header>
    <div className="home-editor-layout">
      <aside className="home-profile">
        <div className="home-portrait-area"><button className="home-portrait" onClick={() => portraitInput.current?.click()} disabled={uploading} aria-label="Изменить фото"><img src={resolveMedia(profile.portrait || 'assets/portrait.png')} alt="" width={123} height={198} /><span className="home-photo-action">Изменить фото</span></button><input ref={portraitInput} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" className="visually-hidden" onChange={event => { void uploadImage(event.target.files?.[0], 'portrait'); event.target.value = ''; }} /></div>
        <div className="home-profile-block"><InlineText label="Имя" value={profile.name} onChange={name => patchProfile({ name })} /><InlineText label="Профессия" value={profile.role} onChange={role => patchProfile({ role })} /></div>
        {profile.sections.map((section, index) => <div className="home-profile-block" key={index}><div className="home-section-label"><InlineText label="Название раздела" value={section.label} onChange={label => patchSection(index, { label })} /><button className="home-section-delete" aria-label={`Удалить раздел ${section.label}`} onClick={() => patchProfile({ sections: profile.sections.filter((_, i) => i !== index) })}>×</button></div><InlineText label="Текст раздела" value={section.text} onChange={text => patchSection(index, { text })} /></div>)}
        <button className="home-add" onClick={() => patchProfile({ sections: [...profile.sections, { label: 'Новый раздел', text: '' }] })}>+ Раздел профиля</button>
        <div className="home-profile-actions" aria-hidden="true"><span>Contact</span><span>CV</span></div>
      </aside>
      <div className="home-work">
        <section className={`home-built-section${profile.showBuilds === false ? ' home-disabled' : ''}`}><div className="home-section-heading"><InlineText label="Заголовок Built" value={profile.builtTitle ?? 'Built'} onChange={builtTitle => patchProfile({ builtTitle })} /><Toggle checked={profile.showBuilds !== false} onChange={showBuilds => patchProfile({ showBuilds })} label="Показывать Built" /></div>
          <div className="built-grid">{builds.map(item => <div className={`home-built-item${item.enabled === false ? ' home-disabled' : ''}`} key={item.id}><BuiltCard item={item} resolve={resolveMedia} interactive={false} /><button className="home-edit-action" onClick={() => setEditing(item.id)} aria-label={`Редактировать ${item.name}`}>Редактировать ↗</button></div>)}</div>
          <button className="home-add" onClick={addBuild}>+ Добавить build</button>
          {deleted && <div className="home-undo" role="status"><span>{deleted.item.name} удалён</span><button onClick={() => { const restored = [...builds]; restored.splice(deleted.index, 0, deleted.item); patchProfile({ builds: restored }); setDeleted(undefined); }}>Вернуть</button></div>}
        </section>
        <section className="home-projects"><div className="home-section-heading"><InlineText label="Заголовок Projects" value={profile.projectsTitle ?? 'Projects'} onChange={projectsTitle => patchProfile({ projectsTitle })} /></div>
          {state.cases.map(project => <div className="home-project" key={project.id} onMouseEnter={() => setActiveCase(project.id)} onMouseLeave={() => setActiveCase(undefined)}><div className="home-project-cover">{project.coverMedia ? <CaseMedia value={project.coverMedia} templates={state.templates} resolve={resolveMedia} layout="cover" active={activeCase === project.id} /> : project.cover && <img src={resolveMedia(project.cover)} alt="" width={640} height={640} />}{project.status === 'pending' && <span className="home-pending">В работе</span>}<button className="home-edit-action" onClick={() => onEditCase(project.id)}>Редактировать кейс ↗</button></div><button className="home-project-title" onClick={() => onEditCase(project.id)}>{project.title}</button></div>)}
          <button className="home-add" onClick={onAddCase}>+ Добавить кейс</button>
        </section>
      </div>
    </div>
    <Dialog.Root open={Boolean(build)} onOpenChange={open => { if (!open) setEditing(undefined); }}><Dialog.Portal><Dialog.Backdrop className="cms-dialog-backdrop" /><Dialog.Popup className="home-build-dialog">{build && <><div className="home-build-dialog-header"><Dialog.Title>Редактировать build</Dialog.Title><Dialog.Close aria-label="Закрыть">×</Dialog.Close></div><Dialog.Description className="visually-hidden">{build.name}</Dialog.Description>
      <div className="home-build-preview"><button className="home-icon-upload" onClick={() => iconInput.current?.click()} disabled={uploading} aria-label="Изменить иконку">{build.icon ? <img src={resolveMedia(build.icon)} width={64} height={64} alt="" /> : <span>+</span>}<span className="home-photo-action">Изменить</span></button><div><span>Иконка</span><button className="home-add" onClick={() => iconInput.current?.click()} disabled={uploading}>{uploading ? 'Загружаю…' : 'Загрузить изображение'}</button></div><input ref={iconInput} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" className="visually-hidden" onChange={event => { void uploadImage(event.target.files?.[0], 'icon'); event.target.value = ''; }} /></div>
      <Field label="Название"><InlineText label="Название build" value={build.name} onChange={name => patchBuild({ name })} /></Field><Field label="Описание"><InlineText label="Описание build" value={build.description} onChange={description => patchBuild({ description })} /></Field><Field label="Ссылка"><input className="home-url-input" type="url" value={build.url} placeholder="https://" onChange={event => patchBuild({ url: event.target.value })} aria-label="Ссылка build" />{build.url && !buildHref(build.url) && <span className="home-url-error">Укажи ссылку, начинающуюся с https:// или http://</span>}</Field>
      <div className="settings-row"><span>Показывать на сайте</span><Toggle checked={build.enabled !== false} onChange={enabled => patchBuild({ enabled })} label="Показывать build" /></div><div className="home-build-order"><span>Порядок</span><button disabled={builds.indexOf(build) === 0} onClick={() => moveBuild(builds.indexOf(build), -1)} aria-label="Build раньше">←</button><button disabled={builds.indexOf(build) === builds.length - 1} onClick={() => moveBuild(builds.indexOf(build), 1)} aria-label="Build позже">→</button></div><div className="home-build-dialog-footer"><button className="quiet-button" onClick={() => { setDeleted({ item: build, index: builds.indexOf(build) }); patchProfile({ builds: builds.filter(item => item.id !== editing) }); setEditing(undefined); }}>Удалить build</button><Dialog.Close className="add-block-button">Готово</Dialog.Close></div>
    </>}</Dialog.Popup></Dialog.Portal></Dialog.Root>
  </section>;
}
