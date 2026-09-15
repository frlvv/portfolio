import { useEffect } from 'react';
import { motion, useMotionTemplate, useSpring } from 'motion/react';

export default function Portrait({ blocked }: { blocked: boolean }) {
  const x = useSpring(0, { mass: 1, stiffness: 100, damping: 10 });
  const y = useSpring(0, { mass: 1, stiffness: 100, damping: 10 });
  const transform = useMotionTemplate`perspective(800px) rotateX(${y}deg) rotateY(${x}deg)`;

  useEffect(() => {
    const enabled = matchMedia('(min-width:701px) and (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
    const reset = () => { x.set(0); y.set(0); };
    const configure = () => { if (!enabled.matches) { x.jump(0); y.jump(0); } };
    const move = (event: PointerEvent) => {
      if (!enabled.matches || blocked || event.pointerType !== 'mouse') return;
      x.set(Math.max(-1, Math.min(1, event.clientX / innerWidth * 2 - 1)) * 7);
      y.set(Math.max(-1, Math.min(1, event.clientY / innerHeight * 2 - 1)) * -5);
    };
    const visibility = () => { if (document.hidden) reset(); };
    configure();
    if (blocked) reset();
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('blur', reset);
    document.documentElement.addEventListener('pointerleave', reset);
    document.addEventListener('visibilitychange', visibility);
    enabled.addEventListener('change', configure);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('blur', reset);
      document.documentElement.removeEventListener('pointerleave', reset);
      document.removeEventListener('visibilitychange', visibility);
      enabled.removeEventListener('change', configure);
    };
  }, [blocked, x, y]);

  return <motion.div className="profile-portrait" style={{ transform }}>
    <img src={`${import.meta.env.BASE_URL}assets/portrait.png`} alt="" width="820" height="1024" draggable="false" />
  </motion.div>;
}
