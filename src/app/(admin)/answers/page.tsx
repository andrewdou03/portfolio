import { Suspense } from 'react';
import ClientQAAdmin from './ClientQAAdmin';

export default function AnswersAdmin() {
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-neutral-100 mb-4">Q&A Admin</h1>
      <Suspense fallback={<div className="text-neutral-400">Loading…</div>}>
        <ClientQAAdmin />
      </Suspense>
    </main>
  );
}
