import type { ReactNode } from 'react';
import type { CaseSection } from './content';
import './task-callout.css';

export const defaultTaskStyle = { icon: '☝️', color: '#F9C02F', backgroundOpacity: '16%' };

export default function TaskCallout({ section, children }: { section: CaseSection; children?: ReactNode }) {
  if (section.showCallout === false || (!section.callout && !children)) return null;
  const style = { ...defaultTaskStyle, ...section.calloutStyle };
  return <div className="task-callout" style={{ background: `color-mix(in srgb, ${style.color} ${style.backgroundOpacity}, transparent)` }}><span className="task-callout-icon">{style.icon}</span><div className="task-callout-text">{children ?? section.callout}</div></div>;
}
