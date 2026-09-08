import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import Lenis from 'lenis';

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;
const caseTitle = 'Переосмысление опыта накопления в Т-Банке';

function useSmoothScroll(blocked = false, wrapper?: React.RefObject<HTMLDivElement | null>, content?: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let lenis: Lenis | undefined;
    function setup() {
      lenis?.destroy();
      if (preference.matches || blocked || (wrapper && !wrapper.current)) return;
      lenis = new Lenis({
        wrapper: wrapper?.current ?? window,
        content: content?.current ?? document.documentElement,
        autoRaf: true,
        smoothWheel: true,
        syncTouch: false,
        lerp: 0.2,
        wheelMultiplier: 1,
        overscroll: false,
      });
    }
    setup();
    preference.addEventListener('change', setup);
    return () => { lenis?.destroy(); preference.removeEventListener('change', setup); };
  }, [blocked, wrapper, content]);
}

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return <img className="icon" src={asset(`${name}.svg`)} width={size} height={size} alt="" draggable="false" />;
}

function Cover({ large = false }: { large?: boolean }) {
  return <div className={`cover${large ? ' cover-large' : ''}`} role="img" aria-label="Прототип копилки Т-Банка: список целей и накопления на путешествие">
    <img className="cover-background" src={asset('background.png')} alt="" draggable="false" />
    <img className="cover-phone cover-phone-first" src={asset('savings-hub.png')} alt="" draggable="false" />
    <img className="cover-phone cover-phone-second" src={asset('savings-goal.png')} alt="" draggable="false" />
  </div>;
}

function ContactContent() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText('v@frlvv.ru');
      setError(false);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2400);
    } catch { setError(true); }
  }
  return <>
    <div className="contact-heading">
      <Dialog.Title>Contact</Dialog.Title>
      <Dialog.Close className="contact-close" aria-label="Закрыть контакты"><Icon name="close" size={20} /></Dialog.Close>
    </div>
    <Dialog.Description className="sr-only">Скопировать email или перейти в Telegram</Dialog.Description>
    <div className="contact-links">
      <button className={`contact-row email-row${copied ? ' is-copied' : ''}`} onClick={copyEmail} aria-label="Скопировать почту v@frlvv.ru">
        <Icon name="email" />
        <span className="contact-label"><span>Email</span><span>v@frlvv.ru</span></span>
        <span className="contact-action" aria-live="polite">{copied ? '🎉 copied' : 'copy'}</span>
      </button>
      <a className="contact-row telegram-row" href="https://t.me/vf433" target="_blank" rel="noreferrer">
        <Icon name="telegram" />
        <span className="contact-label"><span>Telegram</span><span>vf433</span></span>
        <span className="contact-action">go</span>
      </a>
    </div>
    {error && <p className="copy-error" role="status">Не удалось скопировать. Почта: <a href="mailto:v@frlvv.ru">v@frlvv.ru</a></p>}
  </>;
}

