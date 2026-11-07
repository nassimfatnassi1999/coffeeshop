'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { STEPS } from '@/lib/data';

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Savoir-faire : vraie vidéo de grains de café en fond + étapes. */
export default function Process() {
  const root = useRef(null);
  const video = useRef(null);

  useEffect(() => {
    // lecture uniquement quand la section est visible
    const v = video.current;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(root.current);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.process-video video',
        { yPercent: -8 },
        { yPercent: 8, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } }
      );

      SplitText.create('.process-title', {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            duration: 1.3,
            stagger: 0.12,
            ease: 'expo.out',
            scrollTrigger: { trigger: '.process-title', start: 'top 80%' },
          }),
      });

      gsap.from('.process-lead', {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.process-lead', start: 'top 88%' },
      });

      gsap.from('.step', {
        y: 90,
        opacity: 0,
        duration: 1.2,
        stagger: 0.12,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.steps', start: 'top 85%' },
      });
    }, root);

    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section className="process" id="savoir-faire" ref={root} aria-label="Notre savoir-faire">
      <div className="process-video" aria-hidden="true">
        <video ref={video} muted loop playsInline preload="metadata" poster="/video/beans-loop-poster.jpg">
          <source src="/video/beans-loop.webm" type="video/webm" />
          <source src="/video/beans-loop.mp4" type="video/mp4" />
        </video>
      </div>

      <span className="kicker">Savoir-faire</span>
      <h2 className="section-title process-title">
        Du grain à la tasse, <em>rien n’est laissé au hasard.</em>
      </h2>
      <p className="process-lead">
        Quatre étapes, des dizaines de gestes précis. C’est ce qui sépare un bon café d’un café dont on se souvient.
      </p>

      <div className="steps">
        {STEPS.map((s) => (
          <div className="step" key={s.n}>
            <span className="n">{s.n}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
