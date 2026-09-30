import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { checkOrigin } from '@/lib/validation';
export async function POST(request: Request) {
 if (!checkOrigin(request.headers.get('origin'), process.env.BASE_URL!)) return new Response(null, { status: 403 });
 const response = await auth.api.signOut({ headers: await headers(), asResponse: true });
 const result = new Response(null, { status: 303, headers: { Location: '/sign-in' } });
 for (const cookie of response.headers.getSetCookie()) result.headers.append('Set-Cookie', cookie);
 return result;
}
