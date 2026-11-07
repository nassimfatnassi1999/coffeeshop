'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ORIGINS } from '@/lib/data';
import { cart, emit } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Petit grain qui "vole" du bouton jusqu'au panier */
function flyToCart(fromEl) {
  const target = document.querySelector('.cart-count');
  if (!target) return;
  const a = fromEl.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const bean = document.createElement('div');
  bean.innerHTML =
    '<svg viewBox="0 0 24 24" width="26" height="26"><g transform="rotate(-30 12 12)"><ellipse cx="12" cy="12" rx="6.4" ry="9.2" fill="#d69a5c"/><path d="M12 3.2 C 8.6 8.6, 15.4 15.4, 12 20.8" stroke="#120a06" stroke-width="1.6" fill="none"/></g></svg>';
  Object.assign(bean.style, { position: 'fixed', left: '0', top: '0', zIndex: 160, pointerEvents: 'none' });
  document.body.appendChild(bean);
  const sx = a.left + a.width / 2 - 13;
  const sy = a.top + a.height / 2 - 13;
  const ex = b.left + b.width / 2 - 13;
  const ey = b.top + b.height / 2 - 13;
  gsap.set(bean, { x: sx, y: sy });
  gsap
    .timeline({ onComplete: () => bean.remove() })
    .to(bean, { x: ex, duration: 0.9, ease: 'power1.inOut' }, 0)
    .to(bean, { y: Math.min(sy, ey) - 140, duration: 0.45, ease: 'power2.out' }, 0)
    .to(bean, { y: ey, duration: 0.45, ease: 'power2.in' }, 0.45)
    .to(bean, { rotate: 540, scale: 0.5, duration: 0.9, ease: 'none' }, 0);
}

function OriginCard({ o }) {
  const [added, setAdded] = useState(false);
  const add = (e) => {
    flyToCart(e.currentTarget);
    setAdded(true);
    setTimeout(() => {
      cart.count += 1;
      emit('cart');
    }, 850);
    setTimeout(() => setAdded(false), 1800);
  };
  return (
    <article className="origin-card" style={{ '--tint': o.color + 'aa' }}>
      <div className="origin-visual">
        <img src={o.image} alt={`Sachet KAHWA ${o.origin} ${o.region}`} loading="lazy" width="900" height="1200" />
      </div>
      <div className="origin-body">
        <div className="row">
          <h3>{o.origin}</h3>
          <span className="price">
            {o.price}
            <small>DH</small>
          </span>
        </div>
        <div className="region">{o.region} · 250 g</div>
        <dl className="origin-facts">
          <div>
            <dt>Altitude</dt>
            <dd>{o.altitude}</dd>
          </div>
          <div>
            <dt>Process</dt>
            <dd>{o.process}</dd>
          </div>
          <div>
            <dt>Torréf.</dt>
            <dd className="roast" aria-label={`Niveau ${o.roast} sur 3`}>
              {[1, 2, 3].map((n) => (
                <i key={n} className={n <= o.roast ? 'on' : ''} />
              ))}
            </dd>
          </div>
        </dl>
        <div className="notes">
          {o.notes.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
        <button className={`btn btn-primary add-btn ${added ? 'added' : ''}`} onClick={add}>
          {added ? 'Ajouté ✓' : 'Ajouter au panier'}
        </button>
      </div>
    </article>
  );
}

export default function Origins() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      SplitText.create('.origins-head h2', {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            duration: 1.2,
            stagger: 0.1,
            ease: 'expo.out',
            scrollTrigger: { trigger: '.origins-head', start: 'top 80%' },
          }),
      });

      gsap.utils.toArray('.origin-card').forEach((card, i) => {
        gsap.from(card, {
          y: 120,
          opacity: 0,
          duration: 1.3,
          delay: i * 0.08,
          ease: 'expo.out',
          scrollTrigger: { trigger: card, start: 'top 90%' },
        });
        gsap.fromTo(
          card.querySelector('img'),
          { yPercent: -7, rotate: -3 },
          { yPercent: 7, rotate: 3, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } }
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="origins" id="origines" ref={root} aria-label="Nos origines">
      <div className="origins-head">
        <div>
          <span className="kicker">Grains en vente</span>
          <h2 className="section-title">
            Trois terroirs,
            <br />
            <em>trois caractères.</em>
          </h2>
        </div>
        <p>
          Achetés en direct aux producteurs, torréfiés chaque mardi et expédiés sous 48 h. Chaque sachet indique
          sa date de torréfaction.
        </p>
      </div>
      <div className="origins-grid">
        {ORIGINS.map((o) => (
          <OriginCard o={o} key={o.id} />
        ))}
      </div>
    </section>
  );
}
