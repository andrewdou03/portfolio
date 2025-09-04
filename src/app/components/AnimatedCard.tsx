'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

export type Project = {
  id: string;
  title: string;
  blurb: string;
  tools: string[];
  skills: string[];
  shot: string; // image path in /public
  url: string;  // target link
};

type AnimatedCardProps = {
  project: Project;
  defaultOpen?: boolean;
};

export default function AnimatedCard({ project, defaultOpen = false }: AnimatedCardProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const regionId = React.useId();

  return (
    <Card
      className="overflow-hidden border border-white/10 bg-white/5 rounded-xl backdrop-blur-[1px]"
      style={{ willChange: 'transform, height, opacity' }}
    >
      <CardContent className="p-0">
        {/* Summary row (always visible) */}
        <div className="flex items-start gap-4 p-4 md:p-5">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl md:text-2xl font-semibold text-white truncate">
              {project.title}
            </h3>
            <p className="mt-1 text-white/90">
              {project.blurb}
            </p>
          </div>

          {/* Toggle button (circle, spins icon on change) */}
          <motion.div
            initial={false}
            animate={{ rotate: open ? 360 : 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <Button
              type="button"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur"
              aria-expanded={open}
              aria-controls={regionId}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              <span className="sr-only">{open ? 'Collapse' : 'Expand'}</span>
            </Button>
          </motion.div>
        </div>

        {/* Expandable area */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="content"
              id={regionId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.45, ease: 'easeInOut' },
                opacity: { duration: 0.3 }
              }}
              className="px-4 pb-4 md:px-5 md:pb-5"
            >
              {/* Badges FIRST */}
              <div className="flex flex-wrap gap-2">
                {project.tools.map((t) => (
                  <Badge key={t} className="bg-white/15 text-white">{t}</Badge>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {project.skills.map((s) => (
                  <Badge key={s} variant="outline" className="border-white/40 text-white">
                    {s}
                  </Badge>
                ))}
              </div>

              {/* Linked image with hover scale */}
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-4 block"
                aria-label={`${project.title} – open site in a new tab`}
              >
                <div className="relative overflow-hidden rounded-md ring-1 ring-white/10 bg-white/5 aspect-[16/10]">
                  <Image
                    src={project.shot}
                    alt={`${project.title} preview`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    priority={false}
                  />
                </div>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
