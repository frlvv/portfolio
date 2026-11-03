import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import './mockup-zoom.css';

type ZoomItem = { id: string; content: ReactNode };
type Box = { left: number; top: number; width: number; height: number };
const easing = 'ease-in-out';
const duration = 300;
const unclipped = 'inset(0% 0% 0% 0%)';
const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
function textBox(element: HTMLElement): Box {
  const range = document.createRange();
  range.selectNodeContents(element);
  return range.getBoundingClientRect();
}
function inverse(source: Box, target: Box, scale = 1, origin = target) {
  const widthRatio = source.width / target.width;
  const heightRatio = source.height / target.height;
  const x = (source.left - target.left + (1 - widthRatio) * (target.left - origin.left)) / scale;
  const y = (source.top - target.top + (1 - heightRatio) * (target.top - origin.top)) / scale;
  return `translate(${x}px,${y}px) scale(${widthRatio},${heightRatio})`;
}

function sourceClip(element: HTMLElement | undefined, box: Box) {
  const media = element?.closest('.media-renderer,.case-visual,.hero-cover');
  if (!media || !box.width || !box.height) return unclipped;
  const bounds = media.getBoundingClientRect();
  const top = Math.max(0, bounds.top - box.top) / box.height;
  const right = Math.max(0, box.left + box.width - bounds.right) / box.width;
  const bottom = Math.max(0, box.top + box.height - bounds.bottom) / box.height;
  const left = Math.max(0, bounds.left - box.left) / box.width;
  return `inset(${top * 100}% ${right * 100}% ${bottom * 100}% ${left * 100}%)`;
}

