'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_PASSWORD = 'GunX@Admin2026!';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in as admin redirect to dashboard
    if (typeof window !== 'undefined') {
      const adminSession = localStorage.getItem('gunx_admin_session');
      if (adminSession === 'authenticated') {
        router.push('/admin');
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('gunx_admin_session', 'authenticated');
      router.push('/admin');
    } else {
      setError('Incorrect password. Try again.');
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