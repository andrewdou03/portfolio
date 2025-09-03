import { useEffect, useRef } from 'react';

type Speed = 'slow' | 'normal' | 'fast';
type Direction = 'left' | 'right';

export default function InfiniteScroller({
  items,
  speed = 'normal',
  direction = 'left',
  className = '',
}: {
  items: string[];
  speed?: Speed;
  direction?: Direction;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scroller = scrollerRef.current;
    const inner = innerRef.current;
    if (!scroller || !inner) return;

    if (reduce) return; // no animation, no dupes

    scroller.setAttribute('data-animated', 'true');

    // duplicate once so 200% width → seamless loop at -50%
    const children = Array.from(inner.children);
    children.forEach((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.setAttribute('aria-hidden', 'true');
      inner.appendChild(clone);
    });
  }, []);

  const duration =
    speed === 'slow' ? 60 : speed === 'fast' ? 20 : 40; // seconds

  return (
    <div
      ref={scrollerRef}
      className={`scroller relative ${className}`}
      data-direction={direction}
      style={
        {
          // @ts-ignore CSS var
          '--duration': `${duration}s`,
        } as React.CSSProperties
      }
    >
      <ul ref={innerRef} className="scroller__inner">
        {items.map((word, i) => (
          <li
            key={`${word}-${i}`}
            className="select-none px-3 py-1.5 text-xs sm:text-sm uppercase tracking-wide text-white/85 "
          >
            {word}
          </li>
        ))}
      </ul>

      {/* Scoped styles for the marquee */}
      <style jsx>{`
        .scroller {
          /* keep it narrow so ~3 pills are visible */
          max-width: 22rem; /* tweak if you want more/less */
        }
        .scroller__inner {
          padding-block: 0.25rem;
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap; /* default (no animation) */
          align-items: center;
        }
        .scroller[data-animated='true'] {
          overflow: hidden;
          /* fade the sides (white = visible, transparent = hidden) */
          -webkit-mask-image: linear-gradient(
            90deg,
            transparent,
            #fff 15%,
            #fff 85%,
            transparent
          );
          mask-image: linear-gradient(
            90deg,
            transparent,
            #fff 15%,
            #fff 85%,
            transparent
          );
        }
        .scroller[data-animated='true'] .scroller__inner {
          width: max-content;
          flex-wrap: nowrap;
          animation: i-scroll var(--duration) linear infinite;
          animation-direction: ${direction === 'right' ? 'reverse' : 'normal'};
        }
        @keyframes i-scroll {
          to {
            transform: translateX(calc(-50% - 0.375rem)); /* gap/2 */
          }
        }
      `}</style>
    </div>
  );
}