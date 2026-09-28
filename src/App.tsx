import { motion, useMotionTemplate, useSpring } from 'motion/react';
import GradientBackground from './GradientBackground';
import Portrait from './Portrait';
import React, { CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import Lenis from 'lenis';
import { TextMorph } from 'torph/react';
import Markdown from 'react-markdown';
import { cases, media, profileContent, projectUpdated, solutionCallouts, type PortfolioCase, type CaseSection } from './content';

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;
const imageDimensions: Record<string, { width: number; height: number }> = {"hero-hub.png": {"width": 2144, "height": 2144}, "type-goal.png": {"width": 2144, "height": 2144}, "amount.png": {"width": 2144, "height": 2144}, "plan.png": {"width": 2144, "height": 2144}, "no-plan.png": {"width": 2144, "height": 2144}, "screen-goal.png": {"width": 2144, "height": 2144}, "plan-overview.png": {"width": 2144, "height": 2144}, "plan-adjust.png": {"width": 2144, "height": 2144}, "quick-amount.png": {"width": 2144, "height": 2144}, "quick-plan.png": {"width": 2144, "height": 2144}, "quick-hold.png": {"width": 2144, "height": 2144}, "current-home.png": {"width": 828, "height": 1792}, "current-account.png": {"width": 828, "height": 1792}};

function useSmoothScroll(blocked = false, wrapper?: React.RefObject<HTMLDivElement | null>, content?: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let lenis: Lenis | undefined;
    const setup = () => {
      lenis?.destroy();
      if (preference.matches || blocked || (wrapper && !wrapper.current) || matchMedia('(max-width:700px)').matches) return;
      lenis = new Lenis({ wrapper: wrapper?.current ?? window, content: content?.current ?? document.documentElement, autoRaf: true, smoothWheel: true, syncTouch: false, lerp: 0.2, overscroll: false });
    };
    setup();
    preference.addEventListener('change', setup);
    return () => { lenis?.destroy(); preference.removeEventListener('change', setup); };
  }, [blocked, wrapper, content]);
}

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return <img className="icon" src={asset(`${name}.svg`)} width={size} height={size} alt="" draggable="false" />;
}

function BlurText({ text, visible }: { text: string; visible: boolean }) {
  return <span className="blur-text" data-visible={visible} aria-hidden={!visible}>{[...text].map((letter, index) => <span className="blur-letter" style={{ '--letter-index': index } as CSSProperties} key={index}><TextMorph duration={180} numbers={false}>{letter === ' ' ? '\u00a0' : letter}</TextMorph></span>)}</span>;
}

function PendingProjectCard({ project }: { project: PortfolioCase }) {
  const [active, setActive] = useState(false);
  return <button className="project-card project-pending" onMouseEnter={() => { if (matchMedia('(hover: hover) and (pointer: fine)').matches) setActive(true); }} onMouseLeave={() => setActive(false)} onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setActive(true); }} onBlur={() => setActive(false)} onClick={event => {
    const card = event.currentTarget;
    card.classList.remove('is-denied');
    void card.offsetWidth;
    card.classList.add('is-denied');
  }} onAnimationEnd={event => event.currentTarget.classList.remove('is-denied')}>
    <span className={`pending-visual${active ? ' is-active' : ''}`}>
      {project.cover && <img className="pending-cover" src={media(project.cover)} alt="" draggable="false" />}
      <span className="pending-status" aria-hidden="true">
        <span className="pending-lock-track"><img className="pending-lock" src={asset('lock.svg')} alt="" draggable="false" /></span>
        <span className="pending-status-text"><BlurText text="Кейс в разработке" visible={active} /></span>
      </span>
    </span>
    <span className="project-title">{project.title}</span>
  </button>;
}

function PhoneMockup({ screen, className }: { screen: 'hub' | 'goal'; className: string }) {
  return <div className={className}>
    <img className="mockup-screen" src={asset(`${screen}-screen.png`)} alt="" draggable="false" />
    <img className="mockup-frame" src={asset('phone-frame.png')} alt="" draggable="false" />
  </div>;
}

