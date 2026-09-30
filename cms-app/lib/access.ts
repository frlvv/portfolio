import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { account } from '@/db/schema';
import { auth } from './auth';
import { headers } from 'next/headers';
import { Octokit } from '@octokit/rest';
import { checkOrigin } from './validation';
import { HttpError } from './errors';
export { HttpError } from './errors';
async function allowedAccount(userId: string) {
 const github = await db.query.account.findFirst({ where: and(eq(account.userId, userId), eq(account.providerId, 'github')) });
 return github?.accountId === (process.env.ALLOWED_GITHUB_USER_ID || '156184086') ? github : undefined;
}
export async function isAllowedUser(userId: string) { return Boolean(await allowedAccount(userId)); }
export async function requirePortfolioAccess(request?: Request) {
 if (request && request.method !== 'GET' && !checkOrigin(request.headers.get('origin'), process.env.BASE_URL!)) throw new HttpError('Недопустимый запрос.', 403);
 const requestHeaders = await headers(), session = await auth.api.getSession({ headers: requestHeaders });
 if (!session?.user) throw new HttpError('Нужно войти через GitHub.', 401);
 const github = await allowedAccount(session.user.id);
 if (!github) throw new HttpError('Доступ закрыт.', 403);
 const result = await auth.api.getAccessToken({ headers: requestHeaders, body: { accountId: github.id } });
 if (!result.accessToken) throw new HttpError('Войди через GitHub ещё раз.', 401);
 return new Octokit({ auth: result.accessToken });
}
export function errorResponse(error: unknown) {
 if (error instanceof HttpError) return Response.json({ message: error.message }, { status: error.status });
 if (error && typeof error === 'object' && 'status' in error && [401,403,409,422,429].includes(Number(error.status))) return Response.json({ message: Number(error.status) === 409 || Number(error.status) === 422 ? 'На GitHub появились изменения. Загрузи актуальную версию или сохрани ZIP своего черновика.' : 'GitHub отклонил запрос. Проверь доступ или попробуй позже.' }, { status: Number(error.status) === 422 ? 409 : Number(error.status) });
 return Response.json({ message: 'Не удалось выполнить запрос. Попробуй ещё раз.' }, { status: 500 });
}
