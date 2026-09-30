'use client';
import { useState, useEffect } from 'react';
import { createAuthClient } from 'better-auth/react';
const client = createAuthClient();
export default function SignIn() {
 const [busy, setBusy] = useState(false), [error, setError] = useState('');
 useEffect(() => { if (new URLSearchParams(window.location.search).has('error')) setError('Не удалось войти этим аккаунтом.'); }, []);
 return <div className="cms-sign-in"><div><h1>Портфолио / CMS</h1><button className="cms-primary-action" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { const result = await client.signIn.social({ provider: 'github', callbackURL: '/admin', errorCallbackURL: '/sign-in?error=1' }); if (result.error) { setError('Не удалось войти.'); setBusy(false); } } catch { setError('Не удалось войти.'); setBusy(false); } }}>{busy ? 'Открываю GitHub…' : 'Войти через GitHub'}</button>{error && <p className="field-error">{error || 'Не удалось войти этим аккаунтом.'}</p>}</div></div>;
}
