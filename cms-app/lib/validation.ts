import { z } from 'zod';
export function checkOrigin(origin: string | null, baseUrl: string) { try { return origin === new URL(baseUrl).origin; } catch { return false; } }
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const item = z.object({ id: z.string(), src: z.string(), name: z.string().optional(), kind: z.enum(['image','video']).optional() });
const visual = z.object({ mode: z.enum(['photo','video','mockup']), motion: z.enum(['static','animated']), mockupId: z.string(), source: item.optional(), screens: z.array(item).max(6), hiddenScreens: z.array(item).max(100).optional(), background: z.object({ mode: z.enum(['photo','video']), source: item.optional() }) });
const color = z.string().regex(/^#[a-fA-F0-9]{6}$/);
const callout = z.object({ icon: z.string(), title: z.string(), color, backgroundOpacity: z.string().regex(/^(?:[0-9]|[1-9][0-9]|100)%$/) });
export const calloutsSchema = z.object({ hypothesis: callout, test: callout, custom: z.array(callout.extend({ id })).max(100).optional() });
export const mockupsSchema = z.array(z.object({ id, name: z.string(), frame: z.string(), device: z.enum(['phone','laptop','tablet','other']).optional(), width: z.number().positive(), height: z.number().positive(), screenWidth: z.number().positive(), screenHeight: z.number().positive(), insetX: z.number().min(0).max(100), insetY: z.number().min(0).max(100), insetWidth: z.number().min(0).max(100), insetHeight: z.number().min(0).max(100), radius: z.number().min(0).max(100) })).max(100);
export const profileSchema = z.object({ name: z.string(), role: z.string(), sections: z.array(z.object({ label: z.string(), text: z.string() })).max(100) });
export const caseSchema = z.object({ title: z.string(), status: z.enum(['published','pending']), order: z.number(), layout: z.enum(['savings','standard']), coverMedia: visual.optional(), heroMedia: visual.optional(), sections: z.array(z.object({ type: z.enum(['text','solution','image','context','result','gallery']), media: visual.optional(), notes: z.array(z.object({ id: z.string(), templateId: id, text: z.string(), enabled: z.boolean().optional(), position: z.enum(['before','after']) })).max(100).optional() }).passthrough()).max(200) }).passthrough();
export const assetPath = /^public\/assets\/cms-[a-f0-9-]{36}\.(?:png|jpe?g|webp|avif|gif|mp4|webm)$/;
export const publicationSchema = z.object({ revision: z.string().regex(/^[a-f0-9]{40}$/), view: id, documents: z.record(z.unknown()), assets: z.array(z.object({ path: z.string().regex(assetPath), sha: z.string().regex(/^[a-f0-9]{40}$/) })).max(100) });
export function validateDocuments(view: string, documents: Record<string, unknown>) {
 const allowed: Record<string, z.ZodTypeAny> = view === 'profile' ? { 'content/profile.json': profileSchema } : view === 'callouts' ? { 'content/callouts.json': calloutsSchema } : view === 'mockups' ? { 'content/mockups.json': mockupsSchema } : { [`content/cases/${view}.json`]: caseSchema, 'content/callouts.json': calloutsSchema, 'content/mockups.json': mockupsSchema };
 const entries = Object.entries(documents);
 const primary = view === 'profile' ? 'content/profile.json' : view === 'callouts' ? 'content/callouts.json' : view === 'mockups' ? 'content/mockups.json' : `content/cases/${view}.json`;
 if (!documents[primary] || entries.some(([path]) => !allowed[path])) throw new Error('Недопустимый путь документа.');
 return Object.fromEntries(entries.map(([path, value]) => [path, allowed[path].parse(value)]));
}
