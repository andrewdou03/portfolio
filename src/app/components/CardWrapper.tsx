// components/CardWrapper.tsx
'use client';

import React from 'react';
import { useInView } from 'react-intersection-observer';

type Props = {
  children: React.ReactNode;
  placeholder: React.ReactNode;
};

export default function CardWrapper({ children, placeholder }: Props) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: '0px 0px 200px 0px', // preload just before entering
    threshold: 0,
  });

  return (
    <div ref={ref}>
      {inView ? children : placeholder}
    </div>
  );
}
