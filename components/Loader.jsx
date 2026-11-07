'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { app, emit, loading } from '@/lib/store';
import Bean from './Bean';

const MAX_WAIT = 7000; // on n'attend jamais plus de 7 s

/** Écran de chargement : attend le préchargement de la séquence d'images. */
export default function Loader() {
  const root = useRef(null);
  const count = useRef(null);
  const bar = useRef(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const shown = { v: 0 };
    let finished = false;
    const start = performance.now();

    const finish = () => {
      if (finished) return;
      finished = true;
      gsap
        .timeline({
          onComplete: () => {
            setHidden(true);
          },
        })
        .to(shown, {
          v: 100,
          duration: 0.5,
          ease: 'power2.out',
          onUpdate: () => render(),
        })
        .to(root.current.querySelector('.loader-inner'), { y: -30, opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.1')
        .to(count.current, { y: -40, opacity: 0, duration: 0.5, ease: 'power2.in' }, '<')
        .add(() => {
          app.ready = true;
          document.body.classList.remove('is-loading');
          emit('ready');
        })
        .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.1');
    };

    const render = () => {
      if (count.current) count.current.textContent = String(Math.round(shown.v)).padStart(3, '0');
      if (bar.current) bar.current.style.transform = `scaleX(${shown.v / 100})`;
    };

    // compteur qui "rattrape" la vraie progression en douceur
    const tick = () => {
      if (finished) return;
      const target = loading.progress * 100;
      shown.v += (target - shown.v) * 0.12;
      render();
      if (loading.done && shown.v > 96) finish();
      if (performance.now() - start > MAX_WAIT) finish();
    };
    gsap.ticker.add(tick);

    return () => gsap.ticker.remove(tick);
  }, []);

  if (hidden) return null;

  return (
    <div className="loader" ref={root} aria-live="polite" aria-label="Chargement">
      <div className="loader-inner">
        <Bean className="loader-bean" />
        <div className="loader-brand">KAHWA</div>
      </div>
      <div className="loader-hint">Torréfaction de l’expérience…</div>
      <div className="loader-count" ref={count}>
        000
      </div>
      <div className="loader-bar" ref={bar} />
    </div>
  );
}
