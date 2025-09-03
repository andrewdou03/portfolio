'use client';

import * as React from 'react';
import { motion, useReducedMotion, type Variants, type Transition } from 'framer-motion';
import AnimatedCard, { Project } from '../AnimatedCard2';

const PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'NextStore',
    blurb:
      'A mock modern ecommerce store built using Next 15, React 19, TypeScript, PostgreSQL and Prisma.',
    tools: ['Next.js', 'React', 'TypeScript', 'PostgreSQL', 'Prisma', 'OAuth', 'Stripe/Paypal', 'Shadcn UI', 'Tailwind'],
    skills: ['Full Stack Development', 'Authentication/Admin Functionality'],
    shot: '/images/NextStorePreview.png',
    url: 'https://nextjs-ecommerce-store-henna.vercel.app'
  },
  {
    id: 'proj-2',
    title: 'Portfolio Site',
    blurb:
      'This portfolio site itself, with scroll-triggered animations and 3D models.',
    tools: ['Next.js', 'GSAP', 'Three.js', 'React Three Fiber', 'Tailwind', 'Shadcn UI', 'Blender'],
    skills: ['UX design', '3D Modeling', 'Animation'],
    shot: '/images/portfolioPreview.png',
    url: '/'
  },
  {
    id: 'proj-3',
    title: 'ProShop',
    blurb:
      'Modern mock ecommerce site built using the MERN stack (MongoDB, Express, React, Node.js).',
    tools: ['React', 'Express', 'MongoDB', 'Node.js', 'Tailwind'],
    skills: ['Full Stack Development', 'Authentication/Admin Functionality'],
    shot: '/images/proShopPreview.png',
    url: 'https://proshop-6eqh.onrender.com'
  },
  {
    id: 'proj-4',
    title: 'Morphing Holograms',
    blurb:
      'A demo of a 3D morphing hologram effect using Three.js/React Three Fiber',
    tools: ['Next.js', 'Three.js', 'React Three Fiber', 'GLSL'],
    skills: ['Shader Programming', 'Animation'],
    shot: '/images/hologramPreview.png',
    url: 'https://morphing-holograms.vercel.app/'
  },
  {
    id: 'proj-5',
    title: '7 Wonders Diagram',
    blurb:
      'An interactive diagram of the 7 Wonders of the Ancient World using Three.js/React Three Fiber.',
    tools: ['Next.js', 'Three.js', 'React Three Fiber', 'GLSL'],
    skills: ['Shader Programming', 'Animation'],
    shot: '/images/earthDiagramPreview.png',
    url: 'https://earth-diagram.vercel.app'
  },
  {
    id: 'proj-6',
    title: 'Flixx Movie App',
    blurb:
      'A movie browsing app using HTML, CSS, and vanilla JS. Data is pulled from TMDB API.',
    tools: ['JS', 'HTML', 'CSS', 'TMDB API'],
    skills: ['Frontend Development', 'API Integration'],
    shot: '/images/flixxPreview.png',
    url: 'https://flixx-movie-app-beryl.vercel.app'
  }
];

export default function WorkSection() {
  const prefersReduced = useReducedMotion();

  // Type-safe easing (cubic-bezier)
  const easeOut: Transition['ease'] = [0.16, 1, 0.3, 1];

  const headerVar: Variants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 8 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
  };

  const listVar: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVar: Variants = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 10 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOut } },
  };

  return (
    <section id="work" className="min-h-screen py-24">
      <motion.div
        className="mb-8 mx-auto max-w-4xl text-center"
        variants={headerVar}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
      >
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">Work</h2>
        <p className="mt-2 mx-auto max-w-prose text-white">
          Click a card to expand and see details.
        </p>
      </motion.div>

      <motion.div
        className="space-y-5"
        variants={listVar}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {PROJECTS.map((p) => (
          <motion.div key={p.id} variants={itemVar}>
            <AnimatedCard project={p} />
          </motion.div>
        ))}
      </motion.div>

      <div className="h-[40vh]" />
    </section>
  );
}
