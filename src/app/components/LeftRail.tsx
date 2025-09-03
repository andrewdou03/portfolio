'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type SectionDef = { id: string; label: string };

export default function LeftRail({ sections }: { sections: SectionDef[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!rail.current || !progress.current) return;

    const ctx = gsap.context(() => {
      const dots   = gsap.utils.toArray<HTMLDivElement>('.rail-dot');
      const labels = gsap.utils.toArray<HTMLSpanElement>('.rail-label');

      const n   = Math.max(1, dots.length);
      const eps = 1e-4;

      // Evenly spaced thresholds by index, padded away from edges
      const padLo = 0.02, padHi = 0.96;
      const thresholds = n === 1
        ? [0.5]
        : Array.from({ length: n }, (_, i) => padLo + (padHi - padLo) * (i / (n - 1)));

      let prevProgress = 0; // last progress 0..1
      let activeIndex  = -1;

      // Keep one item active (hard-set so it persists and doesn’t fight tweens)
      const setActive = (idx: number) => {
        if (idx === activeIndex) return;

        if (activeIndex >= 0) {
          const oldDot = dots[activeIndex], oldLab = labels[activeIndex];
          if (oldDot && oldLab) {
            gsap.killTweensOf([oldDot, oldLab]);
            gsap.set(oldDot, { scale: 1 });
            gsap.set(oldLab, { scale: 1, color: 'rgba(255,255,255,0.7)' });
          }
        }

        if (idx >= 0) {
          const newDot = dots[idx], newLab = labels[idx];
          if (newDot && newLab) {
            gsap.killTweensOf([newDot, newLab]);
            gsap.set(newDot, { scale: 1.15 });
            gsap.set(newLab, { scale: 1.08, color: '#fff' });
          }
        }

        activeIndex = idx;
      };

      // Pop + sparkle on crossing (downward only), starting from current scale
      const hit = (i: number) => {
        const dot = dots[i], lab = labels[i];
        if (!dot || !lab) return;

        // read current transform scale so we don’t snap back to 1.0
        const ds = Number(gsap.getProperty(dot, 'scale')) || 1;
        const ls = Number(gsap.getProperty(lab, 'scale')) || 1;

        gsap.killTweensOf([dot, lab]);

        const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
        tl.fromTo(dot, { scale: ds }, { scale: 1.35, duration: 0.18, ease: 'back.out(3)' })
          .to(dot,       { scale: 1.15, duration: 0.14 }, '>-0.06')
          .fromTo(lab,  { scale: ls }, { scale: 1.10, duration: 0.22, ease: 'back.out(2)' }, 0)
          .to(lab,       { scale: 1.08, duration: 0.14 }, '>-0.06');

        // Sparkle burst at the dot center (viewport coords)
        const r  = dot.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top  + r.height / 2;

        const nPieces = 8;
        const pieces: HTMLSpanElement[] = [];
        for (let k = 0; k < nPieces; k++) {
          const sp = document.createElement('span');
          sp.className = 'spark';
          document.body.appendChild(sp);
          pieces.push(sp);
        }
        gsap.set(pieces, { position: 'fixed', left: cx, top: cy, opacity: 1, scale: 0.3 });

        const burst = gsap.timeline({ onComplete: () => pieces.forEach(p => p.remove()) });
        pieces.forEach((p, idx) => {
          const a = (idx / nPieces) * Math.PI * 2;
          burst.to(p, {
            left: cx + Math.cos(a) * 36,
            top:  cy + Math.sin(a) * 36,
            opacity: 0,
            scale: 1,
            duration: 0.45,
            ease: 'power2.out',
          }, 0);
        });
      };

      // Drive the fill and handle crossings + active
      gsap.to(progress.current, {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: document.scrollingElement || document.documentElement,
          start: 'top top',
          end: 'max', // full scroll distance
          scrub: true,
          onRefreshInit(self: ScrollTrigger) {
            prevProgress = self.progress;
            const idx = Math.max(0, Math.min(n - 1, Math.floor((self.progress + eps) * (n - 1))));
            setActive(idx);
          },
          onRefresh(self: ScrollTrigger) {
            prevProgress = self.progress;
            const idx = Math.max(0, Math.min(n - 1, Math.floor((self.progress + eps) * (n - 1))));
            setActive(idx);
          },
          onUpdate(self: ScrollTrigger) {
            const p = Math.min(1, Math.max(0, self.progress));

            // Sparkle only when going DOWN past a threshold
            for (let i = 0; i < thresholds.length; i++) {
              const t = thresholds[i];
              if (prevProgress + eps < t && t <= p + eps) {
                // mark it active first so hit() reads current scale correctly
                setActive(i);
                hit(i);
              }
            }

            // Keep one active based on progress (prevents missing late dots)
            const newActive = Math.max(0, Math.min(n - 1, Math.floor((p + eps) * (n - 1))));
            setActive(newActive);

            prevProgress = p;
          },
        },
      });
    }, rail);

    return () => ctx.revert();
  }, [sections]);

  return (
    <aside className="relative z-[60]">
      {/* Wider column so labels have room */}
      <div ref={rail} className="sticky top-0 h-screen w-32 flex items-center">
        {/* 2-col grid: [3px bar | labels column] */}
        <div className="relative mx-auto h-4/5 w-full grid grid-cols-[3px_1fr]">
          {/* Bar column (3px) */}
          <div className="relative z-0">
            <div className="absolute inset-0 bg-white/15 rounded" />
            <div
              ref={progress}
              className="absolute left-0 top-0 w-full bg-white/60 rounded"
              style={{ height: 0 }}
            />
          </div>

          {/* Dots + labels column (above bar) */}
          <div className="relative z-10">
            <div className="absolute inset-0 flex flex-col justify-between py-1">
              {sections.map((s) => (
                <div key={s.id} className="relative h-7">
                  {/* Dot centered over the bar centerline:
                      bar is 3px wide in the column to the LEFT; this column’s left edge is that boundary.
                      Setting left:-1.5px and translateX(-50%) puts the dot’s center exactly on the bar center. */}
                  <div
                    className="rail-dot absolute top-1/2 -translate-x-1/2 -translate-y-1/2
                               h-3 w-3 rounded-full bg-white shadow z-20 ring-2 ring-black/20"
                    style={{ left: '-1.5px' }}
                  />
                  {/* Label to the right; inline-block so transforms persist */}
                  <span
                    className="rail-label absolute left-5 top-1/2 -translate-y-1/2 inline-block
                               text-[10px] font-medium text-white/70"
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
