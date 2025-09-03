'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MEDIA_PCT_COMPACT = 34;
const MEDIA_PCT_FOCUS   = 60;
const VIEWPORT_H_COMPACT = 110;
const VIEWPORT_H_FOCUS   = 340;
const COMPACT_H  = 120;
const EXPANDED_H = 560;

export type Project = {
  id: string;
  title: string;
  blurb: string;
  tools: string[];
  skills: string[];
  shot: string;
};

type AnimatedCardProps = { project: Project };

export default function AnimatedCard({ project }: AnimatedCardProps) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!el.current) return;

    const ctx = gsap.context(() => {
      const card     = el.current as HTMLDivElement;
      const inner    = card.querySelector<HTMLElement>('.work-inner');
      const grid     = card.querySelector<HTMLElement>('.work-grid');
      const viewport = card.querySelector<HTMLElement>('.media-viewport');
      if (!inner || !grid || !viewport) return;

      // Base compact styles
      gsap.set(card,     { height: COMPACT_H, borderRadius: 16, opacity: 0.95 });
      gsap.set(inner,    { scale: 0.96, opacity: 0.92 });
      gsap.set(grid as any,     { '--media': MEDIA_PCT_COMPACT } as any);
      gsap.set(viewport as any, { '--vh': VIEWPORT_H_COMPACT } as any);

      // Open-state timeline
      const tl = gsap.timeline({ paused: true });
      tl.to(card, {
          height: EXPANDED_H,
          opacity: 1,
          boxShadow: '0 16px 48px rgba(0,0,0,0.28)',
          duration: 0.8,
          ease: 'power2.out',
        }, 0)
        .to(inner, { scale: 1, opacity: 1, duration: 0.7, ease: 'power2.out' }, 0)
        .to(grid as any,     { '--media': MEDIA_PCT_FOCUS, duration: 0.8, ease: 'power2.out' } as any, 0)
        .to(viewport as any, { '--vh': VIEWPORT_H_FOCUS,   duration: 0.8, ease: 'power2.out' } as any, 0);

      // Tight, center-biased activation band
      const trig = ScrollTrigger.create({
        trigger: card,
        start: 'top center+=140',     // don’t activate until the card is more centered
        end:   'bottom center-=140',  // deactivate a bit before it leaves center
        invalidateOnRefresh: true,
        onToggle(self) {
          gsap.to(tl, { progress: self.isActive ? 1 : 0, duration: 0.55, ease: 'power2.out' });
        },
        onRefresh(self) {
          gsap.set(tl, { progress: self.isActive ? 1 : 0 });
        },
      });

      return () => {
        trig.kill();
        tl.kill();
      };
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <Card
      ref={el}
      className="work-card overflow-hidden border border-white/10 bg-white/5 rounded-xl"
      style={{ willChange: 'transform, height, opacity' }}
    >
      <CardContent className="p-0">
        <div className="work-inner">
          <div
            className="work-grid grid h-full"
            style={
              {
                ['--media' as any]: MEDIA_PCT_COMPACT,
                gridTemplateColumns:
                  'minmax(0, calc(var(--media) * 1%)) minmax(0, calc(100% - var(--media) * 1%))',
                gap: 0,
              } as React.CSSProperties
            }
          >
            <div className="work-media relative">
              <div
                className="media-viewport relative overflow-hidden rounded-md ring-1 ring-white/10 bg-white/5"
                style={
                  {
                    ['--vh' as any]: VIEWPORT_H_COMPACT,
                    height: 'calc(var(--vh) * 1px)',
                  } as React.CSSProperties
                }
              >
                <Image
                  src={project.shot}
                  alt={`${project.title} preview`}
                  fill
                  sizes="(max-width: 1024px) 40vw, 480px"
                  className="object-cover"
                  priority={false}
                />
              </div>
            </div>

            <div className="p-4 md:p-5">
              <CardHeader className="p-0">
                <CardTitle className="text-2xl text-white">{project.title}</CardTitle>
              </CardHeader>
              <p className="mt-2 text-white">{project.blurb}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {project.tools.map((t) => (
                  <Badge key={t} className="bg-white/15 text-white">
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {project.skills.map((s) => (
                  <Badge key={s} variant="outline" className="border-white/40 text-white">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
