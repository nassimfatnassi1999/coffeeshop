'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/** Curseur rond qui suit la souris, grossit sur les liens et affiche "Voir" sur les produits. */
export default function Cursor() {
  const el = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    const node = el.current;
    const xTo = gsap.quickTo(node, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(node, 'y', { duration: 0.35, ease: 'power3.out' });

    const move = (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const over = (e) => {
      const view = e.target.closest('[data-cursor="view"]');
      const link = e.target.closest('a, button, input');
      node.classList.toggle('is-view', !!view);
      node.classList.toggle('is-link', !view && !!link);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerover', over);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
    };
  }, []);

  return (
    <div className="cursor" ref={el} aria-hidden="true">
      <span>Voir</span>
    </div>
  );
}
