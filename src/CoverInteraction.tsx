import { useEffect, useRef, useState, type ReactNode } from 'react';
import './cover-interaction.css';

export default function CoverInteraction({ children }: { children: (active: boolean) => ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [active, setActive] = useState(false);
  const reset = () => {
    cancelAnimationFrame(frame.current);
    const element = root.current;
    if (!element) return;
    delete element.dataset.tracking;
    element.style.transform = '';
    element.querySelectorAll<HTMLElement>('.cover-phone,.media-renderer-phone').forEach(phone => { phone.style.transform = ''; });
  };
  useEffect(() => {
    const preference = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const change = () => { reset(); setActive(false); };
    preference.addEventListener('change', change);
    return () => { cancelAnimationFrame(frame.current); preference.removeEventListener('change', change); };
  }, []);
  const leave = () => { setActive(false); reset(); };
  return <div className="cover-interaction" onPointerEnter={event => {
    if (event.pointerType === 'mouse' && matchMedia('(hover:hover) and (pointer:fine)').matches) setActive(true);
  }} onPointerMove={event => {
    if (event.pointerType !== 'mouse' || !matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-.5, Math.min(.5, (event.clientX - bounds.left) / bounds.width - .5));
    const y = Math.max(-.5, Math.min(.5, (event.clientY - bounds.top) / bounds.height - .5));
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const element = root.current;
      if (!element) return;
      element.dataset.tracking = 'true';
      element.style.transform = `perspective(1200px) translateZ(-4px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg)`;
      element.querySelectorAll<HTMLElement>('.cover-phone,.media-renderer-phone').forEach((phone, index) => {
        const depth = 6 + index * 3;
        phone.style.transform = `perspective(900px) translate3d(${-x * depth}px,${-y * depth}px,0) rotateX(${-y}deg) rotateY(${x}deg) scale(1.008)`;
      });
    });
  }} onPointerLeave={leave} onPointerCancel={leave} onClick={leave}><div className="cover-motion" ref={root}>{children(active)}</div></div>;
}
