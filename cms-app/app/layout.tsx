import type { Metadata } from 'next';
import '@fontsource-variable/golos-text';
import '../editor/cms/editor.css';

export const metadata: Metadata = { title: 'Портфолио / CMS', robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="ru"><body>{children}</body></html>; }
