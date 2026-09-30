import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';
export const auth = betterAuth({
 baseURL: process.env.BASE_URL,
 secret: process.env.BETTER_AUTH_SECRET,
 database: drizzleAdapter(db, { provider: 'pg', schema }),
 account: { encryptOAuthTokens: true, accountLinking: { enabled: false } },
 socialProviders: { github: {
  clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  getUserInfo: async token => {
   const headers = { Authorization: `Bearer ${token.accessToken}`, 'User-Agent': 'Portfolio-CMS', Accept: 'application/vnd.github+json' };
   const response = await fetch('https://api.github.com/user', { headers });
   if (!response.ok) return null;
   const profile = await response.json();
   if (String(profile.id) !== (process.env.ALLOWED_GITHUB_USER_ID || '156184086')) return null;
   const emailsResponse = await fetch('https://api.github.com/user/emails', { headers });
   if (!emailsResponse.ok) return null;
   const emails: { email: string; primary: boolean; verified: boolean }[] = await emailsResponse.json();
   const email = emails.find(item => item.primary && item.verified) ?? emails.find(item => item.verified);
   if (!email) return null;
   return { user: { name: profile.name || profile.login, email: email.email, emailVerified: true, image: profile.avatar_url }, data: profile };
  }
 } },
 session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
});
