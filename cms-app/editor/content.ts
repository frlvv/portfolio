import profile from '../content/profile.json';
import calloutStyles from '../content/callouts.json';
import templates from '../content/mockups.json';
import type { CalloutLibrary, CalloutNote } from './calloutTypes';
import type { MediaSpec, MockupTemplate } from './mediaTypes';

export type ProfileSection = { label: string; text: string };
export type Profile = { name: string; role: string; sections: ProfileSection[] };
export type CaseSection = {
  type: 'text' | 'solution' | 'image' | 'context' | 'result' | 'gallery';
  heading?: string;
  body?: string;
  callout?: string;
  image?: string;
  visual?: 'hub' | 'type' | 'plan' | 'goal' | 'change' | 'quick';
  hypothesis?: string;
  test?: string;
  showHypothesis?: boolean;
  showTest?: boolean;
  mediaMode?: 'photo' | 'mockup';
  items?: { image: string; label?: string }[];
  media?: MediaSpec;
  enabled?: boolean;
  showMedia?: boolean;
  notes?: CalloutNote[];
};
export type PortfolioCase = {
  id: string;
  title: string;
  heading: string;
  status: 'published' | 'pending';
  order: number;
  layout: 'savings' | 'standard';
  cover?: string;
  hero?: string;
  coverMedia?: MediaSpec;
  heroMedia?: MediaSpec;
  about?: string;
  year?: string;
  platform?: string;
  role?: string;
  slides?: { image: string; label?: string }[];
  sections: CaseSection[];
};

export const profileContent = profile as Profile;
export const solutionCallouts = calloutStyles as CalloutLibrary;
export const mockupTemplates = templates as MockupTemplate[];

import case0 from '../content/cases/savings.json';
import case1 from '../content/cases/capsule.json';
export const cases = [{ ...case0, id: 'savings' },{ ...case1, id: 'capsule' }] as PortfolioCase[];

export const media = (path?: string) => {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  if (/^(blob:|data:)/.test(path)) return path;
  return `https://raw.githubusercontent.com/frlvv/portfolio/main/public/${path.replace(/^\/?(?:portfolio\/)?/, '')}`;
};
