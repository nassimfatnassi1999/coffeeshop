'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CAPTIONS, SEQUENCE } from '@/lib/data';
import { loading } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

/**
 * Animation "vidéo" pilotée par le scroll :
 * 150 images tirées de vraies vidéos (grains -> tassage -> extraction -> latte art,
 * préparées par scripts/prepare-media.sh) dessinées dans un <canvas> selon la position
 * du scroll — la technique des sites produits type Apple.
 */
export default function ScrollSequence() {
  const root = useRef(null);
  const canvas = useRef(null);
  const fill = useRef(null);
  const counter = useRef(null);
  const word = useRef(null);

  useEffect(() => {
    const N = SEQUENCE.frames;
    const cv = canvas.current;
    const ctx2d = cv.getContext('2d');
    const imgs = new Array(N);
    let current = 0;
    let loaded = 0;

    const pick = (i) => {
      if (imgs[i]?.naturalWidth) return imgs[i];
      for (let d = 1; d < N; d++) {
        if (imgs[i - d]?.naturalWidth) return imgs[i - d];
        if (imgs[i + d]?.naturalWidth) return imgs[i + d];
      }
      return null;
    };

    // l'image remplit tout l'écran (comme object-fit: cover) ;
    // sur mobile on recadre autour du sujet de chaque plan (SEQUENCE.focus)
    const draw = (i) => {
      const img = pick(i);
      if (!img) return;
      const cw = cv.width;
      const ch = cv.height;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const fx = SEQUENCE.focus(i);
      const x = Math.min(0, Math.max(cw - w, cw / 2 - w * fx));
      ctx2d.drawImage(img, x, (ch - h) / 2, w, h);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(cv.clientWidth * dpr);
      cv.height = Math.round(cv.clientHeight * dpr);
      draw(current);
    };
    resize();
    window.addEventListener('resize', resize);

    // Préchargement (la première image d'abord)
    for (let i = 0; i < N; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => {
        loaded++;
        loading.progress = loaded / N;
        if (loaded === N) loading.done = true;
        if (i === current || i === 0) draw(current);
      };
      img.src = SEQUENCE.path(i);
      imgs[i] = img;
    }

    const ctx = gsap.context(() => {
      const state = { frame: 0 };
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '+=380%',
          pin: true,
          scrub: 0.6,
          onUpdate: (self) => {
            if (fill.current) fill.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      tl.to(
        state,
        {
          frame: N - 1,
          duration: 1,
          onUpdate: () => {
            const f = Math.round(state.frame);
            if (f !== current) {
              current = f;
              draw(f);
              if (counter.current) counter.current.textContent = String(f + 1).padStart(3, '0');
            }
          },
        },
        0
      );
      tl.fromTo(word.current, { xPercent: 5 }, { xPercent: -55, duration: 1 }, 0);

      // Légendes qui apparaissent / disparaissent
      CAPTIONS.forEach((c, i) => {
        const el = root.current.querySelector(`[data-caption="${i}"]`);
        const [a, b] = c.at;
        const len = b - a;
        const dx = c.side === 'left' ? -50 : 50;
        tl.fromTo(el, { opacity: 0, x: dx }, { opacity: 1, x: 0, duration: len * 0.3, ease: 'power2.out' }, Math.max(0, a - 0.02));
        if (i < CAPTIONS.length - 1) {
          tl.to(el, { opacity: 0, x: -dx * 0.6, duration: len * 0.25, ease: 'power2.in' }, b - len * 0.25);
        }
      });
    }, root);

    return () => {
      window.removeEventListener('resize', resize);
      ctx.revert();
      imgs.forEach((img) => img && (img.onload = img.onerror = null));
    };
  }, []);

  return (
    <section className="sequence" id="experience" ref={root} aria-label="L'expérience espresso">
      <div className="sequence-bgword" ref={word} aria-hidden="true">
        espresso · crema · rituel
      </div>
      <canvas
        ref={canvas}
        role="img"
        aria-label="Vidéo : des grains de café versés dans le moulin, le tassage, l'extraction d'un espresso puis un latte art"
      />
      <div className="sequence-shade" aria-hidden="true" />

      {CAPTIONS.map((c, i) => (
        <div className={`caption ${c.side}`} key={i}>
          <div className="caption-inner" data-caption={i}>
            <span className="kicker">{c.kicker}</span>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </div>
        </div>
      ))}

      <div className="sequence-hud" aria-hidden="true">
        <span>
          <span ref={counter}>001</span> / {SEQUENCE.frames}
        </span>
        <div className="track">
          <div className="fill" ref={fill} />
        </div>
        <span>Du grain à la tasse</span>
      </div>
    </section>
  );
}
