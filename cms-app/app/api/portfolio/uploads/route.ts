import { errorResponse, HttpError, requirePortfolioAccess } from '@/lib/access';
import { repository } from '@/lib/repository';
import { assetPath } from '@/lib/validation';
export async function POST(request: Request) {
 try {
  const octokit = await requirePortfolioAccess(request);
  const raw = await request.text();
  if (raw.length > 5_000_000) throw new HttpError('Файл слишком большой. Максимум — 3,5 МБ.', 413);
  const { path, content } = JSON.parse(raw);
  if (typeof path !== 'string' || !assetPath.test(path) || typeof content !== 'string' || !/^[a-zA-Z0-9+/]*={0,2}$/.test(content) || !content.length) throw new HttpError('Недопустимый файл.', 400);
  const bytes = Buffer.from(content, 'base64');
  if (bytes.length > 3_500_000) throw new HttpError('Файл слишком большой. Максимум — 3,5 МБ.', 413);
  const blob = (await octokit.rest.git.createBlob({ ...repository, content, encoding: 'base64' })).data;
  return Response.json({ path, sha: blob.sha });
 } catch (error) { return errorResponse(error); }
}
