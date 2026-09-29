import { useEffect, useRef, type CSSProperties } from 'react';
import { media, mockupTemplates } from './content';
import type { MediaItem, MediaSpec, MockupTemplate } from './mediaTypes';
import './case-media.css';

function MediaVideo({ src, active }: { src: string; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let visible = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      if (active && visible && !document.hidden && !reduced.matches) void element.play().catch(() => undefined);
      else element.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); reduced.removeEventListener('change', update); element.pause(); };
  }, [src, active]);
  return <video ref={ref} src={src} muted loop playsInline preload="metadata" />;
}

function Visual({ item, active, resolve }: { item?: MediaItem; active: boolean; resolve: (src?: string) => string }) {
  if (!item?.src) return null;
  const src = resolve(item.src);
  if (!src) return null;
  return item.kind === 'video' || /\.(mp4|webm|mov)(?:\?|$)/i.test(item.src) ? <MediaVideo src={src} active={active} /> : <img src={src} alt="" draggable="false" />;
}

export default function CaseMedia({ value, layout = 'hero', active = true, templates = mockupTemplates, resolve = media }: { value: MediaSpec; layout?: 'cover' | 'hero'; active?: boolean; templates?: MockupTemplate[]; resolve?: (src?: string) => string }) {
  const template = templates.find(item => item.id === value.mockupId) ?? templates[0];
  const count = value.screens.length;
  return <div className={`media-renderer media-renderer-${layout} media-renderer-${value.mode}`}>
    {value.mode === 'mockup' ? <>
      <div className="media-renderer-background"><Visual item={value.background.source} active={active && value.background.mode === 'video'} resolve={resolve} /></div>
      <div className="media-renderer-grain" />
      {value.screens.map((item, index) => {
        const style = {
          '--media-index': index,
          '--media-count': count,
          '--screen-left': `${template.insetX}%`,
          '--screen-top': `${template.insetY}%`,
          '--screen-width': `${template.insetWidth}%`,
          '--screen-height': `${template.insetHeight}%`,
          '--screen-radius': `${template.radius}% / ${template.radius * template.screenWidth / template.screenHeight}%`,
          aspectRatio: `${template.width}/${template.height}`,
          ...(count === 1 ? { left: layout === 'cover' ? '24.2333%' : '30.8545%' } : {}),
          ...(count > 2 ? { width: `${Math.min(34, 92 / count)}%`, left: `${4 + index * (92 / count)}%`, top: `${12 + (index % 2) * 8}%` } : {}),
        } as CSSProperties;
        return <div className={`media-renderer-phone media-renderer-phone-${index + 1}${template.frame ? '' : ' is-frameless'}`} style={style} key={item.id}>
          <div className="media-renderer-screen"><Visual item={item} active={active && value.motion === 'animated'} resolve={resolve} /></div>
          {template.frame && <img className="media-renderer-frame" src={resolve(template.frame)} alt="" draggable="false" />}
        </div>;
      })}
    </> : <Visual item={value.source} active={active && value.mode === 'video'} resolve={resolve} />}
    {(value.mode !== 'mockup' && !value.source?.src || value.mode === 'mockup' && !value.screens.some(item => item.src)) && <span className="media-renderer-empty">Превью</span>}
  </div>;
}
