'use client';
// ---------------------------------------------------------------------------
// DashboardLogin — client page for the /dashboard/login route. Submits
// username + password to POST /api/auth/login, which sets an httpOnly session
// cookie, then redirects straight back into the dashboard control center.
// ---------------------------------------------------------------------------
import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Login failed');
        setLoading(false);
        return;
      }
      const next = params.get('next');
      router.replace(next && next.startsWith('/dashboard') ? next : '/dashboard');
    } catch {
      setError('Network error — try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5ee] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-neutral-200 shadow-sm p-8">
        <div className="mb-8 text-center">
          <div className="text-2xl tracking-tighter mb-2">✂</div>
          <h1 className="font-editorial text-xl font-black uppercase tracking-tight">
            PAUL HAIR STUDIO
          </h1>
          <p className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mt-1">
            Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-600 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-600 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:outline-none focus:border-black"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing in\u2026' : 'Sign in'}
          </button>
        </form>

        <a
          href="/"
          className="block text-center mt-6 text-[11px] tracking-[0.15em] uppercase text-neutral-400 hover:text-black transition-colors"
        >
          Back to site
        </a>
      </div>
    </div>
  );
}

export default function DashboardLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}