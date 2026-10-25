import { useEffect, useState } from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import type { PortfolioBuild } from './content';
import { media } from './content';
import './built.css';

export function buildHref(value: string) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}

export default function BuiltCard({ item, resolve = media, interactive = true, sharedTooltip = false }: { item: PortfolioBuild; resolve?: (src?: string) => string; interactive?: boolean; sharedTooltip?: boolean }) {
  const href = buildHref(item.url);
  const [hoverAvailable, setHoverAvailable] = useState(false);
  useEffect(() => {
    if (!interactive || !href || sharedTooltip) return;
    const query = matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setHoverAvailable(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [interactive, href, sharedTooltip]);
  const content = <>{item.icon ? <img className="built-icon" src={resolve(item.icon)} alt="" width={48} height={48} draggable={false} /> : <span className="built-icon built-initial" aria-hidden="true">{item.name.slice(0, 1)}</span>}<span className="built-copy"><span className="built-name">{item.name}</span>{item.description && <span className="built-description">{item.description}</span>}</span></>;
  if (!interactive || !href) return <div className="built-card">{content}</div>;
  const domain = new URL(href).hostname.replace(/^www\./, '');
  if (sharedTooltip) return <Tooltip.Trigger payload={domain} delay={0} closeDelay={0} render={<a className="built-card" href={href} target="_blank" rel="noopener noreferrer" />}>{content}</Tooltip.Trigger>;
  return <Tooltip.Root disabled={!hoverAvailable} trackCursorAxis="both" disableHoverablePopup><Tooltip.Trigger delay={0} closeDelay={0} render={<a className="built-card" href={href} target="_blank" rel="noopener noreferrer" />}>{content}</Tooltip.Trigger><Tooltip.Portal><Tooltip.Positioner className="built-domain-positioner" side="bottom" align="start" sideOffset={({ positioner }) => 9 - positioner.height / 2} alignOffset={-18} collisionPadding={12}><Tooltip.Popup className="built-domain"><span>{domain}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 18 17.414 6.586M6 6h10a2 2 0 0 1 2 2v10" /></svg></Tooltip.Popup></Tooltip.Positioner></Tooltip.Portal></Tooltip.Root>;
}