export default function MockupZoom({ title = 'Мокапы', ratio, items, children }: { title?: string; ratio: number; items: ZoomItem[]; children: (open: (index: number) => void) => ReactNode }) {
  const [selected, setSelected] = useState(0);
  const [isOpen, setOpen] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement | null>(null);
  const origins = useRef<HTMLElement[]>([]);
  const originBoxes = useRef<Box[]>([]);
  const heading = useRef<HTMLElement | null>(null);
  const headingBox = useRef<Box | null>(null);
  const hidden = useRef(new Map<HTMLElement, string>());
  const animations = useRef<Animation[]>([]);
  const entered = useRef(false);
  const closing = useRef(false);
  const restore = () => { hidden.current.forEach((opacity, element) => { element.style.opacity = opacity; }); hidden.current.clear(); };
  const hide = (element: HTMLElement) => { hidden.current.set(element, element.style.opacity); element.style.opacity = '0'; };
  const animate = (element: HTMLElement, keyframes: Keyframe[]) => {
    const animation = element.animate(keyframes, { duration: reduced() ? 0 : duration, easing, fill: 'both' });
    animations.current.push(animation);
    return animation;
  };
  useEffect(() => () => { animations.current.forEach(animation => animation.cancel()); restore(); }, []);
  const open = (index: number) => {
    if (!items[index]) return;
    animations.current.forEach(animation => animation.cancel()); animations.current = [];
    origins.current = Array.from(host.current?.querySelectorAll<HTMLElement>('.mockup-zoom-trigger,.media-renderer-phone') ?? []);
    originBoxes.current = origins.current.map(element => element.getBoundingClientRect());
    const section = host.current?.closest('.solution-block,.case-section,.case-article,.draft-preview');
    heading.current = Array.from(section?.querySelectorAll<HTMLElement>('h1,h2,h3') ?? []).find(element => element.textContent?.trim() === title?.trim()) ?? null;
    const box = heading.current ? textBox(heading.current) : null;
    headingBox.current = box && box.top + box.height > 0 && box.top < window.innerHeight ? box : null;
    entered.current = false; closing.current = false;
    setSelected(index); setOpen(true);
  };
  const enter = (element: HTMLDivElement | null) => {
    popup.current = element;
    if (!element || entered.current) return;
    entered.current = true;
    element.querySelectorAll<HTMLElement>('[data-zoom-device]').forEach(content => {
      const index = Number(content.dataset.zoomDevice);
      const target = content.getBoundingClientRect();
      const source = originBoxes.current[index];
      if (!source?.width || !target.width) return;
      const clip = sourceClip(origins.current[index], source);
      const animation = animate(content, [
        { transform: inverse(source, target, target.width / content.offsetWidth), clipPath: clip },
        { transform: 'translate(0px,0px) scale(1,1)', clipPath: unclipped },
      ]);
      void animation.finished.then(() => animation.cancel()).catch(() => undefined);
      const item = content.parentElement!;
      if (item.classList.contains('mockup-zoom-thumb')) {
        const fade = animate(item, [{ opacity: 1 }, { opacity: getComputedStyle(item).opacity }]);
        void fade.finished.then(() => fade.cancel()).catch(() => undefined);
      }
    });
    const label = element.querySelector<HTMLElement>('.mockup-zoom-title');
    if (label) {
      const target = textBox(label);
      const source = headingBox.current;
      const animation = animate(label, source?.width && target.width
        ? [{ transform: inverse(source, target, 1, label.getBoundingClientRect()) }, { transform: 'translate(0px,0px) scale(1,1)' }]
        : [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0px)' }]);
      void animation.finished.then(() => animation.cancel()).catch(() => undefined);
    }
    const shade = element.querySelector<HTMLElement>('.mockup-zoom-backdrop');
    if (shade) animate(shade, [{ opacity: 0 }, { opacity: 1 }]);
    origins.current.forEach(hide);
    host.current?.closest('.case-viewport')?.querySelectorAll<HTMLElement>('.case-close,.case-top').forEach(hide);
    if (heading.current && headingBox.current) hide(heading.current);
  };

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const element = popup.current;
    if (!element || reduced()) { restore(); setOpen(false); return; }
    const contents = Array.from(element.querySelectorAll<HTMLElement>('[data-zoom-device],.mockup-zoom-title'));
    const starts = contents.map(content => ({
      box: content.dataset.zoomDevice === undefined ? textBox(content) : content.getBoundingClientRect(),
      clip: getComputedStyle(content).clipPath,
      opacity: getComputedStyle(content).opacity,
    }));
    const items = Array.from(element.querySelectorAll<HTMLElement>('.mockup-zoom-item'));
    const itemStyles = items.map(item => ({ transform: getComputedStyle(item).transform, opacity: getComputedStyle(item).opacity }));
    const shade = element.querySelector<HTMLElement>('.mockup-zoom-backdrop');
    const shadeOpacity = shade ? getComputedStyle(shade).opacity : '0';
    element.dataset.closing = 'true';
    items.forEach((item, index) => { item.style.transform = itemStyles[index].transform; });
    animations.current.forEach(animation => animation.cancel());
    animations.current = [];
    items.forEach((item, index) => animate(item, [{ opacity: itemStyles[index].opacity }, { opacity: 1 }]));

    const exits = contents.map((content, index) => {
      const isDevice = content.dataset.zoomDevice !== undefined;
      const device = isDevice ? origins.current[Number(content.dataset.zoomDevice)] : undefined;
      const bounds = content.getBoundingClientRect();
      const target = isDevice ? bounds : textBox(content);
      const source = isDevice ? device?.getBoundingClientRect() : heading.current ? textBox(heading.current) : null;
      if (!target.width) return null;
      const scale = isDevice ? target.width / content.offsetWidth : 1;
      const visible = source && source.width && source.top + source.height > 0 && source.top < window.innerHeight;
      const start = inverse(starts[index].box, target, scale, bounds);
      return animate(content, [
        { transform: start, opacity: starts[index].opacity, clipPath: starts[index].clip === 'none' ? unclipped : starts[index].clip },
        { transform: visible ? inverse(source, target, scale, bounds) : start, opacity: visible ? 1 : 0, clipPath: visible && device ? sourceClip(device, source) : unclipped },
      ]);
    }).filter((animation): animation is Animation => Boolean(animation));
    if (shade) exits.push(animate(shade, [{ opacity: shadeOpacity }, { opacity: 0 }]));
    const controls = element.querySelector<HTMLElement>('.mockup-zoom-controls');
    if (controls) animate(controls, [{ opacity: 1 }, { opacity: 0, offset: .65 }, { opacity: 0 }]);
    void Promise.all(exits.map(animation => animation.finished.catch(() => undefined))).then(() => { restore(); setOpen(false); });
  };

  const choose = (index: number) => {
    if (closing.current) return;
    setSelected(index);
  };
  return <Dialog.Root modal="trap-focus" open={isOpen} onOpenChange={value => { if (!value) close(); }}>
    <div ref={host} className="mockup-zoom-source">{children(open)}</div>
    <Dialog.Portal><Dialog.Popup ref={enter} className="mockup-zoom-popup" onPointerDown={event => event.stopPropagation()} onClick={event => { if (!(event.target as Element).closest('button')) close(); }} onKeyDown={event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); event.stopPropagation(); choose((selected + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length); }
    }}>
      <div className="mockup-zoom-backdrop" aria-hidden="true" />
      <header className="mockup-zoom-heading"><Dialog.Title className="mockup-zoom-title">{title || 'Мокапы'}</Dialog.Title></header>
      <div className="mockup-zoom-stage" style={{ '--zoom-ratio': ratio } as CSSProperties}>{items.map((item, index) => {
        const offset = index - selected;
        const distance = offset === 0 ? '0px' : `calc(${Math.sign(offset)} * (var(--zoom-width) * .73 + var(--zoom-gap) + ${Math.abs(offset) - 1} * (var(--zoom-width) * .46 + var(--zoom-gap))))`;
        return <button type="button" className={`mockup-zoom-item ${offset === 0 ? 'mockup-zoom-main' : 'mockup-zoom-thumb'}`} style={{ transform: `translate(-50%,-50%) translateX(${distance}) scale(${offset === 0 ? 1 : .46})` }} onClick={() => offset === 0 ? close() : choose(index)} aria-label={offset === 0 ? 'Уменьшить' : `Увеличить: ${index + 1}`} key={item.id}><div className="mockup-zoom-content" data-zoom-device={index} style={{ aspectRatio: ratio }}>{item.content}</div></button>;
      })}</div>
      <div className="mockup-zoom-controls"><button type="button" className="mockup-zoom-close" onClick={close} aria-label="Закрыть"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg></button>{items.length > 1 && <div className="mockup-zoom-navigation"><button type="button" onClick={() => choose((selected - 1 + items.length) % items.length)} aria-label="Предыдущий">←</button><span>{selected + 1} / {items.length}</span><button type="button" onClick={() => choose((selected + 1) % items.length)} aria-label="Следующий">→</button></div>}</div>
    </Dialog.Popup></Dialog.Portal>
  </Dialog.Root>;
}
