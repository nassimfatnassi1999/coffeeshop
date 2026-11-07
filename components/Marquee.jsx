'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { app } from '@/lib/store';
import Bean from './Bean';

const ROW_1 = ['Torréfié à Casablanca', 'Single origin', 'Slow roast', 'Espresso bar'];
const ROW_2 = ['Grains entiers', 'Moulu à la commande', 'Latte art', 'Cold brew'];

function Row({ items, outline }) {
  // le contenu est dupliqué pour une boucle sans couture
  const all = [...items, ...items, ...items, ...items];
  return (
    <div className={`marquee-row ${outline ? 'outline' : ''}`}>
      {all.map((t, i) => (
        <span className="marquee-item" key={i} aria-hidden={i >= items.length}>
          {t}
          <Bean />
        </span>
      ))}
    </div>
  );
}

/** Bandeau de texte infini dont la vitesse réagit au scroll. */
export default function Marquee() {
  const root = useRef(null);

  useEffect(() => {
    const rows = [...root.current.querySelectorAll('.marquee-row')].map((el, i) => ({ el, x: 0, dir: i % 2 ? 1 : -1 }));
    let visible = false;
    let sign = 1;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(root.current);

    const tick = (_t, dt) => {
      if (!visible) return;
      const v = app.lenis ? app.lenis.velocity : 0;
      if (v > 0.5) sign = 1;
      if (v < -0.5) sign = -1;
      const boost = 1 + Math.min(Math.abs(v) * 0.12, 5);
      rows.forEach((r) => {
        const half = r.el.scrollWidth / 2;
        r.x += r.dir * sign * 0.05 * dt * boost;
        if (r.x <= -half) r.x += half;
        if (r.x > 0) r.x -= half;
        r.el.style.transform = `translate3d(${r.x}px,0,0)`;
      });
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
    };
  }, []);

  return (
    <section className="marquee" ref={root} aria-label="Nos engagements">
      <Row items={ROW_1} />
      <Row items={ROW_2} outline />
    </section>
  );
}
