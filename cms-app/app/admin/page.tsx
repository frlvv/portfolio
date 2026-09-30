import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { isAllowedUser } from '@/lib/access';
import Editor from '@/editor/cms/Editor';
export const dynamic = 'force-dynamic';
export default async function Page() {
 const session = await auth.api.getSession({ headers: await headers() });
 if (!session?.user) redirect('/sign-in');
 if (!await isAllowedUser(session.user.id)) return <div className="cms-loading">Доступ закрыт</div>;
 return <Editor />;
}
