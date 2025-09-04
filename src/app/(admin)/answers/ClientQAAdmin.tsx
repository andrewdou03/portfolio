'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Save, Trash2, Plus } from 'lucide-react';

type QA = {
  id: string;
  category: string;
  question: string;
  sources: string[] | null;
  weight: number;
  answer: string | null;
  updatedAt: string;
};

export default function ClientQAAdmin() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [take] = useState(20);
  const [rows, setRows] = useState<QA[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const newRowRef = useRef<HTMLInputElement | null>(null);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / take)), [total, take]);

  async function load() {
    setLoading(true);
    const url = `/api/about-qa/list?q=${encodeURIComponent(q)}&page=${page}&take=${take}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    setRows(data.items);
    setTotal(data.total);
    setLoading(false);
  }

  useEffect(() => { load(); }, [q, page]); // eslint-disable-line

  async function saveRow(r: QA) {
    const payload = {
      category: r.category?.trim(),
      question: r.question?.trim(),
      sources: r.sources ?? [],
      weight: Number.isFinite(r.weight) ? r.weight : 1,
      answer: (r.answer ?? '').trim(),
    };
    setSavingId(r.id);
    const res = await fetch(`/api/about-qa/${r.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSavingId(null);
    if (!res.ok) {
      const txt = await res.text();
      alert(`Save failed: ${txt}`);
      return;
    }
    // Refresh only this page
    load();
  }

  async function delRow(id: string) {
    if (!confirm('Delete this Q&A?')) return;
    await fetch(`/api/about-qa/${id}`, { method: 'DELETE' });
    load();
  }

  async function createRow() {
    setCreating(true);
    const res = await fetch('/api/about-qa/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'General',
        question: 'New training question…',
        sources: [],
        weight: 1,
      }),
    });
    setCreating(false);
    if (!res.ok) { alert('Failed to create'); return; }
    const { item } = await res.json();
    // Prepend locally so typing doesn't get wiped by a reload race
    setRows(s => [item, ...s]);
    setTotal(t => t + 1);
    setPage(1);
    // Focus the new question input
    setTimeout(() => newRowRef.current?.focus(), 0);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input
          className="w-full rounded-md bg-neutral-900/70 border border-white/10 px-3 py-2 text-neutral-100 placeholder:text-neutral-500"
          placeholder="Search questions or answers…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <button
          onClick={createRow}
          className="inline-flex items-center gap-2 rounded-md bg-neutral-800 hover:bg-neutral-700 px-3 py-2 text-neutral-100 border border-white/10"
          disabled={creating}
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New
        </button>
      </div>

      <div className="rounded-lg border border-white/10 divide-y divide-white/10">
        {loading ? (
          <div className="p-6 text-neutral-400 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-neutral-400">No items.</div>
        ) : (
          rows.map((r, idx) => (
            <div key={r.id} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
              <input
                className="md:col-span-2 rounded-md bg-neutral-900/70 border border-white/10 px-2 py-1 text-neutral-100"
                value={r.category ?? ''}
                onChange={(e) => setRows(s => s.map(x => x.id === r.id ? { ...x, category: e.target.value } : x))}
              />
              <input
                ref={idx === 0 ? newRowRef : undefined}
                className="md:col-span-5 rounded-md bg-neutral-900/70 border border-white/10 px-2 py-1 text-neutral-100"
                value={r.question ?? ''}
                onChange={(e) => setRows(s => s.map(x => x.id === r.id ? { ...x, question: e.target.value } : x))}
              />
              <input
                className="md:col-span-2 rounded-md bg-neutral-900/70 border border-white/10 px-2 py-1 text-neutral-100"
                placeholder="sources: comma-separated URLs"
                value={(r.sources ?? []).join(', ')}
                onChange={(e) => {
                  const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  setRows(s => s.map(x => x.id === r.id ? { ...x, sources: arr } : x));
                }}
              />
              <input
                type="number"
                className="md:col-span-1 rounded-md bg-neutral-900/70 border border-white/10 px-2 py-1 text-neutral-100"
                value={Number.isFinite(r.weight) ? r.weight : 1}
                onChange={(e) => setRows(s => s.map(x => x.id === r.id ? { ...x, weight: Number(e.target.value) || 1 } : x))}
              />
              <div className="md:col-span-12">
                <textarea
                  className="w-full rounded-md bg-neutral-950/70 border border-white/10 px-2 py-2 text-neutral-100 min-h-[100px]"
                  placeholder="Your answer (raw notes are fine; chat will paraphrase)"
                  value={r.answer ?? ''}
                  onChange={(e) => setRows(s => s.map(x => x.id === r.id ? { ...x, answer: e.target.value } : x))}
                />
              </div>
              <div className="md:col-span-12 flex gap-2">
                <button
                  onClick={() => saveRow(r)}
                  className="inline-flex items-center gap-2 rounded-md bg-white/90 hover:bg-white text-black px-3 py-2"
                  disabled={savingId === r.id}
                >
                  {savingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
                <button
                  onClick={() => delRow(r.id)}
                  className="inline-flex items-center gap-2 rounded-md bg-red-500/80 hover:bg-red-500 px-3 py-2 text-white"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center text-sm text-neutral-400">
        <button
          className="px-3 py-2 rounded-md border border-white/10 hover:bg-white/5"
          disabled={page <= 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <span>Page {page} / {pages}</span>
        <button
          className="px-3 py-2 rounded-md border border-white/10 hover:bg-white/5"
          disabled={page >= pages}
          onClick={() => setPage(p => Math.min(pages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
