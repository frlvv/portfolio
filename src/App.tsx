import React, { CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import Lenis from 'lenis';

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;
const caseTitle = 'Переосмысление опыта накопления в Т-Банке';

function useSmoothScroll(blocked = false, wrapper?: React.RefObject<HTMLDivElement | null>, content?: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let lenis: Lenis | undefined;
    const setup = () => {
      lenis?.destroy();
      if (preference.matches || blocked || (wrapper && !wrapper.current)) return;
      lenis = new Lenis({ wrapper: wrapper?.current ?? window, content: content?.current ?? document.documentElement, autoRaf: true, smoothWheel: true, syncTouch: false, lerp: 0.2, overscroll: false });
    };
    setup();
    preference.addEventListener('change', setup);
    return () => { lenis?.destroy(); preference.removeEventListener('change', setup); };
  }, [blocked, wrapper, content]);
}

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return <img className="icon" src={asset(`${name}.svg`)} width={size} height={size} alt="" draggable="false" />;
}

function MicroMorph({ children }: { children: string }) {
  return <span className="micro-morph" key={children}>{[...children].map((letter, index) => <span className="micro-morph-letter" style={{ '--letter-index': index } as CSSProperties} key={`${children}-${index}`}>{letter === ' ' ? '\u00a0' : letter}</span>)}</span>;
}

function Cover() {
  return <div className="cover">
    <img className="cover-background" src={asset('background.png')} alt="" draggable="false" />
    <img className="cover-phone cover-phone-first" src={asset('savings-hub.png')} alt="" draggable="false" />
    <img className="cover-phone cover-phone-second" src={asset('savings-goal.png')} alt="" draggable="false" />
  </div>;
}

function HeroCover() {
  return <div className="hero-cover">
    <img className="visual-background" src={asset('case-bg.png')} alt="" draggable="false" />
    <div className="hero-phone hero-phone-first"><img src={asset('hero-hub.png')} alt="" draggable="false" /></div>
    <div className="hero-phone hero-phone-second"><img src={asset('hero-goal.png')} alt="" draggable="false" /></div>
  </div>;
}

type VisualKind = 'hub' | 'type' | 'plan' | 'goal' | 'change' | 'quick';
const visualPhones: Record<VisualKind, string[]> = {
  hub: ['hero-hub.png'], type: ['type-goal.png'], plan: ['amount.png', 'plan.png', 'no-plan.png'], goal: ['screen-goal.png'], change: ['plan-overview.png', 'plan-adjust.png'], quick: ['quick-amount.png', 'quick-plan.png', 'quick-hold.png'],
};

function CaseVisual({ kind }: { kind: VisualKind }) {
  return <div className={`case-visual visual-${kind}`}>
    <img className="visual-background" src={asset('case-bg.png')} alt="" draggable="false" loading="lazy" />
    {visualPhones[kind].map((file, index) => <div className={`visual-phone visual-phone-${index + 1}`} key={file}><img src={asset(file)} alt="" draggable="false" loading="lazy" /></div>)}
  </div>;
}

function ContactContent() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const [hovered, setHovered] = useState<'email' | 'telegram' | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText('v@frlvv.ru');
      setError(false); setCopied(true); clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2400);
    } catch { setError(true); }
  }
  return <>
    <div className="contact-heading"><Dialog.Title>Contact</Dialog.Title><Dialog.Close className="contact-close" aria-label="Закрыть"><Icon name="close" size={24} /></Dialog.Close></div>
    <Dialog.Description className="sr-only">Контакты</Dialog.Description>
    <div className="contact-links">
      <button className={`contact-row${copied ? ' is-copied' : ''}`} onClick={copyEmail} onMouseEnter={() => setHovered('email')} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered('email')} onBlur={() => setHovered(null)} aria-label="Email"><Icon name="email" size={20} /><span className="contact-label"><span>Email</span><span>v@frlvv.ru</span></span><span className="contact-action" aria-live="polite"><MicroMorph>{copied ? '🎉 copied' : hovered === 'email' ? 'copy' : ''}</MicroMorph></span></button>
      <a className="contact-row" href="https://t.me/vf433" target="_blank" rel="noreferrer" onMouseEnter={() => setHovered('telegram')} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered('telegram')} onBlur={() => setHovered(null)} aria-label="Telegram"><Icon name="telegram" size={20} /><span className="contact-label"><span>Telegram</span><span>vf433</span></span><span className="contact-action"><MicroMorph>{hovered === 'telegram' ? 'go' : ''}</MicroMorph></span></a>
    </div>
    {error && <p className="copy-error" role="status">Не удалось скопировать. <a href="mailto:v@frlvv.ru">v@frlvv.ru</a></p>}
  </>;
}

