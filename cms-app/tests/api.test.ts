import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readApiResponse, CmsSignInError, SaveConflictError } from '../editor/cms/api';
test('expired Netlify access shows a sign-in action instead of a JSON parsing error', async () => {
 await assert.rejects(readApiResponse(new Response('<html><title>Login Redirect</title></html>', {status:401})), error => error instanceof CmsSignInError && error.provider === 'netlify');
});
test('CMS session expiry and document conflicts keep their recovery actions', async () => {
 await assert.rejects(readApiResponse(Response.json({message:'Нужно войти'},{status:401})), error => error instanceof CmsSignInError && error.provider === 'github');
 await assert.rejects(readApiResponse(Response.json({message:'Конфликт',revision:'a'.repeat(40)},{status:409})), error => error instanceof SaveConflictError && error.revision === 'a'.repeat(40));
});
test('server HTML errors are readable while valid publication results pass through', async () => {
 await assert.rejects(readApiResponse(new Response('<h1>Bad Gateway</h1>',{status:502})), /Сервер CMS.*502/);
 assert.deepEqual(await readApiResponse(Response.json({revision:'a'.repeat(40),changed:true})), {revision:'a'.repeat(40),changed:true});
});