function Cover() {
  const [hovered, setHovered] = useState(false);
  const x = useSpring(0, { mass: 1, stiffness: 100, damping: 20 });
  const y = useSpring(0, { mass: 1, stiffness: 100, damping: 20 });
  const depth = useSpring(0, { mass: 1, stiffness: 100, damping: 20 });
  const transform = useMotionTemplate`perspective(1200px) translateZ(${depth}px) rotateX(${y}deg) rotateY(${x}deg)`;
  const reset = () => { setHovered(false); x.set(0); y.set(0); depth.set(0); };
  return <div className="cover-interaction" onPointerMove={event => {
    if (event.pointerType !== 'mouse' || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    setHovered(true);
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) / rect.width * 3);
    y.set(-(event.clientY - rect.top - rect.height / 2) / rect.height * 3);
    depth.set(-4);
  }} onPointerLeave={reset} onPointerCancel={reset} onClick={reset}>
    <motion.div className="cover" style={{ transform }}>
      <GradientBackground active={hovered} />
      <PhoneMockup screen="hub" className="cover-phone cover-phone-first layered-phone" />
      <PhoneMockup screen="goal" className="cover-phone cover-phone-second layered-phone" />
    </motion.div>
  </div>;
}

function HeroCover() {
  return <div className="hero-cover">
    <GradientBackground active />
    <PhoneMockup screen="hub" className="hero-phone hero-phone-first layered-phone" />
    <PhoneMockup screen="goal" className="hero-phone hero-phone-second layered-phone" />
  </div>;
}

type VisualKind = 'hub' | 'type' | 'plan' | 'goal' | 'change' | 'quick';
const visualPhones: Record<VisualKind, string[]> = {
  hub: ['hero-hub.png'], type: ['type-goal.png'], plan: ['amount.png', 'plan.png', 'no-plan.png'], goal: ['screen-goal.png'], change: ['plan-overview.png', 'plan-adjust.png'], quick: ['quick-amount.png', 'quick-plan.png', 'quick-hold.png'],
};

function CaseVisual({ kind, image }: { kind?: VisualKind; image?: string }) {
  if (image) return <div className="case-visual case-uploaded-visual"><img src={media(image)} alt="" draggable="false" loading="lazy" /></div>;
  if (!kind) return null;
  if (kind === 'type') return <div className="case-visual visual-type-original"><img className="visual-background" src={asset('case-bg.png')} width={1254} height={1254} alt="" draggable="false" loading="lazy" /><div className="visual-type-phone"><img className="visual-composite" src={asset('type-goal-original.png')} width={876} height={1810} alt="Четыре типа копилки" draggable="false" loading="lazy" /></div></div>;
  return <div className={`case-visual visual-${kind}`}>
    <img className="visual-background" src={asset('case-bg.png')} width={1254} height={1254} alt="" draggable="false" loading="lazy" />
    {visualPhones[kind].map((file, index) => <div className={`visual-phone visual-phone-${index + 1}`} key={file}><img src={asset(file)} {...imageDimensions[file]} alt="" draggable="false" loading="lazy" /></div>)}
  </div>;
}

