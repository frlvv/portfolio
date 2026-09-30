import { errorResponse, HttpError, requirePortfolioAccess } from '@/lib/access';
import { branch, head, repository, commitDocuments } from '@/lib/repository';
import { publicationSchema, validateDocuments } from '@/lib/validation';
export const dynamic = 'force-dynamic';
export async function GET() {
 try {
  const octokit = await requirePortfolioAccess(), revision = await head(octokit);
  const commit = (await octokit.rest.git.getCommit({ ...repository, commit_sha: revision })).data;
  const tree = (await octokit.rest.git.getTree({ ...repository, tree_sha: commit.tree.sha, recursive: '1' })).data;
  if (tree.truncated) throw new HttpError('Не удалось прочитать полный список файлов.', 503);
  const paths = tree.tree.filter(item => item.type === 'blob' && item.sha && item.path && (/^content\/cases\/[a-zA-Z0-9_-]+\.json$/.test(item.path) || ['content/profile.json','content/callouts.json','content/mockups.json'].includes(item.path)));
  if (paths.length > 203) throw new HttpError('Слишком много кейсов.', 400);
  const documents = Object.fromEntries(await Promise.all(paths.map(async item => { const blob = (await octokit.rest.git.getBlob({ ...repository, file_sha: item.sha! })).data; return [item.path!, JSON.parse(Buffer.from(blob.content, 'base64').toString('utf8'))] as [string, Record<string, unknown>]; })));
  const state = { version: 1, cases: Object.entries(documents).filter(([path]) => path.startsWith('content/cases/')).map(([path, value]) => ({ ...value, order: Number(value.order), id: path.split('/').pop()!.slice(0,-5) })).sort((a,b) => Number(a.order)-Number(b.order)), profile: documents['content/profile.json'], callouts: documents['content/callouts.json'], templates: documents['content/mockups.json'] };
  return Response.json({ revision, state }, { headers: { 'Cache-Control':'no-store' } });
 } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
 try {
  const octokit = await requirePortfolioAccess(request);
  const raw = await request.text();
  if (raw.length > 1_000_000) throw new HttpError('Слишком много текста в одном сохранении.', 413);
  const result = publicationSchema.safeParse(JSON.parse(raw));
  if (!result.success) throw new HttpError('Не удалось проверить данные.', 400);
  const { revision, view, assets } = result.data;
  let documents;
  try { documents = validateDocuments(view, result.data.documents); } catch { throw new HttpError('В полях есть некорректные значения.', 400); }
  return Response.json(await commitDocuments(octokit, revision, view, documents, assets));
 } catch (error) { return errorResponse(error); }
}
