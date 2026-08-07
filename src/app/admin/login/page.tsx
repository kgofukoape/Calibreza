'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── ADMIN LOGIN ─────────────────────────────────────────────────────────────
// The password is NOT in this file. It lives server-side in the ADMIN_PASSWORD
// environment variable and is checked by /api/admin/login, which then issues a
// signed httpOnly session cookie that the middleware verifies on every /admin
// request.
//
// Anything in a 'use client' file is shipped to the browser and readable by
// anyone — which is exactly why the old hardcoded password had to go.

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Kept only so the existing admin pages' client-side checks stay happy.
        // This is a UX convenience, NOT security — the real gate is the signed
        // httpOnly cookie enforced by middleware.
        localStorage.setItem('gunx_admin_session', 'authenticated');
        router.push('/admin');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'Incorrect password. Try again.');
        setPassword('');
        setLoading(false);
      }
    } catch {
      setError('Could not reach the server. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B12] flex items-center justify-center px-6">
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E63946] rounded-sm mb-6">
            <span className="text-white font-black text-2xl">GX</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase tracking-tight text-white mb-2">
            Command <span className="text-[#E63946]">Center</span>
          </h1>
          <p className="text-white/30 text-xs uppercase tracking-widest font-bold">Restricted Access — Admin Only</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#0D1420] border border-white/5 rounded-sm p-8">
          <form onSubmit={handleLogin} className="space-y-6">

            {error && (
              <div className="p-3 bg-[#E63946]/10 border border-[#E63946]/30 rounded-sm text-[#E63946] text-sm font-bold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                autoFocus
                className="w-full bg-[#080B12] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#E63946]/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E63946] text-white py-3 rounded-sm font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Access Command Center'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6 uppercase tracking-widest">
          Gun X — Restricted Area
        </p>
      </div>
    </div>
  );
}
