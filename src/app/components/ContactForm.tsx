'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    setLoading(false);
    if (res.ok) {
      setDone(true);
      form.reset();
    } else {
      const { error } = await res.json();
      setError(error || 'Failed to send. Try again.');
    }
  }

  if (done) {
    return (
      <div className="p-6 text-center bg-green-600/10 border border-green-600 rounded-lg text-green-200">
        ✅ Thanks! I’ll get back to you soon.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-lg mx-auto">
      <input
        name="name"
        type="text"
        required
        placeholder="Your name"
        className="w-full rounded-md bg-neutral-900 border border-white/10 px-3 py-2 text-white placeholder:text-neutral-500"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Your email"
        className="w-full rounded-md bg-neutral-900 border border-white/10 px-3 py-2 text-white placeholder:text-neutral-500"
      />
      <textarea
        name="message"
        required
        placeholder="Your message"
        rows={5}
        className="w-full rounded-md bg-neutral-900 border border-white/10 px-3 py-2 text-white placeholder:text-neutral-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 w-full rounded-md bg-white/90 hover:bg-white text-black px-3 py-2 font-medium"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Message'}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
}
