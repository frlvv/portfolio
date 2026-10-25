export class SaveConflictError extends Error {
 constructor(message: string, public revision: string) { super(message); }
}
export class CmsSignInError extends Error {
 constructor(public provider: 'netlify' | 'github') { super(provider === 'netlify' ? 'Сеанс Netlify закончился. Войди снова — черновик останется в браузере.' : 'Войди в CMS ещё раз. Черновик останется в браузере.'); }
}
export async function readApiResponse<T>(response: Response): Promise<T> {
 const text = await response.text();
 let result: Record<string, unknown>;
 try { result = JSON.parse(text); }
 catch {
  if (response.status === 401 || text.includes('Login Redirect') || text.includes('edge-access')) throw new CmsSignInError('netlify');
  if (response.status === 413) throw new Error('Сервер отклонил слишком большой файл. Уменьши размер или скачай ZIP.');
  throw new Error(`Сервер CMS вернул некорректный ответ (${response.status}). Попробуй сохранить ещё раз.`);
 }
 if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('Сервер CMS вернул некорректный ответ.');
 if (response.status === 401) throw new CmsSignInError('github');
 const message = typeof result.message === 'string' ? result.message : 'Не удалось выполнить запрос.';
 if (response.status === 409 && typeof result.revision === 'string' && /^[a-f0-9]{40}$/.test(result.revision)) throw new SaveConflictError(message, result.revision);
 if (!response.ok) throw new Error(message);
 return result as T;
}
export async function apiRequest<T>(path: string, body?: unknown): Promise<T> {
 let response: Response;
 try { response = await fetch(new URL(path, window.location.origin), { cache: 'no-store', credentials: 'same-origin', ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) }); }
 catch { throw new Error('Нет соединения с CMS. Проверь подключение и попробуй сохранить ещё раз. Черновик остаётся в браузере.'); }
 return readApiResponse<T>(response);
}
