'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Linkedin, Github } from 'lucide-react';

export default function HeroCTAs() {
  return (
    <div
      data-rail-anchor
      className="
        pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2
        w-full px-4 pb-[env(safe-area-inset-bottom)]
      "
    >
      <div className="pointer-events-auto mx-auto flex max-w-[28rem] items-center justify-center gap-3">
        <Button
          asChild
          size="sm"
          className="backdrop-blur text-white hover:bg-white/20 border border-white/15"
        >
          {/* TODO: replace href with your resume path */}
          <Link href="/assets/resume.pdf" target="_blank" rel="noopener">
            <FileText className="mr-2 h-4 w-4" />
            Resume
          </Link>
        </Button>

        <Button
          asChild
          size="sm"
          className="backdrop-blur text-white hover:bg-white/20 border border-white/15"
        >
          <Link
            href="https://www.linkedin.com/in/andrewdou"
            target="_blank"
            rel="noopener"
          >
            <Linkedin className="mr-2 h-4 w-4" />
            LinkedIn
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="backdrop-blur text-white hover:bg-white/20 border border-white/15"
        >
          <Link
            href="https://github.com/andrewdou03"
            target="_blank"
            rel="noopener"
          >
            <Github className="mr-2 h-4 w-4" />
            Github
          </Link>
        </Button>
      </div>
    </div>
  );
}
