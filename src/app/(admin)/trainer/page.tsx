'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Loader2, ExternalLink, SkipForward, Save } from 'lucide-react';

type QA = { id: string; category: string; question: string; sources: string[] | null };
type ProgressT = { answered: number; total: number; pct: number };

export default function TrainerPage() {
  const [qa, setQa] = useState<QA | null>(null);
  const [answer, setAnswer] = useState('');
  const [progress, setProgress] = useState<ProgressT>({ answered: 0, total: 0, pct: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/about-qa/next-question', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load next question');
      const data = (await res.json()) as { next: QA | null; progress: ProgressT };
      setQa(data.next);
      setProgress(data.progress);
      setAnswer('');
    } catch (e) {
      if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr('Unexpected error');
      }
    } finally {
      setLoading(false); // or whatever cleanup
    }

  }, []);

  const saveAnswer = useCallback(async () => {
    if (!qa || !answer.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch('/api/about-qa/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qaId: qa.id, answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to save');
      await fetchNext();
    } catch (e) {
      if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr('Unexpected error');
      }
    } finally {
      setSaving(false); // or whatever cleanup
    }
  }, [qa, answer, fetchNext]);

  const skip = useCallback(async () => {
    await fetchNext();
  }, [fetchNext]);

  // hotkeys: cmd/ctrl+enter to save, cmd/ctrl+k to skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 'enter') { e.preventDefault(); saveAnswer(); }
      if (k === 'k') { e.preventDefault(); skip(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveAnswer, skip]);

  useEffect(() => { fetchNext(); }, [fetchNext]);

  const wordCount = useMemo(() => {
    const t = answer.trim();
    return t ? t.split(/\s+/).length : 0;
  }, [answer]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8 text-black">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-black">About – Self Interview</h1>
          <p className="text-black text-sm">Answer vetted, hire-ready questions that power your About chat.</p>
        </div>
        <div className="min-w-[160px] text-right">
          <div className="text-xs text-blacm mb-1">
            {progress.answered}/{progress.total} ({progress.pct}%)
          </div>
          <Progress value={progress.pct} className="h-2" />
        </div>
      </div>

      <Separator className="my-6 bg-white/10" />

      {err && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-black-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading next question…
        </div>
      ) : qa ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <Badge className="bg-neutral-800/80 text-black border border-white/10">{qa.category}</Badge>
            <div className="text-xs text-black">
              ⌘/Ctrl+Enter = Save · ⌘/Ctrl+K = Skip
            </div>
          </div>

          <h2 className="text-lg font-medium text-black">{qa.question}</h2>

          {!!qa.sources?.length && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-black">Inspired by:</span>
              {qa.sources.map((s, i) => (
                <a
                  key={`${s}-${i}`}
                  href={s}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-neutral-900/70 px-2 py-1 text-black hover:bg-neutral-800/70"
                >
                  [{i + 1}] <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Concise answer in your voice: impact → constraints → tools → results."
              className="min-h-[160px] bg-neutral-900/70 border-white/15 text-black placeholder:text-black"
            />
            <div className="flex items-center justify-between text-xs text-black">
              <span>{wordCount} words</span>
              <span>Tip: lead with impact → process → results.</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={saveAnswer} disabled={saving || !answer.trim()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save & Next
            </Button>
            <Button onClick={skip} variant="secondary" className="bg-neutral-800/70 text-black hover:bg-neutral-700">
              <SkipForward className="mr-2 h-4 w-4" />
              Skip
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-neutral-900/70 p-6">
          <h2 className="text-lg font-semibold text-black">All questions answered 🎉</h2>
          <p className="mt-1 text-black text-sm">
            Add more prompts to your seed list and re-run the seeder any time.
          </p>
        </div>
      )}
    </main>
  );
}
