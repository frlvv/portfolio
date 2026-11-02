import { useEffect, useRef, type CSSProperties } from 'react';
import { media, mockupTemplates } from './content';
import type { MediaItem, MediaSpec, MockupTemplate } from './mediaTypes';
import './case-media.css';
import MockupZoom from './MockupZoom';

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
  return <video ref={ref} src={src} poster={/\/gradient\.mp4$/.test(src) ? src.replace(/gradient\.mp4$/, 'gradient-poster.jpg') : undefined} muted loop playsInline preload="metadata" />;
}

function Visual({ item, active, resolve }: { item?: MediaItem; active: boolean; resolve: (src?: string) => string }) {
  if (!item?.src) return null;
  const src = resolve(item.src);
  if (!src) return null;
  return item.kind === 'video' || /\.(mp4|webm|mov)(?:\?|$)/i.test(item.src) ? <MediaVideo src={src} active={active} /> : <img src={src} alt="" draggable="false" />;
}

export default function CaseMedia({ value, layout = 'hero', active = true, title, templates = mockupTemplates, resolve = media }: { value: MediaSpec; layout?: 'cover' | 'hero' | 'content'; active?: boolean; title?: string; templates?: MockupTemplate[]; resolve?: (src?: string) => string }) {
  const template = templates.find(item => item.id === value.mockupId) ?? templates[0];
  const count = value.screens.length;
  const landscape = template.width > template.height;
  const gap = 4;
  const ratio = template.width / template.height;
  const contentWidth = Math.min((88 - gap * (count - 1)) / Math.max(count, 1), 84 * ratio / (948 / 708));
  const contentHeight = contentWidth * (948 / 708) / ratio;
  const renderDevice = (item: MediaItem) => <div className={`media-renderer-phone${template.frame ? '' : ' is-frameless'}`} style={{ '--screen-left': `${template.insetX}%`, '--screen-top': `${template.insetY}%`, '--screen-width': `${template.insetWidth}%`, '--screen-height': `${template.insetHeight}%`, '--screen-radius': `${template.radius}% / ${template.radius * template.screenWidth / template.screenHeight}%` } as CSSProperties}><div className="media-renderer-screen"><Visual item={item} active={active && value.motion === 'animated'} resolve={resolve} /></div>{template.frame && <img className="media-renderer-frame" src={resolve(template.frame)} alt="" draggable="false" />}</div>;
  const zoomable = layout !== 'cover' && value.mode === 'mockup';
  return <MockupZoom title={title} ratio={ratio} items={value.screens.map(item => ({ id: item.id, content: renderDevice(item) }))}>{open => <div className={`media-renderer media-renderer-${layout} media-renderer-${value.mode}`}>
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
          ...(count === 1 ? { left: layout === 'cover' ? '24.2333%' : '30.8545%', top: layout === 'cover' ? '10.9375%' : '10.169%' } : {}),
          ...(count > 2 ? { width: `${Math.min(34, 92 / count)}%`, left: `${4 + index * (92 / count)}%`, top: `${12 + (index % 2) * 8}%` } : {}),
          ...(landscape ? { width: `${count === 1 ? 78 : Math.min(62, 92 / count)}%`, left: `${count === 1 ? 11 : 4 + index * (92 / count)}%`, top: `${count === 1 ? 22 : 18 + (index % 2) * 10}%` } : {}),
          ...(layout === 'content' ? {
            width: `${contentWidth}%`,
            left: `${(100 - count * contentWidth - (count - 1) * gap) / 2 + index * (contentWidth + gap)}%`,
            top: `${(100 - contentHeight) / 2}%`,
          } : {}),
        } as CSSProperties;
        const Device = zoomable && item.src ? 'button' : 'div';
        return <Device type={Device === 'button' ? 'button' : undefined} onClick={Device === 'button' ? () => open(index) : undefined} aria-label={Device === 'button' ? `Увеличить: ${index + 1}` : undefined} className={`${Device === 'button' ? 'mockup-zoom-trigger ' : ''}media-renderer-phone media-renderer-phone-${index + 1}${template.frame ? '' : ' is-frameless'}`} style={style} key={item.id}>
          <div className="media-renderer-screen"><Visual item={item} active={active && value.motion === 'animated'} resolve={resolve} /></div>
          {template.frame && <img className="media-renderer-frame" src={resolve(template.frame)} alt="" draggable="false" />}
        </Device>;
      })}
    </> : <Visual item={value.source} active={active && value.mode === 'video'} resolve={resolve} />}
    {(value.mode !== 'mockup' && !value.source?.src || value.mode === 'mockup' && !value.screens.some(item => item.src)) && <span className="media-renderer-empty">Превью</span>}
  </div>}</MockupZoom>;
}
