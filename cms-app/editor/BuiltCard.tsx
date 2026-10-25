import type { PortfolioBuild } from './content';
import { media } from './content';
import './built.css';

export function buildHref(value: string) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}

export default function BuiltCard({ item, resolve = media, interactive = true }: { item: PortfolioBuild; resolve?: (src?: string) => string; interactive?: boolean }) {
  const href = buildHref(item.url);
  const content = <>{item.icon ? <img className="built-icon" src={resolve(item.icon)} alt="" width={48} height={48} draggable={false} /> : <span className="built-icon built-initial" aria-hidden="true">{item.name.slice(0, 1)}</span>}<span className="built-copy"><span className="built-name">{item.name}</span>{item.description && <span className="built-description">{item.description}</span>}</span>{href && <span className="built-arrow" aria-hidden="true">↗</span>}</>;
  return interactive && href ? <a className="built-card" href={href} target="_blank" rel="noopener noreferrer">{content}</a> : <div className="built-card">{content}</div>;
}
