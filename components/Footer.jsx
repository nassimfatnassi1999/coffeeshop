'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToId } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const root = useRef(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.footer-cta h2', {
        y: 80,
        opacity: 0,
        duration: 1.3,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.footer-cta', start: 'top 80%' },
      });
      gsap.from('.footer-giant span', {
        yPercent: 100,
        opacity: 0,
        stagger: 0.06,
        ease: 'none',
        scrollTrigger: { trigger: '.footer-giant', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <footer className="footer" id="contact" ref={root}>
      <div className="footer-cta">
        <h2>
          Passez nous
          <br />
          <em>voir.</em>
        </h2>
        <form
          className="newsletter"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <label htmlFor="email">Recevez nos nouvelles origines en avant-première.</label>
          <div className="field">
            <input id="email" type="email" required placeholder="votre@email.com" autoComplete="email" />
            <button className="btn btn-primary" type="submit">
              S’inscrire <span className="arrow">→</span>
            </button>
          </div>
          {sent && <p className="thanks">Merci ! Premier café offert lors de votre visite ☕</p>}
        </form>
      </div>

      <div className="footer-info">
        <div>
          <h4>Adresse</h4>
          <p>
            12 rue du Torréfacteur
            <br />
            Maârif, Casablanca
          </p>
        </div>
        <div>
          <h4>Horaires</h4>
          <p>
            Lun – Ven · 7h30 – 19h
            <br />
            Sam – Dim · 9h – 20h
          </p>
        </div>
        <div>
          <h4>Contact</h4>
          <p>
            <a href="mailto:bonjour@kahwa.coffee">bonjour@kahwa.coffee</a>
            <br />
            <a href="tel:+212500000000">+212 5 00 00 00 00</a>
          </p>
        </div>
        <div>
          <h4>Suivre</h4>
          <p>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Instagram
            </a>
            <br />
            <a href="#" onClick={(e) => e.preventDefault()}>
              TikTok
            </a>
          </p>
        </div>
      </div>

      <div className="footer-giant" aria-hidden="true">
        {'KAHWA'.split('').map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} KAHWA Coffee Roasters — Projet de démonstration</span>
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            scrollToId('#top');
          }}
        >
          Retour en haut ↑
        </a>
      </div>
    </footer>
  );
}
