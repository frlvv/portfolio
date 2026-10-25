import type { Octokit } from '@octokit/rest';
import { createHash } from 'node:crypto';
import { HttpError } from './errors';
export const repository = { owner: process.env.PORTFOLIO_OWNER || 'frlvv', repo: process.env.PORTFOLIO_REPO || 'portfolio' };
export const branch = process.env.PORTFOLIO_BRANCH || 'main';
export class PublicationConflict extends HttpError {
 constructor(public revision: string, public paths: string[]) { super('Этот раздел изменён на GitHub. Проверь свои правки перед сохранением поверх новой версии.', 409); }
}
export async function head(octokit: Octokit) { return (await octokit.rest.git.getRef({ ...repository, ref: `heads/${branch}` })).data.object.sha; }
const contentHash = (content: string) => createHash('sha1').update(`blob ${Buffer.byteLength(content)}\0`).update(content).digest('hex');
export async function commitDocuments(octokit: Octokit, revision: string, view: string, documents: Record<string, unknown>, assets: { path: string; sha: string }[]) {
 const current = await head(octokit);
 const parent = (await octokit.rest.git.getCommit({ ...repository, commit_sha: current })).data;
 const entries = Object.entries(documents).map(([path, value]) => ({ path, mode: '100644' as const, type: 'blob' as const, content: JSON.stringify(value, null, 2) + '\n' }));
 if (current !== revision) {
  const previous = (await octokit.rest.git.getCommit({ ...repository, commit_sha: revision })).data;
  const trees = await Promise.all([previous.tree.sha, parent.tree.sha].map(tree_sha => octokit.rest.git.getTree({ ...repository, tree_sha, recursive: '1' })));
  if (trees.some(tree => tree.data.truncated)) throw new HttpError('Не удалось проверить актуальную версию. Попробуй ещё раз.', 503);
  const [before, after] = trees.map(tree => new Map(tree.data.tree.filter(item => item.type === 'blob').map(item => [item.path, item.sha])));
  const changes = [...entries.map(entry => ({ path: entry.path, sha: contentHash(entry.content) })), ...assets];
  const conflicts = changes.filter(entry => before.get(entry.path) !== after.get(entry.path) && entry.sha !== after.get(entry.path)).map(entry => entry.path);
  if (conflicts.length) throw new PublicationConflict(current, conflicts);
 }
 const tree = (await octokit.rest.git.createTree({ ...repository, base_tree: parent.tree.sha, tree: [...entries, ...assets.map(asset => ({ ...asset, mode: '100644' as const, type: 'blob' as const }))] })).data;
 if (tree.sha === parent.tree.sha) return { revision: current, changed: false };
 const commit = (await octokit.rest.git.createCommit({ ...repository, tree: tree.sha, parents: [current], message: `Update ${view} from portfolio CMS` })).data;
 await octokit.rest.git.updateRef({ ...repository, ref: `heads/${branch}`, sha: commit.sha, force: false });
 return { revision: commit.sha, changed: true };
}
