'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function Form() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/admin';

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? 'Sign in failed.');
      }

      // Only ever follow same-origin paths back — an open redirect otherwise.
      router.replace(next.startsWith('/') && !next.startsWith('//') ? next : '/admin');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in failed.');
      setPassword('');
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-[#ececea] bg-white p-6"
      >
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#16161a] text-[10px] font-semibold text-white">
            G&amp;G
          </span>
          <span className="text-sm font-semibold tracking-tight">Inventory</span>
        </div>

        <h1 className="text-[18px] font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 mb-5 text-[13px] text-[#6b6b73]">
          This panel manages live catalogue data.
        </p>

        <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
          required
          className="h-9 w-full rounded-md border border-[#e2e2df] bg-white px-3 text-[13px] outline-none transition-colors focus:border-[#16161a]"
        />

        {error && (
          <p role="alert" className="mt-3 rounded-md bg-[#fdeaea] px-3 py-2 text-[13px] text-[#a4272a]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="mt-5 h-9 w-full rounded-md bg-[#16161a] text-[13px] font-medium text-white transition-colors hover:bg-[#2c2c33] disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={null}>
      <Form />
    </Suspense>
  );
}