function ContactContent() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const [hovered, setHovered] = useState<'email' | 'telegram' | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText('v@frlvv.ru');
      setError(false); setCopied(true); clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2400);
    } catch { setError(true); }
  }
  return <>
    <div className="contact-heading"><Dialog.Title>Contact</Dialog.Title><Dialog.Close className="contact-close" aria-label="Закрыть"><Icon name="close" size={24} /></Dialog.Close></div>
    <Dialog.Description className="sr-only">Контакты</Dialog.Description>
    <div className="contact-links">
      <button className={`contact-row${copied ? ' is-copied' : ''}`} onClick={copyEmail} onMouseEnter={() => { if (matchMedia('(hover: hover) and (pointer: fine)').matches) setHovered('email'); }} onMouseLeave={() => setHovered(null)} onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setHovered('email'); }} onBlur={() => setHovered(null)} aria-label="Email"><Icon name="email" size={20} /><span className="contact-label"><span>Email</span><span>v@frlvv.ru</span></span><span className="contact-action" aria-live="polite"><BlurText text="copy" visible={!copied && hovered === 'email'} /><BlurText text="🎉 copied" visible={copied} /></span></button>
      <a className="contact-row" href="https://t.me/vf433" target="_blank" rel="noreferrer" onMouseEnter={() => { if (matchMedia('(hover: hover) and (pointer: fine)').matches) setHovered('telegram'); }} onMouseLeave={() => setHovered(null)} onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setHovered('telegram'); }} onBlur={() => setHovered(null)} aria-label="Telegram"><Icon name="telegram" size={20} /><span className="contact-label"><span>Telegram</span><span>vf433</span></span><span className="contact-action"><BlurText text="go" visible={hovered === 'telegram'} /></span></a>
    </div>
    {error && <p className="copy-error" role="status">Не удалось скопировать. <a href="mailto:v@frlvv.ru">v@frlvv.ru</a></p>}
  </>;
}

function ImageSlider({ project }: { project: PortfolioCase }) {
  const [active, setActive] = useState(0);
  const pointer = useRef<{ id: number; x: number; y: number; target: number | null } | null>(null);
  const suppressClick = useRef(false);
  const items = project.slides?.length ? project.slides.map(slide => ({ file: slide.image, alt: slide.label || '' })) : [{ file: 'assets/current-home.png', alt: 'Главная Т-Банка со счетами' }, { file: 'assets/current-account.png', alt: 'Экран накопительного счёта' }];
  const change = (index: number) => setActive((index + items.length) % items.length);
  return <div className="image-slider" role="region" aria-label="Интерфейс до редизайна">
    <div className="image-stack" tabIndex={0} onKeyDown={event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); change(active + (event.key === 'ArrowRight' ? 1 : -1)); }
    }} onPointerDown={event => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      const slide = (event.target as HTMLElement).closest<HTMLButtonElement>('.stack-slide');
      pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, target: slide ? Number(slide.dataset.index) : null };
      suppressClick.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerUp={event => {
      const start = pointer.current; if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
        change(active + (dx < 0 ? 1 : -1));
        suppressClick.current = true;
      } else {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const pressedBackPhoto = (active === 0 && x > 0.82) || (active === 1 && x < 0.18);
        if (pressedBackPhoto) {
          change(active + 1);
          suppressClick.current = true;
        } else if (start.target !== null && start.target !== active) {
          change(start.target);
          suppressClick.current = true;
        }
      }
      pointer.current = null;
    }} onPointerCancel={() => { pointer.current = null; }}>
      {items.map((item, index) => <button key={item.file} data-index={index} className={`stack-slide ${index === active ? 'is-front' : 'is-back'} ${index === 0 ? 'stack-home' : 'stack-account'}`} onClick={() => {
        if (suppressClick.current) { suppressClick.current = false; return; } change(index);
      }} aria-label={item.alt} aria-current={index === active ? 'true' : undefined}><img src={media(item.file)} {...imageDimensions[item.file.split('/').pop() || '']} alt="" draggable="false" loading="lazy" /></button>)}
      <button className={`back-photo-hit back-photo-hit-${active}`} onClick={() => {
        if (suppressClick.current) { suppressClick.current = false; return; }
        change(active + 1);
      }} aria-label="Заднее фото" />
    </div>
    <div className="slider-controls"><button onClick={() => change(active - 1)} aria-label="Предыдущая">←</button><div className="slider-dots">{items.map((item, index) => <button key={item.file} className={active === index ? 'is-active' : ''} onClick={() => change(index)} aria-label={`${index + 1}`} aria-pressed={active === index}><span /></button>)}</div><button onClick={() => change(active + 1)} aria-label="Следующая">→</button></div>
  </div>;
}

