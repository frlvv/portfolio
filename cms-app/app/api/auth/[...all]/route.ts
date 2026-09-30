import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
const handler = toNextJsHandler(auth);
function blocked(request: Request) { return ['/get-access-token', '/refresh-token'].some(path => new URL(request.url).pathname.endsWith(path)); }
export const GET = (request: Request) => blocked(request) ? new Response(null, { status: 404 }) : handler.GET(request);
export const POST = (request: Request) => blocked(request) ? new Response(null, { status: 404 }) : handler.POST(request);