function ImageSlider() {
  const [active, setActive] = useState(0);
  const pointer = useRef<{ id: number; x: number; y: number; target: number | null } | null>(null);
  const suppressClick = useRef(false);
  const items = [{ file: 'current-home.png', alt: 'Главная Т-Банка со счетами' }, { file: 'current-account.png', alt: 'Экран накопительного счёта' }];
  const change = (index: number) => setActive((index + items.length) % items.length);
  return <div className="image-slider" role="region" aria-label="Интерфейс до редизайна">
    <div className="image-stack" tabIndex={0} onKeyDown={event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); change(active + (event.key === 'ArrowRight' ? 1 : -1)); }
    }} onPointerDown={event => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      const slide = (event.target as HTMLElement).closest<HTMLButtonElement>('.stack-slide');
      pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, target: slide ? Number(slide.dataset.index) : null };
      suppressClick.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerUp={event => {
      const start = pointer.current; if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
        change(active + (dx < 0 ? 1 : -1));
        suppressClick.current = true;
      } else {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const pressedBackPhoto = (active === 0 && x > 0.82) || (active === 1 && x < 0.18);
        if (pressedBackPhoto) {
          change(active + 1);
          suppressClick.current = true;
        } else if (start.target !== null && start.target !== active) {
          change(start.target);
          suppressClick.current = true;
        }
      }
      pointer.current = null;
    }} onPointerCancel={() => { pointer.current = null; }}>
      {items.map((item, index) => <button key={item.file} data-index={index} className={`stack-slide ${index === active ? 'is-front' : 'is-back'} ${index === 0 ? 'stack-home' : 'stack-account'}`} onClick={() => {
        if (suppressClick.current) { suppressClick.current = false; return; } change(index);
      }} aria-label={item.alt} aria-current={index === active ? 'true' : undefined}><img src={asset(item.file)} alt="" draggable="false" loading="lazy" /></button>)}
      <button className={`back-photo-hit back-photo-hit-${active}`} onClick={() => {
        if (suppressClick.current) { suppressClick.current = false; return; }
        change(active + 1);
      }} aria-label="Заднее фото" />
    </div>
    <div className="slider-controls"><button onClick={() => change(active - 1)} aria-label="Предыдущая">←</button><div className="slider-dots">{items.map((item, index) => <button key={item.file} className={active === index ? 'is-active' : ''} onClick={() => change(index)} aria-label={`${index + 1}`} aria-pressed={active === index}><span /></button>)}</div><button onClick={() => change(active + 1)} aria-label="Следующая">→</button></div>
  </div>;
}

function Solution({ title, kind, children }: { title: React.ReactNode; kind: VisualKind; children: React.ReactNode }) {
  return <div className="solution-block"><div className="solution-copy"><h3>{title}</h3><div className="body-copy">{children}</div></div><CaseVisual kind={kind} /></div>;
}