function ImageSlider() {
  const [active, setActive] = useState(0);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const items = [
    { file: 'current-home.png', alt: 'Главная Т-Банка со списком накопительных счетов' },
    { file: 'current-account.png', alt: 'Экран накопительного счёта Т-Банка' },
  ];
  function change(index: number) { setActive((index + items.length) % items.length); }
  return <div className="image-slider" role="region" aria-roledescription="карусель" aria-label="Текущий интерфейс Т-Банка">
    <div className="image-stack" tabIndex={0} aria-label="Переключить скриншот стрелками влево или вправо"
      onKeyDown={e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); change(active + 1); }
        if (e.key === 'Home') { e.preventDefault(); change(0); }
        if (e.key === 'End') { e.preventDefault(); change(items.length - 1); }
      }}
      onPointerDown={e => {
        if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
        pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        suppressClick.current = false;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerUp={e => {
        const start = pointer.current;
        if (!start || start.id !== e.pointerId) return;
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
          change(active + (dx < 0 ? 1 : -1)); suppressClick.current = true;
        }
        pointer.current = null;
      }}
      onPointerCancel={() => { pointer.current = null; }}
      onClick={e => {
        if (suppressClick.current) { suppressClick.current = false; return; }
        const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
        if ((active === 0 && x > e.currentTarget.clientWidth * .85) || (active === 1 && x < e.currentTarget.clientWidth * .15)) change(active + 1);
      }}>
      {items.map((item, i) => <img key={item.file} src={asset(item.file)} alt={item.alt} draggable="false" loading="lazy"
        className={`stack-image ${i === active ? 'is-front' : 'is-back'} ${i === 0 ? 'stack-home' : 'stack-account'}`} />)}
    </div>
    <div className="slider-controls">
      <button onClick={() => change(active - 1)} aria-label="Предыдущий скриншот">←</button>
      <div className="slider-dots">{items.map((item, i) => <button key={item.file} className={active === i ? 'is-active' : ''} onClick={() => change(i)} aria-label={`Скриншот ${i + 1} из 2`} aria-pressed={active === i}><span /></button>)}</div>
      <button onClick={() => change(active + 1)} aria-label="Следующий скриншот">→</button>
    </div>
    <span className="sr-only" aria-live="polite">Скриншот {active + 1} из 2: {items[active].alt}</span>
  </div>;
}

function ResearchText() {
  return <div className="body-copy">
    <p>Я начал с изучения материалов о накопительном поведении и разбора сценариев – накопление на покупку, подготовка к платежу, создание финансовой подушки, пропуски пополнений и снятие денег.<br />На основе этого выдвинул несколько рабочих проблем, которые впоследствии проверял через интервью.<br />В результате я выделил несколько инсайтов:</p>
    <ul>
      <li>люди используют копилки для разных задач – покупок, событий и финансового резерва.</li>
      <li>сумму и дату часто задают от желаемого результата, не проверяя, какой регулярный взнос потребуется и подходит ли он текущему бюджету.</li>
      <li>непредвиденные расходы меняют траекторию, но снятие не равно отказу от накопления. Люди используют накопленное в текущей жизненной ситуации и способны возвращаться к цели.</li>
      <li>для части людей срок — больше ориентир, чем обязательство (например как платеж по кредиту). Пропуск пополнения или перенос даты не воспринимается как провал, пока цель остаётся актуальной.</li>
      <li>само отставание от цели не всегда отказ от накопления.</li>
      <li>люди не понимают как продолжить копить когда не вносили сумму неск месяцев, вследствие чего просто забрасывают цель, хотя она может оставаться актуальной</li>
    </ul>
  </div>;
}

