'use client';

import * as React from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

type Props = {
  previewUrl?: string;     // live site (use /embed when possible)
  shot?: string;           // /public path to screenshot (e.g. /shots/foo.jpg)
  alt: string;
  className?: string;
  preferLive?: boolean;    // default true
  fadeSides?: boolean;     // default true
};

export default function MediaPreview({
  previewUrl,
  shot,
  alt,
  className = '',
  preferLive = true,
  fadeSides = true,
}: Props) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [mountFrame, setMountFrame]   = React.useState(false);
  const [frameLoaded, setFrameLoaded] = React.useState(false);
  const [blocked, setBlocked]         = React.useState(false);
  const [interactive, setInteractive] = React.useState(false);

  const canTryLive = !!previewUrl && preferLive;

  // Lazy-mount near viewport
  React.useEffect(() => {
    if (!canTryLive) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (ents) => ents.forEach(e => e.isIntersecting && setMountFrame(true)),
      { root: null, rootMargin: '300px', threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [canTryLive]);

  // If iframe never loads, assume blocked by XFO/CSP
  React.useEffect(() => {
    if (!canTryLive || !mountFrame || frameLoaded) return;
    const id = setTimeout(() => { if (!frameLoaded) setBlocked(true); }, 2500);
    return () => clearTimeout(id);
  }, [canTryLive, mountFrame, frameLoaded]);

  const showIframe = canTryLive && mountFrame && !blocked;

  return (
    <div
      ref={wrapRef}
      className={[
        'absolute inset-0 overflow-hidden rounded-md bg-white/5 ring-1 ring-white/10 backdrop-blur-[1px]',
        className,
      ].join(' ')}
    >
      {fadeSides && (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            WebkitMaskImage:
              'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
            maskImage:
              'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
          }}
        />
      )}

      {/* LIVE (if allowed) */}
      {showIframe && (
        <>
          <iframe
            src={previewUrl}
            title={alt}
            className={[
              'absolute inset-0 h-full w-full transition-opacity duration-500',
              frameLoaded ? 'opacity-100' : 'opacity-0',
              interactive ? 'pointer-events-auto' : 'pointer-events-none',
            ].join(' ')}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setFrameLoaded(true)}
          />
          <div className="absolute bottom-2 right-2 z-20">
            <button
              onClick={() => setInteractive(v => !v)}
              className="rounded-md border border-white/20 bg-black/40 px-2 py-1 text-[10px] uppercase tracking-wide text-white hover:bg-black/60"
            >
              {interactive ? 'Disable' : 'Interact'}
            </button>
          </div>
        </>
      )}

      {/* FALLBACK → SCREENSHOT (if provided) */}
      {(!showIframe && shot) && (
        <>
          <Image
            src={shot}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 40vw, 400px"
            className="object-cover"
            priority={false}
          />
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-2 z-20 rounded-md border border-white/20 bg-black/40 px-2 py-1 text-[10px] uppercase tracking-wide text-white hover:bg-black/60 inline-flex items-center gap-1"
            >
              View live <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </>
      )}

      {/* Last resort: simple message */}
      {(!showIframe && !shot) && (
        <div className="absolute inset-0 grid place-items-center text-white/80 text-xs">
          Preview unavailable
        </div>
      )}
    </div>
  );
}
