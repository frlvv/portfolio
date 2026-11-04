type Metrica = ((...args: unknown[]) => void) & {
  a?: unknown[][];
  l?: number;
};

declare global {
  interface Window {
    ym?: Metrica;
  }
}

const counterId = 114072118;
let initialized = false;
let lastPage = '';

export function startAnalytics() {
  if (initialized || location.hostname !== 'frlvv.github.io' || !location.pathname.startsWith('/portfolio/')) return;
  initialized = true;

  const queue: Metrica = (...args) => {
    (queue.a ??= []).push(args);
  };
  queue.l = Date.now();
  window.ym ??= queue;
  window.ym(counterId, 'init', {
    defer: true,
    accurateTrackBounce: true,
    trackLinks: true,
    clickmap: false,
    webvisor: false,
    disableYtm: true,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://mc.yandex.ru/metrika/tag.js';
  document.head.append(script);
}

export function trackPage(title: string) {
  if (!initialized) return false;
  const page = location.origin + location.pathname + location.search;
  if (page === lastPage) return false;
  window.ym?.(counterId, 'hit', page, {
    title,
    referer: lastPage || document.referrer,
  });
  lastPage = page;
  return true;
}

export function trackGoal(goal: string, params?: Record<string, string>) {
  if (initialized) window.ym?.(counterId, 'reachGoal', goal, params);
}