function CaseContent() {
  return <article className="case-article">
    <header className="case-intro">
      <Dialog.Title>Копилка Т-Банка</Dialog.Title>
      <div className="case-about"><p className="eyebrow">О проекте</p><Dialog.Description className="body-copy">Копилка – это переосмысление опыта накоплений в приложении Т-Банка. В рамках кейса я разобрал текущий сценарий использования копилки, изучил пользовательские привычки и проблемы, сформулировал продуктовые гипотезы и на их основе спроектировал обновлённый флоу создания и управления накоплениями.</Dialog.Description></div>
      <dl className="case-facts"><div><dt>Год</dt><dd>2026</dd></div><div><dt>Платформа</dt><dd>Mobile App, iOS</dd></div><div><dt>Роль в проекте</dt><dd>Product Design, UX/UI, Research, IA, Prototyping, Motion, Usability Testing</dd></div></dl>
    </header>
    <HeroCover />
    <section className="case-section text-section"><h2>Задача</h2><p className="callout"><span>☝️</span>Сделать накопления ближе к жизни человека</p><div className="body-copy"><p>Я интерпретировал данную задачу не только как визуальный апгрейд (сделать интерфейс чище и динамичнее), а в первую очередь через изменение продуктовой логики.</p><p>Накопления не всегда идут по первоначальному графику. Могут появиться срочные расходы, измениться доход или приоритеты. В таких ситуациях человеку нужен понятный способ продолжить.</p></div></section>
    <section className="case-section context-section"><div><h2>Контекст</h2><div className="body-copy"><p>Сейчас сбережения в Т‑Банке работают через базовый накопительный счёт с начислением процентов на остаток. Счета отображаются общим списком на главном экране вперемешку с картами и другими продуктами.</p><p>Внутри счёта можно включить цель: указать итоговую сумму и дату. Интерфейс делит сумму на количество месяцев и показывает фиксированную цифру, которую нужно вносить каждый месяц. Пополнение работает стандартно — через открытие формы перевода и ручной ввод любой суммы.</p><p>Что сейчас не очень:</p><ul><li>Если пропустить пополнение или внести меньше, система не пересчитывает план, срок остаётся прежним.</li><li>Если забрать часть денег на срочные траты, прогресс-бар откатывается назад, а график не адаптируется.</li><li>Все счета выглядят одинаково. Нельзя наглядно разделить финансовую подушку, накопления на отпуск и резерв под регулярные платежи — налоги или страховку.</li><li>Чтобы закрыть норму месяца, пользователю нужно самому помнить сумму платежа и вбивать её вручную.</li></ul></div></div><ImageSlider /></section>
    <section className="case-section text-section"><h2>Исследование</h2><div className="body-copy"><p>Я начал с изучения материалов о накопительном поведении и разбора сценариев: накопление на покупку, подготовка к платежу, создание финансовой подушки, пропуски пополнений и снятие денег.</p><p>На основе этого выдвинул несколько рабочих проблем, которые впоследствии проверял через интервью.</p><p>В результате я выделил несколько инсайтов:</p><ul><li>люди используют копилки для разных задач — покупок, событий и финансового резерва;</li><li>сумму и дату часто задают от желаемого результата, не проверяя, какой регулярный взнос потребуется и подходит ли он текущему бюджету;</li><li>непредвиденные расходы меняют траекторию, но снятие не равно отказу от накопления. Люди используют накопленное в текущей жизненной ситуации и способны возвращаться к цели;</li><li>для части людей срок — больше ориентир, чем обязательство. Пропуск пополнения или перенос даты не воспринимается как провал, пока цель остаётся актуальной;</li><li>само отставание от цели не всегда означает отказ от накопления. Люди не понимают, как продолжить копить после нескольких пропущенных месяцев, и забрасывают цель, хотя она может оставаться актуальной.</li></ul></div></section>
    <section className="case-section solutions-section"><h2>Гипотезы и решения</h2>
      <Solution title="Все копилки теперь в одном месте" kind="hub"><p>Экран собирает все сбережения в одном месте и раскладывает их по задачам вместо плоского списка счетов.</p><p>Сверху отображается общий баланс и карточка с быстрыми инсайтами — доходом за месяц, серией пополнений и советами. Этот блок служит точкой входа в подробный дашборд со статистикой по всем накоплениям.</p></Solution>
      <Solution title="Выбор типа копилки" kind="type"><p>Создание копилки начинается с выбора направления: «Цель», «Подушка», «Платёж» или «Просто копить». Под каждым пунктом есть короткая подсказка, которая сразу объясняет суть формата.</p><p>Категория определяет логику дальнейшего сценария. Для «Цели» главное — итоговая стоимость покупки или отпуска. Для «Подушки» система формирует резерв на несколько месяцев и может сама рассчитать нужную сумму по истории трат клиента. «Платёж» привязывается к дате, чтобы вовремя закрыть крупные повторяющиеся расходы вроде учёбы, налогов или страховки, а «Просто копить» даёт возможность откладывать деньги без сроков и ограничений.</p><p>В проекте подробно спроектирован сценарий «Цель» как самый массовый запрос пользователя. Механики для подушки безопасности, регулярных платежей и свободных накоплений находятся в активной проработке.</p></Solution>
      <Solution title="Настройка суммы и плана" kind="plan"><p>После ввода суммы система сразу рассчитывает ежемесячный платёж и срок цели. Параметры связаны между собой: если изменить комфортную сумму в месяц, автоматически пересчитается дата, и наоборот. Это помогает заранее «примерить» нагрузку и найти нужный баланс.</p><p>Если у банка достаточно данных о доходах и расходах, интерфейс оценивает реалистичность плана — показывает нагрузку на бюджет, долю от свободных средств и подсказывает, насколько легко или тяжело будет удерживать выбранный темп. Если истории трат нет, система показывает нейтральный расчёт.</p><p>Пользователь не обязан настраивать план и может отключить его.</p></Solution>
      <Solution title="Экран копилки" kind="goal"><p>Экран копилки связывает эмоциональный образ цели с контролем плана.</p><p>В шапке находится текущий баланс, визуализация цели и общая строка прогресса: сколько осталось накопить и к какой дате.</p><p>Ниже идут стандартные блоки: операции и доход от копилки.</p><p>Блок «План накопления» показывает выполнение нормы за текущий месяц и позволяет быстро изменить параметры цели или адаптировать график при отставании.</p></Solution>
      <Solution title="Просмотр и изменение плана" kind="change"><p>С экрана копилки пользователь открывает модалку «План накопления», где видит текущие условия.</p><p>Отсюда можно изменить параметры, а при отставании — адаптировать план: сохранить дату, увеличив взнос, или откладывать привычную сумму дольше.</p><p>Также можно поставить план на паузу, чтобы временно не следовать графику. Копилка остаётся доступной. Пользователь может пополнять её, когда захочет, без необходимости вносить запланированную сумму каждый месяц.</p></Solution>
      <Solution title={<>Быстрое пополнение <span>(эксперимент)</span></>} kind="quick"><p>Вместо стандартного сценария пополнения счёта я сделал экспериментальный вариант быстрого пополнения, чтобы сделать однотипные переводы проще и быстрее.</p><p>Пользователь переключает ползунок между ключевыми отметками: закрыть остаток на текущий месяц, закрыть план на два месяца или внести минимальную сумму. Интерфейс сразу меняет сумму перевода и объясняет результат действия.</p><ul><li>Карта, с которой будет пополняться копилка, видна сразу над суммой и меняется в один тап без перехода на отдельный экран.</li><li>Действие подтверждается удержанием кнопки «Пополнить». Это исключает случайный миссклик, но сохраняет скорость перевода без лишних шагов.</li><li>Снизу оставлена кнопка «Другая сумма» для тех, кому нужно внести произвольную цифру.</li></ul></Solution>
    </section>
    <section className="case-section text-section"><h2>Тестирование юзабилити</h2><div className="body-copy"><p>На данном этапе тестирование только планируется.</p><p>Примерные задания:</p><ul><li><strong>First click test</strong> — показать экран копилки и предложить ситуацию: «Вы пропустили несколько пополнений и теперь хотите пересмотреть срок накопления. Куда бы вы нажали?» Проверить, помогает ли интерфейс найти действие с первой попытки.</li><li><strong>Goal based prototype test</strong> — предложить создать копилку на путешествие, указать сумму и подобрать комфортный ежемесячный взнос. Затем изменить условия: «В этом месяце не получилось отложить деньги. Вы хотите продолжить копить ту же сумму, но готовы перенести дату». Посмотреть, сможет ли человек самостоятельно изменить план и пополнить копилку на оставшуюся сумму за текущий месяц.</li><li><strong>Пятисекундный тест</strong> — показать экран копилки на пять секунд, затем скрыть его и спросить, что пользователь запомнил и как понял назначение экрана. Проверить, какие элементы привлекают внимание и считывается ли ключевая информация о цели.</li></ul></div></section>
    <section className="case-section text-section case-result"><h2>Что в итоге</h2><div className="body-copy"><p>Я проработал основной сценарий копилки целиком: от создания цели и выбора плана накоплений до отслеживания прогресса, изменения условий и снятия денег.</p><p>В обновлённом сценарии пользователь может подобрать комфортный взнос, скорректировать план, если начал отставать от цели, или поставить его на паузу, продолжая пополнять копилку в удобном для себя темпе.</p><p>Чтобы проверить решения не только в статичных макетах, я также собрал с помощью Codex рабочий прототип iOS-приложения в Xcode. Он позволяет протестировать основные интерфейсы и взаимодействия непосредственно на устройстве.</p><p>Проект ещё находится в разработке. Следующий этап — провести тестирование юзабилити и скорректировать решения по его результатам. В дальнейшем я планирую развить отдельные сценарии для финансовой подушки, обязательных платежей и свободных накоплений, а также проработать закрытие копилки и распределение оставшихся средств между другими целями.</p></div></section>
  </article>;
}