function CaseContent() {
  return <article className="case-article">
    <header className="case-intro">
      <Dialog.Title>Копилка Т-Банка</Dialog.Title>
      <div className="case-about"><p className="eyebrow">О проекте</p>
        <Dialog.Description className="body-copy">Копилка – это переосмысление опыта накоплений в приложении Т-Банка.<br />В рамках кейса я разобрал текущий сценарий использования накопительных счетов, изучил пользовательские привычки и проблемы, сформулировал продуктовые гипотезы и на их основе спроектировал обновлённый флоу создания и управления накоплениями.</Dialog.Description>
      </div>
      <dl className="case-facts">
        <div><dt>Год</dt><dd>2026</dd></div>
        <div><dt>Платформа</dt><dd>Mobile, iOS</dd></div>
        <div><dt>Роль в проекте</dt><dd>UX/UI, Research, IA, Usability Testing, Motion</dd></div>
      </dl>
    </header>
    <Cover large />
    <section className="case-section text-section">
      <h2>Задача</h2>
      <p className="callout"><span aria-hidden="true">☝️</span>Сделать накопления ближе к жизни человека</p>
      <p className="body-copy">Я интерпретировал данную задачу не только как визуальный апгрейд (сделать интерфейс чище и динамичнее), а в первую очередь через изменение продуктовой логики.<br />Накопления не всегда идут по первоначальному графику. Могут появиться срочные расходы, измениться доход или приоритеты.<br />В таких ситуациях человеку нужен понятный способ продолжить.</p>
    </section>
    <section className="case-section context-section">
      <div><h2>Контекст</h2>
        <div className="body-copy">
          <p>Сейчас сбережения в Т‑Банке работают через базовый накопительный счёт с начислением процентов на остаток. Счета отображаются общим списком на главном экране вперемешку с картами и другими продуктами.</p>
          <p>Внутри счёта можно включить цель: указать итоговую сумму и дату. Интерфейс делит сумму на количество месяцев и показывает фиксированную цифру, которую нужно вносить каждый месяц. Пополнение работает стандартно — через открытие формы перевода и ручной ввод любой суммы.</p>
          <p>Что сейчас не очень:</p>
          <ul>
            <li>Если пропустить пополнение или внести меньше, система не пересчитывает план, срок остается прежним</li>
            <li>Если забрать часть денег на срочные траты, прогресс-бар откатывается назад, а график не адаптируется</li>
            <li>Все счета выглядят одинаково. Нельзя наглядно разделить финансовую подушку, накопления на отпуск и резерв под регулярные платежи (налоги, страховку).</li>
            <li>Чтобы закрыть норму месяца, пользователю нужно самому помнить сумму платежа и вбивать её руками в форму перевода.</li>
          </ul>
        </div>
      </div>
      <ImageSlider />
    </section>
    <section className="case-section text-section"><h2>Исследование</h2><ResearchText /></section>
    <section className="case-section text-section"><h2>Гипотезы и решения</h2><ResearchText /></section>
  </article>;
}

function CaseViewport() {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useSmoothScroll(false, wrapper, content);
  return <Dialog.Viewport className="case-viewport" ref={wrapper}>
    <div className="case-scroll-content" ref={content}>
      <Dialog.Popup className="case-popup">
        <Dialog.Close className="case-close" aria-label="Закрыть кейс"><Icon name="case-close" size={40} /></Dialog.Close>
        <CaseContent />
      </Dialog.Popup>
    </div>
  </Dialog.Viewport>;
}

export default function App() {
  const [contactOpen, setContactOpen] = useState(false);
  const [caseOpen, setCaseOpen] = useState(false);
  useSmoothScroll(contactOpen || caseOpen);
  return <>
    <a className="skip-link" href="#work">Перейти к работам</a>
    <main className="portfolio-layout">
      <aside className="profile" aria-label="О дизайнере">
        <div className="profile-block"><p className="eyebrow">Влад Фролов</p><h1>Продуктовый дизайнер</h1></div>
        <div className="profile-block"><p className="eyebrow">Опыт</p><p>Проектирую понятные цифровые продукты</p></div>
        <div className="profile-actions">
          <Dialog.Root open={contactOpen} onOpenChange={setContactOpen}>
            <Dialog.Trigger className="contact-button">Contact</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="backdrop contact-backdrop" />
              <Dialog.Popup className="contact-popup"><ContactContent /></Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <a className="cv-button" href={`${import.meta.env.BASE_URL}Vlad-Frolov-CV.pdf`} target="_blank" rel="noreferrer" aria-label="Открыть CV в PDF">CV</a>
        </div>
      </aside>
      <section className="projects" id="work" aria-label="Работы">
        <Dialog.Root open={caseOpen} onOpenChange={setCaseOpen}>
          <Dialog.Trigger className="project-card" aria-label={`Открыть кейс: ${caseTitle}`}>
            <Cover />
            <span className="project-title">{caseTitle}</span>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="backdrop" />
            <CaseViewport />
          </Dialog.Portal>
        </Dialog.Root>
        <div className="project-card project-placeholder" aria-label="Место для следующего кейса">
          <div className="placeholder-cover" aria-hidden="true" />
          <p className="project-title">{caseTitle}</p>
        </div>
      </section>
    </main>
  </>;
}

