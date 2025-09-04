'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Sparkles, Download, MessageSquare } from 'lucide-react';

type ChatMessage = { id: string; role: 'user' | 'assistant' | 'system'; content: string };

const SUGGESTIONS = [
  'Can you give me an example of collaborating with designers or backend developers?',
  'How do you keep 3D-heavy websites performant?',
  'What are some basic facts about yourself?',
  'Which project best shows your ability to handle both frontend and full-stack tasks?',
];

export default function AboutSection() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState('');

  // Chat viewport ref (scroll only inside this, never the page)
  const chatViewportRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(0);

  // Scroll to bottom only when a new message is appended
  useEffect(() => {
    if (!chatViewportRef.current) return;
    if (messages.length > prevLenRef.current) {
      const el = chatViewportRef.current;
      el.scrollTop = el.scrollHeight;
    }
    prevLenRef.current = messages.length;
  }, [messages.length]);

  const canSend = input.trim().length > 0 && !pending;

  const handleAsk = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: question };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setPending(true);

    try {
      const res = await fetch('/api/about-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = (await res.json()) as { content: string };
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: data.content }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            "I couldn't fetch that just now. Try again, or check my resume for a quick overview.",
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  return (
    <section id="about" className="min-h-[60vh] py-20">
      <div className="mx-auto max-w-4xl">
        {/* Header / Summary (no profile image) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 data-rail-anchor className="text-4xl md:text-5xl font-semibold tracking-tight text-white">About Me</h2>
          <p className="mt-3 text-white/80 max-w-2xl mx-auto">
            Front-end & creative developer focused on Next.js, React Three Fiber/Three.js, and animation.
            I build immersive, performant interfaces with a strong UX foundation.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Button asChild variant="secondary" className="rounded-full">
              <a href="/resume.pdf" target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" /> View Resume
              </a>
            </Button>
            <Button asChild className="rounded-full">
              <a href="#contact">
                <Sparkles className="mr-2 h-4 w-4" /> Contact Me
              </a>
            </Button>
          </div>
        </motion.div>

        {/* Compact Chat */}
        <div className="mt-8 space-y-4">
          <Card className="rounded-2xl border-white/10 bg-white/5 overflow-hidden">
            <CardContent className="p-0">
              <div className="px-4 py-2 border-b border-white/10">
                <p className="text-xs text-white/60">
                  Ask about my work, stack, or process — quick answers from my own data.
                </p>
              </div>

              {/* Smaller message area (no page scroll, only this div) */}
              <div ref={chatViewportRef} className="h-40 overflow-y-auto">
                <div className="p-3 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-white/60 text-xs">
                      Tip: send a question or tap a suggestion below.
                    </p>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-white text-black'
                            : 'bg-black/60 text-white border border-white/10'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {pending && (
                    <div className="flex items-center gap-2 text-white/70 text-xs">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                    </div>
                  )}
                </div>
              </div>

              {/* Single-line input row */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAsk();
                }}
                className="px-3 py-2 border-t border-white/10 flex items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  // Better than "ask me about myself"
                  placeholder="Ask about my React/R3F work, animation approach, or a specific project…"
                  className="h-9 text-[13px] bg-black/40 border-white/15 text-white placeholder:text-white/40"
                />
                <Button type="submit" size="sm" disabled={!canSend} className="h-9 px-3 shrink-0">
                  {pending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Suggestion pills BELOW the chat */}
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35 }}
              className="flex flex-wrap gap-3"
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleAsk(s)}
                  className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/90 hover:bg-white/10 transition"
                >
                  <span className="rounded-md bg-white/10 p-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-white/80" />
                  </span>
                  <span>{s}</span>
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
