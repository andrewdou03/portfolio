'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import LeftRail from './components/LeftRail';
import Section from './components/Section';
import WorkSection from './components/sections/WorkSection2';
import HomeSection from './components/sections/HomeSection';
import AboutSection from './components/sections/AboutSection';

gsap.registerPlugin(ScrollTrigger);

const SECTIONS = [
  { id: 'hero',    label: 'Intro',   bg: '#000000' },
  { id: 'about',   label: 'About',   bg: '#000000' },
  { id: 'work',    label: 'Work',    bg: '#000000' },
  { id: 'contact', label: 'Contact', bg: '#f1a753' },
];

export default function Page() {
  const root = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!root.current || !backdrop.current) return;

    const ctx = gsap.context(() => {
      const colors = SECTIONS.map((s) => s.bg);

      // one trigger per section; active while the section spans viewport center
      SECTIONS.forEach((s, i) => {
        ScrollTrigger.create({
          trigger: `#${s.id}`,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle(self) {
            if (self.isActive && backdrop.current) {
              gsap.to(backdrop.current, {
                backgroundColor: colors[i],
                duration: 0.6,
                ease: 'power2.out',
                overwrite: 'auto',
              });
            }
          },
        });
      });

      // initial color based on which section contains the viewport center
      const setInitial = () => {
        const mid =
          (document.scrollingElement?.scrollTop ?? window.scrollY) +
          window.innerHeight / 2;
        let idx = 0;
        for (let i = 0; i < SECTIONS.length; i++) {
          const el = document.getElementById(SECTIONS[i].id);
          if (!el) continue;
          const top = el.offsetTop;
          const bottom = top + el.offsetHeight;
          if (mid >= top && mid <= bottom) {
            idx = i;
            break;
          }
        }
        gsap.set(backdrop.current, { backgroundColor: colors[idx] });
      };

      setInitial();
      ScrollTrigger.addEventListener('refresh', setInitial);
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={root} className="relative min-h-screen">
      {/* Backdrop layer for color blending */}
      <div
        ref={backdrop}
        className="fixed inset-0 -z-10 transition-colors"
        style={{ background: SECTIONS[0].bg }}
      />

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-[64px_1fr] gap-6">
          {/* Left rail only needs id/label */}
          <LeftRail sections={SECTIONS.map(({ id, label }) => ({ id, label }))} />

          <div>
            {/* Render each section; replace 'work' with the WorkSection component */}
            {SECTIONS.map((s) =>
              s.id === 'work' ? (
                <WorkSection key="work" />
              ) : s.id === 'hero' ? (
                <HomeSection key="hero" />
              ) : s.id === 'about' ? (
                <AboutSection key="about" />
              ) : (
                <Section key={s.id} id={s.id} label={s.label}>
                  <div className="max-w-2xl">
                    <h2 className="text-5xl font-bold mb-4">{s.label}</h2>
                    <p className="text-white">
                      Lorem ipsum dolor sit amet, section {s.label}. Add content here.
                    </p>
                  </div>
                </Section>
              )
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
