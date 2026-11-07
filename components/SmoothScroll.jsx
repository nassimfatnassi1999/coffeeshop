'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { app, on } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

/** Scroll fluide (Lenis) synchronisé avec GSAP ScrollTrigger. */
export default function SmoothScroll() {
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: !reduce,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    app.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    if (!app.ready) lenis.stop();
    const off = on('ready', () => {
      lenis.start();
      ScrollTrigger.refresh();
    });

    // recalcul des positions quand toutes les images sont chargées
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);

    return () => {
      off();
      window.removeEventListener('load', onLoad);
      gsap.ticker.remove(tick);
      lenis.destroy();
      app.lenis = null;
    };
  }, []);

  return null;
}
