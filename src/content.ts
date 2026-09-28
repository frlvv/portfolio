import profile from '../content/profile.json';
import calloutStyles from '../content/callouts.json';
import updatedProjects from './generated/project-updated.json';

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
  about?: string;
  year?: string;
  platform?: string;
  role?: string;
  slides?: { image: string; label?: string }[];
  sections: CaseSection[];
};

export const profileContent = profile as Profile;
export const solutionCallouts = calloutStyles as {
  hypothesis: { icon: string; title: string; color: string; backgroundOpacity: string };
  test: { icon: string; title: string; color: string; backgroundOpacity: string };
};
export const projectUpdated = updatedProjects as Record<string, string>;

const files = import.meta.glob('../content/cases/*.json', { eager: true, import: 'default' });
export const cases = Object.entries(files)
  .map(([path, value]) => ({ ...(value as PortfolioCase), id: path.split('/').pop()!.replace('.json', '') }))
  .sort((a, b) => a.order - b.order);

export const media = (path?: string) => {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/?(?:portfolio\/)?/, '')}`;
};
