'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { app, cart, on, scrollToId } from '@/lib/store';
import Bean from './Bean';

const LINKS = [
  ['#experience', 'Expérience'],
  ['#menu', 'Menu'],
  ['#origines', 'Origines'],
  ['#savoir-faire', 'Savoir-faire'],
  ['#contact', 'Contact'],
];

export default function Nav() {
  const nav = useRef(null);
  const badge = useRef(null);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  // cacher la nav en descendant, la montrer en remontant
  useEffect(() => {
    let lastY = 0;
    let raf;
    const light = document.querySelector('.stats');
    const loop = () => {
      const y = window.scrollY;
      const n = nav.current;
      if (n) {
        // version sombre de la nav quand elle passe au-dessus de la section claire
        const r = light?.getBoundingClientRect();
        n.classList.toggle('on-light', !!r && r.top < 70 && r.bottom > 70);
        n.classList.toggle('is-hidden', y > lastY + 2 && y > 200 && !open);
        if (y < lastY - 2 || y < 200) n.classList.remove('is-hidden');
        n.classList.toggle('is-solid', y > 40);
      }
      lastY = y;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // apparition après le chargement
  useEffect(() => {
    gsap.set(nav.current, { opacity: 0, y: -20 });
    return on('ready', () => gsap.to(nav.current, { opacity: 1, y: 0, duration: 1, delay: 0.9, ease: 'power3.out' }));
  }, []);

  // compteur du panier
  useEffect(
    () =>
      on('cart', () => {
        setCount(cart.count);
        gsap.fromTo(badge.current, { scale: 1.6 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      }),
    []
  );

  useEffect(() => {
    if (!app.lenis) return;
    if (open) app.lenis.stop();
    else if (app.ready) app.lenis.start();
  }, [open]);

  const go = (e, id) => {
    e.preventDefault();
    setOpen(false);
    setTimeout(() => scrollToId(id), open ? 350 : 0);
  };

  return (
    <>
      <header className="nav" ref={nav}>
        <a href="#top" className="nav-logo" onClick={(e) => go(e, '#top')} aria-label="KAHWA, accueil">
          <Bean />
          KAHWA
        </a>
        <nav className="nav-links" aria-label="Navigation principale">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} onClick={(e) => go(e, href)}>
              {label}
            </a>
          ))}
        </nav>
        <div className="nav-right">
          <button className="cart-btn" aria-label={`Panier, ${count} article(s)`}>
            <span className="label">Panier</span>
            <span className="cart-count" ref={badge}>
              {count}
            </span>
          </button>
          <button className="menu-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
            <span />
          </button>
        </div>
      </header>
      <div className={`mobile-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        {LINKS.map(([href, label]) => (
          <a key={href} href={href} onClick={(e) => go(e, href)} tabIndex={open ? 0 : -1}>
            {label}
          </a>
        ))}
      </div>
    </>
  );
}
