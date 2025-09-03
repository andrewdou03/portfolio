'use client';

import AnimatedCard, { Project } from '../AnimatedCard'; // adjust path

const PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'NextStore',
    blurb:
      'A mock modern ecommerce store built using Next 15, React 19, TypeScript, PostgreSQL and Prisma.',
    tools: ['Next.js', 'React', 'TypeScript', 'PostgreSQL', 'Prisma', 'OAuth', 'Stripe/Paypal', 'Shadcn UI', 'Tailwind'],
    skills: ['Full Stack Development', 'Authentication/Admin Functionality'],
    shot: '/images/NextStorePreview.png',
  },
  {
    id: 'proj-2',
    title: 'Portfolio Site',
    blurb:
      'This portfolio site itself, with scroll-triggered animations and 3D models.',
    tools: ['Next.js', 'GSAP', 'Three.js', 'React Three Fiber', 'Tailwind', 'Shadcn UI', 'Blender'],
    skills: ['UX design', '3D Modeling', 'Animation'],
    shot: '/images/portfolioPreview.png',
  },
  {
    id: 'proj-3',
    title: 'ProShop',
    blurb:
      'Modern mock ecommerce site built using the MERN stack (MongoDB, Express, React, Node.js).',
    tools: ['React', 'Express', 'MongoDB', 'Node.js', 'Tailwind'],
    skills: ['Full Stack Development', 'Authentication/Admin Functionality'],
    shot: '/images/proShopPreview.png',
  },
  {
    id: 'proj-4',
    title: 'Morphing Holograms',
    blurb:
      'A demo of a 3D morphing hologram effect using Three.js/React Three Fiber',
    tools: ['Next.js', 'Three.js', 'React Three Fiber', 'GLSL'],
    skills: ['Shader Programming', 'Animation'],
    shot: '/images/hologramPreview.png',
  },
  {
    id: 'proj-5',
    title: '7 Wonders Diagram',
    blurb:
      'An interactive diagram of the 7 Wonders of the Ancient World using Three.js/React Three Fiber.',
    tools: ['Next.js', 'Three.js', 'React Three Fiber', 'GLSL'],
    skills: ['Shader Programming', 'Animation'],
    shot: '/images/earthDiagramPreview.png',
  },
  {
    id: 'proj-6',
    title: 'Flixx Movie App',
    blurb:
      'A movie browsing app using HTML, CSS, and vanilla JS. Data is pulled from TMDB API.',
    tools: ['JS', 'HTML', 'CSS', 'TMDB API'],
    skills: ['Frontend Development', 'API Integration'],
    shot: '/images/flixxPreview.png',
  },
];

export default function WorkSection() {
  return (
    <section id="work" className="min-h-screen py-24">
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-semibold text-white">Work</h2>
        <p className="mt-2 max-w-prose text-white">
          Cards expand when they cross the center of the viewport.
        </p>
      </div>

      <div className="space-y-5">
        {PROJECTS.map((p) => (
          <AnimatedCard key={p.id} project={p} />
        ))}
        <div className="h-[60vh]" />
      </div>
    </section>
  );
}