function SolutionNote({ type, children }: { type: 'hypothesis' | 'test'; children: React.ReactNode }) {
  const settings = solutionCallouts[type];
  return <div className={`solution-note solution-note-${type}`} style={{ '--note-color': settings.color, '--note-opacity': settings.backgroundOpacity } as CSSProperties}><span className="solution-note-icon">{settings.icon}</span><div><strong>{settings.title}</strong><p>{children}</p></div></div>;
}

function Solution({ section }: { section: CaseSection }) {
  const uploadedMedia = section.items?.length ? <div className={`solution-media-gallery case-media-${section.mediaMode || 'photo'}`}>{section.items.map((item, index) => <figure key={`${item.image}-${index}`}><img src={media(item.image)} alt="" loading="lazy" draggable="false" />{item.label && <figcaption>{item.label}</figcaption>}</figure>)}</div> : <CaseVisual kind={section.visual} image={section.image} />;
  return <div className="solution-block"><div className="solution-copy"><h3>{section.heading}</h3>{section.hypothesis && section.showHypothesis !== false && <SolutionNote type="hypothesis">{section.hypothesis}</SolutionNote>}<div className="body-copy"><Markdown>{section.body}</Markdown></div>{section.test && section.showTest !== false && <SolutionNote type="test">{section.test}</SolutionNote>}</div>{uploadedMedia}</div>;
}

