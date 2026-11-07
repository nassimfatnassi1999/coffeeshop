'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { STATS } from '@/lib/data';

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Section claire : citation qui s'éclaire mot à mot + compteurs. */
export default function Stats() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      SplitText.create('.stats-quote', {
        type: 'words',
        wordsClass: 'word',
        autoSplit: true,
        onSplit: (self) =>
          gsap.fromTo(
            self.words,
            { opacity: 0.14 },
            {
              opacity: 1,
              stagger: 0.1,
              ease: 'none',
              scrollTrigger: { trigger: '.stats-quote', start: 'top 80%', end: 'bottom 45%', scrub: true },
            }
          ),
      });

      gsap.utils.toArray('.stat').forEach((stat, i) => {
        const valueEl = stat.querySelector('.num');
        const target = STATS[i].value;
        const o = { v: 0 };
        gsap.to(o, {
          v: target,
          duration: 2,
          ease: 'power3.out',
          scrollTrigger: { trigger: stat, start: 'top 88%' },
          onUpdate: () => (valueEl.textContent = Math.round(o.v)),
        });
        gsap.from(stat, {
          y: 50,
          opacity: 0,
          duration: 1,
          delay: i * 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: stat, start: 'top 90%' },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="stats" ref={root} aria-label="Nos chiffres">
      <span className="kicker">Le rituel en chiffres</span>
      <p className="stats-quote">
        Nous croyons qu’un café exceptionnel ne doit rien au hasard : il naît de producteurs passionnés, d’une
        torréfaction patiente et d’une extraction précise, à chaque tasse.
      </p>
      <div className="stats-grid">
        {STATS.map((s) => (
          <div className="stat" key={s.label}>
            <div className="value">
              <span className="num">{s.value}</span>
              {s.suffix}
            </div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
