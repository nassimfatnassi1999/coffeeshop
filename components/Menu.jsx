'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PRODUCTS } from '@/lib/data';
import { scrollToId } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

function ProductCard({ p, i }) {
  const card = useRef(null);

  // inclinaison 3D qui suit la souris
  const onMove = (e) => {
    const r = card.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    card.current.style.setProperty('--mx', `${x * 100}%`);
    card.current.style.setProperty('--my', `${y * 100}%`);
    gsap.to(card.current, {
      rotateY: (x - 0.5) * 14,
      rotateX: (0.5 - y) * 12,
      transformPerspective: 1000,
      duration: 0.5,
      ease: 'power2.out',
    });
  };
  const onLeave = () => gsap.to(card.current, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });

  return (
    <article className="product-card" ref={card} onPointerMove={onMove} onPointerLeave={onLeave} data-cursor="view">
      <div className="glow" />
      <div className="product-top">
        <span>{String(i + 1).padStart(2, '0')}</span>
        <span>{p.specs[1]}</span>
      </div>
      <div className="product-img">
        <img src={p.image} alt={p.name} loading="lazy" width="1000" height="1200" />
      </div>
      <h3>{p.name}</h3>
      <p className="desc">{p.text}</p>
      <div className="product-bottom">
        <div className="specs">
          {p.specs.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
        <div className="price">
          {p.price}
          <small>DH</small>
        </div>
      </div>
    </article>
  );
}

/** Menu : défilement horizontal épinglé (desktop), pile verticale (mobile). */
export default function Menu() {
  const root = useRef(null);
  const track = useRef(null);
  const fill = useRef(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    const cards = gsap.utils.toArray(root.current.querySelectorAll('.product-card'));

    mm.add('(min-width: 769px)', () => {
      const distance = () => track.current.scrollWidth - window.innerWidth;
      const tween = gsap.to(track.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => '+=' + distance(),
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (fill.current) fill.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      // chaque visuel tourne / glisse pendant qu'il traverse l'écran
      cards.forEach((card) => {
        const img = card.querySelector('.product-img img');
        gsap.fromTo(
          img,
          { rotate: -10, xPercent: 18, scale: 1.12 },
          {
            rotate: 6,
            xPercent: -14,
            scale: 1.3,
            ease: 'none',
            scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
          }
        );
      });

      gsap.from(root.current.querySelectorAll('.menu-intro > *'), {
        y: 60,
        opacity: 0,
        stagger: 0.1,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 70%' },
      });
    });

    mm.add('(max-width: 768px)', () => {
      cards.forEach((card) => {
        gsap.from(card, {
          y: 80,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%' },
        });
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section className="menu" id="menu" ref={root} aria-label="Menu">
      <div className="menu-track" ref={track}>
        <div className="menu-intro">
          <span className="kicker">La carte</span>
          <h2 className="section-title">
            Le <em>menu</em>
            <br />
            du bar.
          </h2>
          <p>Quatre classiques, préparés avec nos grains de la semaine. Faites défiler pour goûter des yeux.</p>
          <div className="menu-progress" aria-hidden="true">
            <span>01</span>
            <div className="track">
              <div className="fill" ref={fill} />
            </div>
            <span>{String(PRODUCTS.length).padStart(2, '0')}</span>
          </div>
        </div>

        {PRODUCTS.map((p, i) => (
          <ProductCard p={p} i={i} key={p.id} />
        ))}

        <div className="menu-end">
          <h3>Envie de le refaire chez vous&nbsp;?</h3>
          <a
            href="#origines"
            className="btn btn-primary"
            onClick={(e) => {
              e.preventDefault();
              scrollToId('#origines');
            }}
          >
            Découvrir nos grains <span className="arrow">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