function CaseContent({ project }: { project: PortfolioCase }) {
  const renderSection = (section: CaseSection, index: number) => {
    const body = <div className="body-copy"><Markdown>{section.body}</Markdown></div>;
    if (section.type === 'solution') return <Solution key={index} section={section} />;
    if (section.type === 'image') return <section className="case-section case-image-section" key={index}>{section.heading && <h2>{section.heading}</h2>}{section.image && <img src={media(section.image)} alt="" loading="lazy" />}{body}</section>;
    if (section.type === 'gallery') return <section className={`case-section case-media-gallery case-media-${section.mediaMode || 'photo'}`} key={index}>{section.heading && <h2>{section.heading}</h2>}{section.items?.map((item, mediaIndex) => <figure key={`${item.image}-${mediaIndex}`}><img src={media(item.image)} alt="" loading="lazy" draggable="false" />{item.label && <figcaption>{item.label}</figcaption>}</figure>)}</section>;
    if (section.type === 'result') return <section className="case-section case-result" key={index}><h2>{section.heading}</h2>{section.image && <img className="result-overview" src={media(section.image)} alt="" loading="lazy" />}{body}</section>;
    if (section.type === 'context') return <section className="case-section context-section" key={index}><div><h2>{section.heading}</h2>{body}</div>{section.image ? <img className="case-context-image" src={media(section.image)} alt="" loading="lazy" /> : project.slides?.length || project.layout === 'savings' ? <ImageSlider project={project} /> : null}</section>;
    return <section className="case-section text-section" key={index}><h2>{section.heading}</h2>{section.callout && <p className="callout"><span>☝️</span>{section.callout}</p>}{body}{section.image && <img className="case-section-image" src={media(section.image)} alt="" loading="lazy" />}</section>;
  };
  const sections: React.ReactNode[] = [];
  for (let index = 0; index < (project.sections?.length ?? 0); index++) {
    const section = project.sections[index];
    if (section.type !== 'solution') {
      sections.push(renderSection(section, index));
      continue;
    }
    const solutions: CaseSection[] = [];
    while (project.sections[index]?.type === 'solution') {
      solutions.push(project.sections[index]);
      index++;
    }
    sections.push(<section className="case-section solutions-section" key={`solutions-${index}`}><h2>Гипотезы и решения</h2>{solutions.map((item, offset) => <Solution key={offset} section={item} />)}</section>);
    index--;
  }
  return <article className="case-article">
    <header className="case-intro">
      <Dialog.Title>{project.heading || project.title}</Dialog.Title>
      {project.about && <div className="case-about"><p className="eyebrow">О проекте</p><Dialog.Description className="body-copy">{project.about}</Dialog.Description></div>}
      {(project.year || project.platform || project.role) && <dl className="case-facts">{project.year && <div><dt>Год</dt><dd>{project.year}</dd></div>}{project.platform && <div><dt>Платформа</dt><dd>{project.platform}</dd></div>}{project.role && <div><dt>Роль в проекте</dt><dd>{project.role}</dd></div>}</dl>}
    </header>
    {project.hero ? <div className="hero-cover case-uploaded-hero"><img src={media(project.hero)} alt="" /></div> : project.layout === 'savings' ? <HeroCover /> : null}
    {sections}
    {projectUpdated[project.id] && <p className="case-updated eyebrow">Обновлено {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Volgograd' }).format(new Date(projectUpdated[project.id]))}</p>}
  </article>;
}

type SheetDrag = { source: 'touch' | 'pointer'; id: number; x: number; y: number; lastY: number; lastTime: number; velocity: number; committed: boolean };

function CaseViewport({ onClose, project }: { onClose: () => void; project: PortfolioCase }) {
  const wrapper = useRef<HTMLDivElement>(null), content = useRef<HTMLDivElement>(null), popup = useRef<HTMLDivElement>(null);
  const drag = useRef<SheetDrag | null>(null);
  const [dragY, setDragY] = useState(0), [dragging, setDragging] = useState(false), [showTop, setShowTop] = useState(false);
  useSmoothScroll(false, wrapper, content);
  useLayoutEffect(() => {
    if (wrapper.current) wrapper.current.scrollTop = 0;
    setShowTop(false);
  }, []);
  useEffect(() => {
    const onWindowScroll = () => {
      if (matchMedia('(max-width:700px)').matches) setShowTop(window.scrollY > 480);
    };
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', onWindowScroll);
  }, []);
  const release = useCallback((clientY: number, cancelled = false) => {
    const gesture = drag.current;
    if (!gesture) return;
    const distance = Math.max(0, clientY - gesture.y);
    const projectedDistance = distance + Math.max(0, gesture.velocity) * 180;
    drag.current = null;
    setDragging(false);
    const shouldClose = !cancelled && gesture.committed && (distance > Math.min(140, innerHeight * .2) || projectedDistance > innerHeight * .28);
    if (shouldClose) {
      setDragY(distance);
      requestAnimationFrame(onClose);
    } else {
      setDragY(0);
    }
  }, [onClose]);
  useEffect(() => {
    const element = popup.current;
    if (!element) return;
    const touchStart = (event: TouchEvent) => {
      if ((event.target as HTMLElement).closest('button,a') || event.touches.length !== 1) return;
      const scrollTop = matchMedia('(max-width:700px)').matches ? window.scrollY : (wrapper.current?.scrollTop ?? 0);
      if (scrollTop > 1) return;
      const touch = event.touches[0];
      drag.current = { source: 'touch', id: touch.identifier, x: touch.clientX, y: touch.clientY, lastY: touch.clientY, lastTime: event.timeStamp, velocity: 0, committed: false };
    };
    const touchMove = (event: TouchEvent) => {
      const gesture = drag.current;
      if (!gesture || gesture.source !== 'touch' || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (touch.identifier !== gesture.id) return;
      const dx = touch.clientX - gesture.x, dy = touch.clientY - gesture.y;
      if (!gesture.committed) {
        if (dy > 8 && Math.abs(dy) > Math.abs(dx)) {
          gesture.committed = true;
          setDragging(true);
        } else if (dy < -8 || Math.abs(dx) > Math.abs(dy) + 8) {
          drag.current = null;
          return;
        } else {
          return;
        }
      }
      event.preventDefault();
      const elapsed = Math.max(1, event.timeStamp - gesture.lastTime);
      gesture.velocity = (touch.clientY - gesture.lastY) / elapsed;
      gesture.lastY = touch.clientY;
      gesture.lastTime = event.timeStamp;
      setDragY(Math.max(0, dy));
    };
    const touchEnd = (event: TouchEvent) => {
      const gesture = drag.current;
      if (!gesture || gesture.source !== 'touch') return;
      const touch = Array.from(event.changedTouches).find(item => item.identifier === gesture.id);
      if (touch) release(touch.clientY);
    };
    const touchCancel = () => release(drag.current?.lastY ?? 0, true);
    element.addEventListener('touchstart', touchStart, { passive: true });
    element.addEventListener('touchmove', touchMove, { passive: false });
    element.addEventListener('touchend', touchEnd, { passive: true });
    element.addEventListener('touchcancel', touchCancel, { passive: true });
    return () => {
      element.removeEventListener('touchstart', touchStart);
      element.removeEventListener('touchmove', touchMove);
      element.removeEventListener('touchend', touchEnd);
      element.removeEventListener('touchcancel', touchCancel);
    };
  }, [release]);
  function scrollToTop() {
    const mobile = matchMedia('(max-width:700px)').matches;
    const element = wrapper.current;
    if (!mobile && !element) return;
    const getTop = () => mobile ? window.scrollY : element!.scrollTop;
    const setTop = (value: number) => { if (mobile) window.scrollTo(0, value); else element!.scrollTop = value; };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setTop(0); return; }
    const start = getTop(), startedAt = performance.now(), duration = 420;
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      setTop(start * Math.pow(1 - progress, 4));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const popupStyle = { '--drag-y': `${dragY}px` } as CSSProperties;
  return <Dialog.Viewport className="case-viewport" ref={wrapper} onScroll={event => setShowTop(event.currentTarget.scrollTop > 480)}><div className="case-scroll-content" ref={content}><Dialog.Popup ref={popup} className={`case-popup${dragging ? ' is-dragging' : ''}`} style={popupStyle} data-displaced={dragY > 0 || undefined} onPointerDown={event => {
      if (event.pointerType === 'touch') return;
      if ((event.target as HTMLElement).closest('button,a')) return;
      const scrollTop = matchMedia('(max-width:700px)').matches ? window.scrollY : (wrapper.current?.scrollTop ?? 0);
      if (scrollTop > 2) return;
      drag.current = { source: 'pointer', id: event.pointerId, x: event.clientX, y: event.clientY, lastY: event.clientY, lastTime: event.timeStamp, velocity: 0, committed: false };
      event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event => {
      const gesture = drag.current;
      if (!gesture || gesture.source !== 'pointer' || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (!gesture.committed) {
        if (dy > 8 && Math.abs(dy) > Math.abs(dx)) { gesture.committed = true; setDragging(true); }
        else if (dy < -8 || Math.abs(dx) > Math.abs(dy) + 8) { drag.current = null; return; }
        else return;
      }
      const elapsed = Math.max(1, event.timeStamp - gesture.lastTime);
      gesture.velocity = (event.clientY - gesture.lastY) / elapsed;
      gesture.lastY = event.clientY;
      gesture.lastTime = event.timeStamp;
      setDragY(Math.max(0, dy));
    }} onPointerUp={event => { if (drag.current?.source === 'pointer') release(event.clientY); }} onPointerCancel={() => { if (drag.current?.source === 'pointer') release(drag.current.lastY, true); }}>
    <div className="case-swipe-zone"><span /></div>
    <Dialog.Close className="case-close" aria-label="Закрыть" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); onClose(); }}><Icon name="case-close" size={40} /></Dialog.Close><CaseContent project={project} />
  </Dialog.Popup><button className={`case-top${showTop ? ' is-visible' : ''}`} onClick={scrollToTop} aria-label="Вверх">↑</button></div></Dialog.Viewport>;
}

export default function App() {
  const [contactOpen, setContactOpen] = useState(false), [caseOpen, setCaseOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<PortfolioCase>(cases.find(project => project.status === 'published') ?? cases[0]);
  const pageScroll = useRef(0);
  useSmoothScroll(contactOpen || caseOpen);
  useEffect(() => {
    for (const file of ['case-bg.png', 'hero-hub.png', 'hero-goal.png']) {
      const image = new Image();
      image.src = asset(file);
      image.decode?.().catch(() => undefined);
    }
  }, []);
  const changeCaseOpen = (open: boolean) => {
    const root = document.documentElement;
    if (!open && root.dataset.caseOpen && matchMedia('(max-width:700px)').matches) {
      const viewport = document.querySelector<HTMLElement>('.case-viewport');
      root.style.setProperty('--case-scroll', `${window.scrollY}px`);
      root.dataset.caseClosing = 'true';
      if (viewport) {
        viewport.style.height = `${viewport.offsetHeight}px`;
        viewport.style.overflow = 'clip';
      }
    }
    if (open && !root.dataset.caseOpen) {
      pageScroll.current = window.scrollY;
      root.style.setProperty('--page-scroll', `${pageScroll.current}px`);
      root.dataset.caseOpen = 'true';
      if (matchMedia('(max-width:700px)').matches) window.scrollTo({ top: 0, behavior: 'instant' });
    }
    setCaseOpen(open);
  };
  const completeCaseChange = (open: boolean) => {
    if (open) return;
    const root = document.documentElement;
    if (!root.dataset.caseOpen) return;
    delete root.dataset.caseOpen;
    delete root.dataset.caseClosing;
    root.style.removeProperty('--page-scroll');
    root.style.removeProperty('--case-scroll');
    if (matchMedia('(max-width:700px)').matches) window.scrollTo({ top: pageScroll.current, behavior: 'instant' });
  };
  return <><main className="portfolio-layout" data-case-open={caseOpen}>
    <aside className="profile"><Portrait blocked={caseOpen || contactOpen} /><div className="profile-block"><p className="eyebrow">{profileContent.name}</p><h1>{profileContent.role}</h1></div>{profileContent.sections.map((section, index) => <div className="profile-block" key={index}><p className="eyebrow">{section.label}</p><p className="profile-section-text">{section.text}</p></div>)}<div className="profile-actions">
      <Dialog.Root open={contactOpen} onOpenChange={setContactOpen}><Dialog.Trigger className="contact-button">Contact</Dialog.Trigger><Dialog.Portal><Dialog.Backdrop className="contact-backdrop" /><Dialog.Popup className="contact-popup"><ContactContent /></Dialog.Popup></Dialog.Portal></Dialog.Root>
      <a className="cv-button" href={`${import.meta.env.BASE_URL}CV_Vlad_Frolov_Product_Designer.pdf`} target="_blank" rel="noreferrer">CV</a>
    </div></aside>
    <section className="projects" id="work"><Dialog.Root open={caseOpen} onOpenChange={changeCaseOpen} onOpenChangeComplete={completeCaseChange} modal="trap-focus">{cases.map(project => project.status === 'pending' ? <PendingProjectCard key={project.id} project={project} /> : <Dialog.Trigger key={project.id} className={`project-card${project.layout === 'savings' && !project.cover ? ' project-animated' : ''}`} aria-label={project.title} onClick={() => setSelectedCase(project)}>{project.cover ? <div className="cover case-static-cover"><img src={media(project.cover)} alt="" draggable="false" /></div> : project.layout === 'savings' ? <Cover /> : <div className="cover case-empty-cover" />}<span className="project-title">{project.title}</span></Dialog.Trigger>)}<Dialog.Portal><Dialog.Backdrop className="case-backdrop" /><CaseViewport project={selectedCase} onClose={() => changeCaseOpen(false)} /></Dialog.Portal></Dialog.Root></section>
  </main></>;
}