type SheetDrag = { source: 'touch' | 'pointer'; id: number; x: number; y: number; lastY: number; lastTime: number; velocity: number; committed: boolean };

function CaseViewport({ onClose }: { onClose: () => void }) {
  const wrapper = useRef<HTMLDivElement>(null), content = useRef<HTMLDivElement>(null), popup = useRef<HTMLDivElement>(null);
  const drag = useRef<SheetDrag | null>(null);
  const [dragY, setDragY] = useState(0), [dragging, setDragging] = useState(false), [swipeClosing, setSwipeClosing] = useState(false), [showTop, setShowTop] = useState(false);
  useSmoothScroll(false, wrapper, content);
  useLayoutEffect(() => {
    if (!wrapper.current) return;
    wrapper.current.scrollTop = 0;
    const frame = requestAnimationFrame(() => {
      if (wrapper.current) wrapper.current.scrollTop = 0;
    });
    const timer = window.setTimeout(() => {
      if (wrapper.current) wrapper.current.scrollTop = 0;
      setShowTop(false);
    }, 120);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, []);
  const release = useCallback((clientY: number, cancelled = false) => {
    const gesture = drag.current;
    if (!gesture) return;
    const distance = Math.max(0, clientY - gesture.y);
    const projectedDistance = distance + Math.max(0, gesture.velocity) * 180;
    drag.current = null;
    setDragging(false);
    const shouldClose = !cancelled && gesture.committed && (distance > Math.min(140, innerHeight * .2) || projectedDistance > innerHeight * .28);
    if (shouldClose) {
      setDragY(distance);
      setSwipeClosing(true);
      requestAnimationFrame(onClose);
    } else {
      setDragY(0);
    }
  }, [onClose]);
  useEffect(() => {
    const element = popup.current;
    if (!element) return;
    const touchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || (wrapper.current?.scrollTop ?? 0) > 1) return;
      const touch = event.touches[0];
      drag.current = { source: 'touch', id: touch.identifier, x: touch.clientX, y: touch.clientY, lastY: touch.clientY, lastTime: event.timeStamp, velocity: 0, committed: false };
    };
    const touchMove = (event: TouchEvent) => {
      const gesture = drag.current;
      if (!gesture || gesture.source !== 'touch' || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (touch.identifier !== gesture.id) return;
      const dx = touch.clientX - gesture.x, dy = touch.clientY - gesture.y;
      if (!gesture.committed) {
        if (dy > 8 && Math.abs(dy) > Math.abs(dx)) {
          gesture.committed = true;
          setDragging(true);
        } else if (dy < -8 || Math.abs(dx) > Math.abs(dy) + 8) {
          drag.current = null;
          return;
        } else {
          return;
        }
      }
      event.preventDefault();
      const elapsed = Math.max(1, event.timeStamp - gesture.lastTime);
      gesture.velocity = (touch.clientY - gesture.lastY) / elapsed;
      gesture.lastY = touch.clientY;
      gesture.lastTime = event.timeStamp;
      setDragY(Math.max(0, dy));
    };
    const touchEnd = (event: TouchEvent) => {
      const gesture = drag.current;
      if (!gesture || gesture.source !== 'touch') return;
      const touch = Array.from(event.changedTouches).find(item => item.identifier === gesture.id);
      if (touch) release(touch.clientY);
    };
    const touchCancel = () => release(drag.current?.lastY ?? 0, true);
    element.addEventListener('touchstart', touchStart, { passive: true });
    element.addEventListener('touchmove', touchMove, { passive: false });
    element.addEventListener('touchend', touchEnd, { passive: true });
    element.addEventListener('touchcancel', touchCancel, { passive: true });
    return () => {
      element.removeEventListener('touchstart', touchStart);
      element.removeEventListener('touchmove', touchMove);
      element.removeEventListener('touchend', touchEnd);
      element.removeEventListener('touchcancel', touchCancel);
    };
  }, [release]);
  function scrollToTop() {
    const element = wrapper.current;
    if (!element) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { element.scrollTop = 0; return; }
    const start = element.scrollTop, startedAt = performance.now(), duration = 520;
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      element.scrollTop = start * Math.pow(1 - progress, 4);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const popupStyle = { '--drag-y': `${dragY}px` } as CSSProperties;
  return <Dialog.Viewport className="case-viewport" ref={wrapper} onScroll={event => setShowTop(event.currentTarget.scrollTop > 480)}><div className="case-scroll-content" ref={content}><Dialog.Popup ref={popup} className={`case-popup${dragging ? ' is-dragging' : ''}`} style={popupStyle} data-swipe-close={swipeClosing || undefined} onPointerDown={event => {
      if (event.pointerType === 'touch') return;
      if (wrapper.current && wrapper.current.scrollTop > 2) return;
      drag.current = { source: 'pointer', id: event.pointerId, x: event.clientX, y: event.clientY, lastY: event.clientY, lastTime: event.timeStamp, velocity: 0, committed: false };
      event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event => {
      const gesture = drag.current;
      if (!gesture || gesture.source !== 'pointer' || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (!gesture.committed) {
        if (dy > 8 && Math.abs(dy) > Math.abs(dx)) { gesture.committed = true; setDragging(true); }
        else if (dy < -8 || Math.abs(dx) > Math.abs(dy) + 8) { drag.current = null; return; }
        else return;
      }
      const elapsed = Math.max(1, event.timeStamp - gesture.lastTime);
      gesture.velocity = (event.clientY - gesture.lastY) / elapsed;
      gesture.lastY = event.clientY;
      gesture.lastTime = event.timeStamp;
      setDragY(Math.max(0, dy));
    }} onPointerUp={event => { if (drag.current?.source === 'pointer') release(event.clientY); }} onPointerCancel={() => { if (drag.current?.source === 'pointer') release(drag.current.lastY, true); }}>
    <div className="case-swipe-zone"><span /></div>
    <Dialog.Close className="case-close" aria-label="Закрыть"><Icon name="case-close" size={40} /></Dialog.Close><CaseContent />
  </Dialog.Popup><button className={`case-top${showTop ? ' is-visible' : ''}`} onClick={scrollToTop} aria-label="Вверх">↑</button></div></Dialog.Viewport>;
}

export default function App() {
  const [contactOpen, setContactOpen] = useState(false), [caseOpen, setCaseOpen] = useState(false);
  useSmoothScroll(contactOpen || caseOpen);
  useEffect(() => {
    const root = document.documentElement;
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    let timer: number | undefined;
    const apply = (open: boolean) => {
      if (open) root.dataset.caseOpen = 'true'; else delete root.dataset.caseOpen;
      if (theme) theme.content = open ? '#121212' : '#0c0c0c';
    };
    if (caseOpen) apply(true); else timer = window.setTimeout(() => apply(false), 320);
    return () => { if (timer) window.clearTimeout(timer); };
  }, [caseOpen]);
  return <><a className="skip-link" href="#work">К работам</a><main className="portfolio-layout" data-case-open={caseOpen}>
    <aside className="profile"><div className="profile-block"><p className="eyebrow">Влад Фролов</p><h1>Продуктовый дизайнер</h1></div><div className="profile-block"><p className="eyebrow">Опыт</p><p>Проектирую понятные цифровые продукты</p></div><div className="profile-actions">
      <Dialog.Root open={contactOpen} onOpenChange={setContactOpen}><Dialog.Trigger className="contact-button">Contact</Dialog.Trigger><Dialog.Portal><Dialog.Backdrop className="contact-backdrop" /><Dialog.Popup className="contact-popup"><ContactContent /></Dialog.Popup></Dialog.Portal></Dialog.Root>
      <a className="cv-button" href={`${import.meta.env.BASE_URL}Vlad-Frolov-CV.pdf`} target="_blank" rel="noreferrer">CV</a>
    </div></aside>
    <section className="projects" id="work"><Dialog.Root open={caseOpen} onOpenChange={setCaseOpen} modal="trap-focus"><Dialog.Trigger className="project-card" aria-label={caseTitle}><Cover /><span className="project-title">{caseTitle}</span></Dialog.Trigger><Dialog.Portal><Dialog.Backdrop className="case-backdrop" /><CaseViewport onClose={() => setCaseOpen(false)} /></Dialog.Portal></Dialog.Root><div className="project-card project-placeholder"><div className="placeholder-cover" /><p className="project-title">{caseTitle}</p></div></section>
  </main></>;
}
