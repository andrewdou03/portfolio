'use client';
import InfiniteScroller from './InfiniteScroller';
import { useFeatureFlagVariantKey } from 'posthog-js/react';

export default function HeroOverlay() {
  const titleVariant = useFeatureFlagVariantKey('hero-title-test');

  return (
    <div
      className="
        pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 z-10
        flex w-full max-w-[90rem] flex-col items-center gap-3 px-4 py-4
      "
    >
      {/* Title */}
      <h1
        className="
          pointer-events-auto text-center font-semibold tracking-tight text-white/95
          text-2xl sm:text-3xl md:text-4xl
        "
      >
        <span>Andrew Dou</span>
        <span className="mx-3 text-white/40">|</span>
        <span>
          {titleVariant === 'test' ? 'Web Designer + Development' : 'Creative Web Developer'}
        </span>
      </h1>

      {/* Infinite scroller */}
      <div className="pointer-events-auto">
        <InfiniteScroller
          items={['gsap', 'threejs', 'nextjs', 'mern', 'blender', 'photoshop', 'framer', 'prisma', 'zod']}
          speed="fast"
          direction="left"
        />
      </div>
    </div>
  );
}