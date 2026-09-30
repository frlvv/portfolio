import type { Octokit } from '@octokit/rest';
import { HttpError } from './errors';
export const repository = { owner: process.env.PORTFOLIO_OWNER || 'frlvv', repo: process.env.PORTFOLIO_REPO || 'portfolio' };
export const branch = process.env.PORTFOLIO_BRANCH || 'main';
export async function head(octokit: Octokit) { return (await octokit.rest.git.getRef({ ...repository, ref: `heads/${branch}` })).data.object.sha; }
export async function commitDocuments(octokit: Octokit, revision: string, view: string, documents: Record<string, unknown>, assets: { path: string; sha: string }[]) {
 if (await head(octokit) !== revision) throw new HttpError('На GitHub появились изменения. Сохрани ZIP черновика и загрузи актуальную версию.', 409);
 const parent = (await octokit.rest.git.getCommit({ ...repository, commit_sha: revision })).data;
 const entries = Object.entries(documents).map(([path, value]) => ({ path, mode: '100644' as const, type: 'blob' as const, content: JSON.stringify(value, null, 2) + '\n' }));
 const tree = (await octokit.rest.git.createTree({ ...repository, base_tree: parent.tree.sha, tree: [...entries, ...assets.map(asset => ({ ...asset, mode: '100644' as const, type: 'blob' as const }))] })).data;
 if (tree.sha === parent.tree.sha) return { revision, changed: false };
 const commit = (await octokit.rest.git.createCommit({ ...repository, tree: tree.sha, parents: [revision], message: `Update ${view} from portfolio CMS` })).data;
 await octokit.rest.git.updateRef({ ...repository, ref: `heads/${branch}`, sha: commit.sha, force: false });
 return { revision: commit.sha, changed: true };
}
