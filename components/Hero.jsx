'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { on, scrollToId } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

const WORD = 'KAHWA';

/** Hero : vraie vidéo en boucle (tasse fumante) + grand logo animé. */
export default function Hero() {
  const root = useRef(null);
  const media = useRef(null);
  const video = useRef(null);

  useEffect(() => {
    const el = root.current;
    const v = video.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // lecture uniquement quand le hero est visible (et jamais si l'utilisateur limite les animations)
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !reduced) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(el);

    // souris -> légère parallaxe de la vidéo
    const moveX = gsap.quickTo(media.current, 'x', { duration: 1.2, ease: 'power3.out' });
    const moveY = gsap.quickTo(media.current, 'y', { duration: 1.2, ease: 'power3.out' });
    const move = (e) => {
      moveX(((e.clientX / window.innerWidth) * 2 - 1) * -14);
      moveY(((e.clientY / window.innerHeight) * 2 - 1) * -10);
    };
    if (!reduced) window.addEventListener('pointermove', move);

    const ctx = gsap.context(() => {
      gsap.set('.hero-word .char', { yPercent: 115, opacity: 0 });
      gsap.set('.hero-reveal', { y: 30, opacity: 0 });
      gsap.set('.hero-video', { scale: 1.18 });

      // Scroll : le hero reste épinglé pendant 1 écran, la caméra "avance" vers la tasse
      gsap
        .timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: '+=110%',
            pin: true,
            scrub: 0.8,
          },
        })
        .to('.hero-media', { scale: 1.3, yPercent: 5, ease: 'none' }, 0)
        .to('.hero-shade', { opacity: 1, ease: 'none' }, 0)
        .to('.hero-word h1', { scale: 1.35, opacity: 0, ease: 'power1.in' }, 0)
        .to('.hero-word .char', { yPercent: (i) => (i - 2) * -18, ease: 'none' }, 0)
        .to('.hero-bottom, .hero-meta', { opacity: 0, y: -50, ease: 'none' }, 0);
    }, el);

    // Animation d'entrée après le loader
    const off = on('ready', () => {
      gsap
        .timeline({ delay: 0.2 })
        .to(el.querySelector('.hero-video'), { scale: 1, duration: 2.6, ease: 'expo.out' }, 0)
        .to(el.querySelectorAll('.hero-word .char'), { yPercent: 0, opacity: 1, duration: 1.5, stagger: 0.07, ease: 'expo.out' }, 0.15)
        .to(el.querySelectorAll('.hero-reveal'), { y: 0, opacity: 1, duration: 1.1, stagger: 0.1, ease: 'power3.out' }, 0.85);
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
      <div className="hero-media" ref={media} aria-hidden="true">
        <video
          ref={video}
          className="hero-video"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          poster="/video/hero-loop-poster.jpg"
        >
          <source src="/video/hero-loop.webm" type="video/webm" />
          <source src="/video/hero-loop.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="hero-shade" aria-hidden="true" />

      <div className="hero-word" aria-hidden="true">
        <h1>
          {WORD.split('').map((c, i) => (
            <span className="char" key={i}>
              {c}
            </span>
          ))}
        </h1>
      </div>

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
