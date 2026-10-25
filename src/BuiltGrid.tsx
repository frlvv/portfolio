import { useEffect, useRef, useState } from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { useTextMorph } from 'torph/react';
import BuiltCard from './BuiltCard';
import type { PortfolioBuild } from './content';

function DomainText({ text }: { text: string }) {
  const initial = useRef(text), first = useRef(true);
  const { ref, update } = useTextMorph({ duration: 180, ease: 'cubic-bezier(.23,1,.32,1)', numbers: false, scale: false });
  useEffect(() => {
    update(text);
    const animations: Animation[] = [];
    if (!first.current && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ref.current?.querySelectorAll<HTMLElement>('[torph-item]:not([torph-exiting])').forEach((letter, index) => {
        animations.push(letter.animate([{ filter: 'blur(4px)' }, { filter: 'blur(0)' }], { duration: 180, delay: index * 5, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' }));
      });
    }
    first.current = false;
    return () => animations.forEach(animation => animation.cancel());
  }, [text, update, ref]);
  return <span className="built-domain-text" ref={ref}>{initial.current}</span>;
}

export default function BuiltGrid({ items }: { items: PortfolioBuild[] }) {
  const [hoverAvailable, setHoverAvailable] = useState(false);
  const hovering = useRef(false);
  const actions = useRef<Tooltip.Root.Actions | null>(null);
  useEffect(() => {
    const query = matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setHoverAvailable(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return <Tooltip.Root<string> actionsRef={actions} disabled={!hoverAvailable} trackCursorAxis="both" disableHoverablePopup onOpenChange={(open, details) => { if (!open && details.reason === 'trigger-hover' && hovering.current) details.cancel(); }}>{({ payload }) => <><div className="built-grid built-grid-linked" onPointerEnter={() => { hovering.current = hoverAvailable; }} onPointerLeave={() => { hovering.current = false; actions.current?.close(); }} onPointerCancel={() => { hovering.current = false; actions.current?.close(); }}>{items.map(item => <BuiltCard key={item.id} item={item} sharedTooltip />)}</div><Tooltip.Portal><Tooltip.Positioner className="built-domain-positioner" side="bottom" align="start" sideOffset={({ positioner }) => 9 - positioner.height / 2} alignOffset={-18} collisionPadding={12}><Tooltip.Popup className="built-domain"><DomainText text={payload ?? ''} /><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 18 17.414 6.586M6 6h10a2 2 0 0 1 2 2v10" /></svg></Tooltip.Popup></Tooltip.Positioner></Tooltip.Portal></>}</Tooltip.Root>;
}
