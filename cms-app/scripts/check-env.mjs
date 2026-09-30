const required = ['BASE_URL','DATABASE_URL','BETTER_AUTH_SECRET','GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET'];
for (const key of required) if (!process.env[key]?.trim()) throw new Error(`${key} is required`);
if (process.env.BETTER_AUTH_SECRET.length < 32) throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters');
const base = new URL(process.env.BASE_URL);
if (base.protocol !== 'https:' && base.hostname !== 'localhost' && base.hostname !== '127.0.0.1') throw new Error('BASE_URL must use HTTPS');
