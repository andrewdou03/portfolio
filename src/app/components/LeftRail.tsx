'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type SectionDef = { id: string; label: string };

export default function LeftRail({ sections }: { sections: SectionDef[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);

  // Align the fixed rail to its parent grid column (parent wrapper must be `relative`)
  useLayoutEffect(() => {
    if (!rail.current) return;

    const align = () => {
      const parent = rail.current!.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      rail.current!.style.left = `${rect.left}px`;
      rail.current!.style.width = `${rect.width}px`;
    };

    align();
    const parent = rail.current.parentElement!;
    const ro = new ResizeObserver(align);
    ro.observe(parent);
    window.addEventListener('resize', align, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', align);
    };
  }, []);

  // Click label/dot → scroll so anchor sits at viewport center
  const scrollToSection = (id: string) => {
    const sec = document.getElementById(id);
    if (!sec) return;
    const anchor =
      (sec.querySelector('[data-rail-anchor]') as HTMLElement) ||
      (sec.querySelector('h2') as HTMLElement) ||
      sec;

    const rect = anchor.getBoundingClientRect();
    const target =
      rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2;
    window.scrollTo({ top: target, behavior: 'smooth' });
  };

  useLayoutEffect(() => {
    if (!rail.current || !progress.current) return;

    const ctx = gsap.context(() => {
      const dots   = gsap.utils.toArray<HTMLDivElement>('.rail-dot');
      const labels = gsap.utils.toArray<HTMLSpanElement>('.rail-label');
      const n = Math.max(1, dots.length);

      // Evenly spaced thresholds along the bar (0..1) with padding
      const padLo = 0.02, padHi = 0.96;
      const thresholds =
        n === 1
          ? [0.5]
          : Array.from({ length: n }, (_, i) => padLo + (padHi - padLo) * (i / (n - 1)));

      // --- Anchors (support data-rail-offset="40vh|320px|number") ---
      type Anchor = { id: string; el: HTMLElement; y: number };
      let anchors: Anchor[] = [];

      const getAnchorFor = (id: string): HTMLElement | null => {
        const sec = document.getElementById(id);
        if (!sec) return null;
        const explicit = sec.querySelector('[data-rail-anchor]') as HTMLElement | null;
        if (explicit) return explicit;
        const h2 = sec.querySelector('h2') as HTMLElement | null;
        return h2 || sec;
      };

      const getOffsetPx = (el: HTMLElement): number => {
        const raw = el.getAttribute('data-rail-offset')?.trim();
        if (!raw) return 0;
        if (raw.endsWith('vh'))  return (window.innerHeight * parseFloat(raw)) / 100 || 0;
        if (raw.endsWith('px'))  return parseFloat(raw) || 0;
        return parseFloat(raw) || 0;
      };

      const measure = () => {
        const scrollY = document.scrollingElement?.scrollTop ?? window.scrollY;
        anchors = sections
          .map((s) => {
            const el = getAnchorFor(s.id);
            return el ? { id: s.id, el, y: 0 } : null;
          })
          .filter(Boolean) as Anchor[];

        anchors.forEach((a) => {
          const r = a.el.getBoundingClientRect();
          a.y = r.top + scrollY + getOffsetPx(a.el);
        });
        anchors.sort((a, b) => a.y - b.y);
      };

      // --- Activation (only after crossing each dot's threshold) ---
      let activeIndex = -1;
      let lastCrossed = -1;

      const setActive = (idx: number) => {
        if (idx === activeIndex) return;

        if (activeIndex >= 0) {
          const oldDot = dots[activeIndex];
          const oldLab = labels[activeIndex];
          if (oldDot && oldLab) {
            gsap.killTweensOf([oldDot, oldLab]);
            gsap.set(oldDot, { scale: 1 });
            gsap.set(oldLab, { scale: 1, color: 'rgba(255,255,255,0.7)' });
          }
        }

        if (idx >= 0) {
          const newDot = dots[idx];
          const newLab = labels[idx];
          if (newDot && newLab) {
            gsap.killTweensOf([newDot, newLab]);
            gsap.set(newDot, { scale: 1.15 });
            gsap.set(newLab, { scale: 1.3, color: '#fff' }); // transform only; origin-left on the element
          }
        }

        activeIndex = idx;
      };

      // --- Update: compute fill t, set bar, choose highest crossed threshold ---
      const update = () => {
        if (!progress.current || anchors.length === 0) return;

        const scrollY = document.scrollingElement?.scrollTop ?? window.scrollY;

        // When at the very bottom, visually fill to 100% to avoid a tiny gap
        const doc = document.documentElement;
        const maxScroll = doc.scrollHeight - window.innerHeight;
        const isBottom = scrollY >= maxScroll - 2;

        const midY = scrollY + window.innerHeight / 2;

        let t: number;
        if (midY <= anchors[0].y) {
          t = thresholds[0];
        } else if (midY >= anchors[anchors.length - 1].y) {
          t = thresholds[thresholds.length - 1];
        } else {
          let i = 0;
          while (i < anchors.length - 1 && !(anchors[i].y <= midY && midY < anchors[i + 1].y)) 
          i++;
          const a0 = anchors[i], a1 = anchors[i + 1];
          const u = (midY - a0.y) / Math.max(1, (a1.y - a0.y)); // 0..1
          t = gsap.utils.interpolate(thresholds[i], thresholds[i + 1], u);
        }

        // drive bar fill (force 100% at absolute bottom)
        gsap.set(progress.current, { height: isBottom ? '100%' : `${t * 100}%` });

        // pick highest threshold crossed → “bar reached this dot”
        let crossed = 0;
        for (let i = 0; i < thresholds.length; i++) {
          if (t + 1e-4 >= thresholds[i]) crossed = i;
        }

        setActive(crossed);

        if (crossed > lastCrossed) {
          lastCrossed = crossed;
        }
      };

      const st = ScrollTrigger.create({
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onRefreshInit: () => { measure(); update(); },
        onRefresh: () => { measure(); update(); },
        onUpdate: update,
      });

      const onResize = () => { measure(); update(); };
      window.addEventListener('resize', onResize, { passive: true });

      measure(); update();

      return () => {
        st.kill();
        window.removeEventListener('resize', onResize);
      };
    }, rail);

    return () => ctx.revert();
  }, [sections]);

  return (
    <aside className="relative z-[60] hidden md:block">
      {/* Fixed rail aligned to column; outer spans viewport but inner track is 80% height (like before) */}
      <div ref={rail} className="fixed top-0 h-screen flex items-center pointer-events-none">
        <div className="relative h-4/5 w-full grid grid-cols-[3px_1fr] pointer-events-auto">
          {/* Track */}
          <div className="relative z-0">
            <div className="absolute inset-0 bg-white/15 rounded" />
            <div
              ref={progress}
              className="absolute left-0 top-0 w-full bg-white/60 rounded"
              style={{ height: 0 }}
            />
          </div>

          {/* Dots + labels */}
          <div className="relative z-10">
            <div className="absolute inset-0 flex flex-col justify-between py-1">
              {sections.map((s) => (
                <div key={s.id} className="relative h-8">
                  {/* Dot (clickable) */}
                  <div
                    role="button"
                    aria-label={`Scroll to ${s.label}`}
                    onClick={() => scrollToSection(s.id)}
                    className="rail-dot absolute top-1/2 -translate-x-1/2 -translate-y-1/2
                               h-3 w-3 rounded-full bg-white shadow z-20 ring-2 ring-black/20 cursor-pointer"
                    style={{ left: '-1.5px' }}
                  />
                  {/* Label (clickable) */}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => scrollToSection(s.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && scrollToSection(s.id)}
                    className="rail-label absolute left-5 top-1/2 -translate-y-1/2 inline-block
                               text-[12px] font-medium text-white/70 cursor-pointer origin-left"
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
