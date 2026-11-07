'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { hero, on, scrollToId } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

// La scène 3D n'est chargée que côté navigateur
const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });

const WORD = 'KAHWA';

export default function Hero() {
  const root = useRef(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = root.current;

    // souris -> parallaxe 3D
    const move = (e) => {
      hero.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      hero.mouseY = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', move);

    // pause du rendu 3D quand le hero n'est plus visible
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0 });
    io.observe(el);

    const ctx = gsap.context(() => {
      gsap.set('.hero-word .char', { yPercent: 115, opacity: 0 });
      gsap.set('.hero-reveal', { y: 30, opacity: 0 });

      // Scroll : le hero reste épinglé pendant 1 écran, la tasse tourne et monte
      gsap
        .timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: '+=110%',
            pin: true,
            scrub: 0.8,
            onUpdate: (self) => {
              hero.progress = self.progress;
            },
          },
        })
        .to('.hero-word h1', { scale: 1.35, opacity: 0, ease: 'power1.in' }, 0)
        .to('.hero-word .char', { yPercent: (i) => (i - 2) * -18, ease: 'none' }, 0)
        .to('.hero-bottom, .hero-meta', { opacity: 0, y: -50, ease: 'none' }, 0);
    }, el);

    // Animation d'entrée après le loader
    const off = on('ready', () => {
      gsap
        .timeline({ delay: 0.35 })
        .to(el.querySelectorAll('.hero-word .char'), { yPercent: 0, opacity: 1, duration: 1.5, stagger: 0.07, ease: 'expo.out' })
        .to(hero, { intro: 1, duration: 2.4, ease: 'expo.out' }, 0.1)
        .to(el.querySelectorAll('.hero-reveal'), { y: 0, opacity: 1, duration: 1.1, stagger: 0.1, ease: 'power3.out' }, 0.7);
    });

    return () => {
      window.removeEventListener('pointermove', move);
      io.disconnect();
      ctx.revert();
      off();
    };
  }, []);

  return (
    <section className="hero" id="top" ref={root} aria-label="Accueil">
      <div className="hero-word" aria-hidden="true">
        <h1>
          {WORD.split('').map((c, i) => (
            <span className="char" key={i}>
              {c}
            </span>
          ))}
        </h1>
      </div>

      <HeroScene active={active} />

      <div className="hero-meta">
        <span className="hero-reveal">Specialty coffee — Casablanca</span>
        <span className="hero-reveal">Torréfié en petites séries depuis 2014</span>
      </div>

      <div className="hero-bottom">
        <div className="hero-tagline">
          <h2 className="sr-only">KAHWA, torréfacteur de café de spécialité</h2>
          <p className="hero-reveal">
            Torréfié lentement.
            <br />
            <em>Servi avec soin.</em>
          </p>
          <div className="hero-ctas hero-reveal">
            <a
              href="#menu"
              className="btn btn-primary"
              onClick={(e) => {
                e.preventDefault();
                scrollToId('#menu');
              }}
            >
              Voir le menu <span className="arrow">→</span>
            </a>
            <a
              href="#origines"
              className="btn btn-ghost"
              onClick={(e) => {
                e.preventDefault();
                scrollToId('#origines');
              }}
            >
              Nos origines
            </a>
          </div>
        </div>
        <div className="scroll-hint hero-reveal" aria-hidden="true">
          <span>Scroll</span>
          <span className="line" />
        </div>
      </div>
    </section>
  );
}
