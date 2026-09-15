import { useEffect, useRef, useState } from 'react';

export default function GradientBackground({ active }: { active: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const reduced = matchMedia('(prefers-reduced-motion:reduce)');
    let visible = false;
    const update = () => {
      if (active && visible && !document.hidden && !reduced.matches) {
        void element.play().catch(() => {});
      } else {
        element.pause();
        setPlaying(false);
      }
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(element);
    reduced.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      reduced.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
      element.pause();
    };
  }, [active]);
  return <div className="gradient-background" aria-hidden="true">
    <img src={`${import.meta.env.BASE_URL}assets/gradient-poster.jpg`} alt="" draggable="false" />
    <video ref={video} src={`${import.meta.env.BASE_URL}assets/gradient.mp4`} poster={`${import.meta.env.BASE_URL}assets/gradient-poster.jpg`} muted loop playsInline preload="metadata" data-playing={active && playing} onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} />
  </div>;
}
