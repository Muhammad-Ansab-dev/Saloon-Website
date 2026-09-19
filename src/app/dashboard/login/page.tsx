'use client';
// ---------------------------------------------------------------------------
// LOGIN ROUTE ("/dashboard/login") — the admin + branch-manager sign-in page.
// What it does: posts username/password to the auth API, then redirects to
// the dashboard that matches the account.
// What it connects to: POST /api/auth/login (src/app/api/auth/login/route.ts),
// which verifies the credentials, sets an httpOnly session cookie, and returns
// the canonical redirect: /dashboard for the superadmin, /dashboard/branch/<slug>
// for a branch manager.
// Why a client component: the form needs local state and routing after login.
// ---------------------------------------------------------------------------
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// The actual login form.
function LoginForm() {
  const router = useRouter();
  // Form state: typed username/password, an inline error message, and a
  // loading flag that disables the button while the request is in flight.
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Submit handler. Params: the submit event (prevented so the page doesn't
  // reload). Behavior: POST credentials → on failure show the server error;
  // on success redirect to the account's dashboard.
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
      const data = await res.json().catch(() => ({}));
      // The API returns the canonical landing page for the account that
      // logged in: /dashboard for the superadmin, /dashboard/branch/<slug>
      // for a branch manager. Trust it over the pre-login ?next= target.
      const redirect = typeof data.redirect === 'string' ? data.redirect : '/dashboard';
      router.replace(redirect);
    } catch {
      setError('Network error — try again.');
      setLoading(false);
    }
  };

  return (
    // Centered cream login card over the site's paper background
    <div className="min-h-screen bg-[#f7f5ee] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-neutral-200 shadow-sm p-8">
        {/* Brand header: scissors mark + studio name */}
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

          {/* The red error message only renders once a login attempt fails */}
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

// Route entry — renders the login form.
export default function DashboardLoginPage() {
  return <LoginForm />;
}