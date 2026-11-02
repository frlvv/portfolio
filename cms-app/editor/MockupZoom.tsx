import { useState, type CSSProperties, type ReactNode } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import './mockup-zoom.css';

type ZoomItem = { id: string; content: ReactNode };
export default function MockupZoom({ title = 'Мокапы', ratio, items, children }: { title?: string; ratio: number; items: ZoomItem[]; children: (open: (index: number) => void) => ReactNode }) {
  const [selected, setSelected] = useState<number | null>(null);
  const current = selected ?? 0;
  const device = (item: ZoomItem) => <div className="mockup-zoom-content" style={{ aspectRatio: ratio }}>{item.content}</div>;
  return <Dialog.Root modal="trap-focus" open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}>
    {children(index => { if (items[index]) setSelected(index); })}
    <Dialog.Portal><Dialog.Backdrop className="mockup-zoom-backdrop" /><Dialog.Popup className="mockup-zoom-popup" onKeyDown={event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); event.stopPropagation(); setSelected((current + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length); }
    }}>
      <header className="mockup-zoom-heading"><Dialog.Title>{title || 'Мокапы'}</Dialog.Title><Dialog.Close className="mockup-zoom-close" aria-label="Закрыть"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg></Dialog.Close></header>
      <div className="mockup-zoom-stage" style={{ '--zoom-ratio': ratio } as CSSProperties}>
        <div className="mockup-zoom-side">{items.slice(0, current).map((item, index) => <button type="button" className="mockup-zoom-thumb" onClick={() => setSelected(index)} aria-label={`${index + 1}`} key={item.id}>{device(item)}</button>)}</div>
        {items[current] && <button type="button" className="mockup-zoom-main" onClick={() => setSelected(null)} aria-label="Уменьшить" key={items[current].id}>{device(items[current])}</button>}
        <div className="mockup-zoom-side mockup-zoom-side-right">{items.slice(current + 1).map((item, index) => <button type="button" className="mockup-zoom-thumb" onClick={() => setSelected(current + 1 + index)} aria-label={`${current + 2 + index}`} key={item.id}>{device(item)}</button>)}</div>
      </div>
      {items.length > 1 && <div className="mockup-zoom-navigation"><button type="button" onClick={() => setSelected((current - 1 + items.length) % items.length)} aria-label="Предыдущий">←</button><span>{current + 1} / {items.length}</span><button type="button" onClick={() => setSelected((current + 1) % items.length)} aria-label="Следующий">→</button></div>}
    </Dialog.Popup></Dialog.Portal>
  </Dialog.Root>;
}
