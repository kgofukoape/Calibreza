'use client';

import React, { useState, useEffect } from 'react';
import AdminNav from '@/components/admin/AdminNav';
import { supabase } from '@/lib/supabase';

// ─── DIAGNOSTICS ─────────────────────────────────────────────────────────────
// /admin/diagnostics
//
// Two things you cannot otherwise do without a terminal:
//
//   RUN A SCHEDULED JOB BY HAND. The monthly invoice run happens on the 1st.
//   Waiting until then to find out whether it works means discovering a problem
//   on the day your customers were meant to be billed — and that job already
//   failed once on a column that did not exist. Being able to trigger it in a
//   dry run, on any day, is the difference between knowing and hoping.
//
//   SEE WHAT THE SYSTEM IS SITTING ON. Listings about to expire, invoices
//   overdue, boosts still running. Numbers you would otherwise only meet when
//   somebody complains.

interface JobResult {
  name: string;
  at: string;
  result: any;
}

export default function AdminDiagnosticsPage() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<JobResult[]>([]);
  const [state, setState] = useState<any>(null);

  useEffect(() => { loadState(); }, []);

  const loadState = async () => {
    const now = new Date();
    const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const count = (q: any) => q.then((r: any) => r.count || 0);

    const [expiringSoon, expired, overdueInv, unpaidInv, boosted, featured, comped] =
      await Promise.all([
        count(supabase.from('listings').select('id', { count: 'exact', head: true })
          .eq('status', 'active').lte('expires_at', in14.toISOString()).gte('expires_at', now.toISOString())),
        count(supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'expired')),
        count(supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'overdue')),
        count(supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'unpaid')),
        count(supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('is_boosted', true)),
        count(supabase.from('listings').select('id', { count: 'exact', head: true }).eq('is_featured', true)),
        count(supabase.from('dealers').select('id', { count: 'exact', head: true }).eq('is_comped', true)),
      ]);

    setState({ expiringSoon, expired, overdueInv, unpaidInv, boosted, featured, comped });
  };

  // The cron routes authenticate with CRON_SECRET, which is a server secret and
  // must never reach the browser. These run through the admin API, which
  // already knows who you are from the signed session cookie.
  const runJob = async (name: string, job: string) => {
    if (!confirm(
      `Run "${name}" now?\n\n` +
      `This performs the real job — it sends real email and writes real records. ` +
      `It is the same work the scheduler does, just triggered by you.`
    )) return;

    setRunning(job);
    try {
      const res = await fetch('/api/admin/run-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      });
      const json = await res.json();

      setResults(prev => [{
        name,
        at: new Date().toLocaleTimeString('en-ZA'),
        result: res.ok ? json.data : { error: json.error },
      }, ...prev].slice(0, 10));

      loadState();
    } catch (err: any) {
      setResults(prev => [{ name, at: new Date().toLocaleTimeString('en-ZA'), result: { error: err.message } }, ...prev]);
    } finally {
      setRunning(null);
    }
  };

  const JOBS = [
    {
      job: 'ads-cron',
      name: 'Daily sweep',
      detail: 'Expires listings past 120 days, sends "still available?" reminders, expires promotions and job boosts, chases unpaid ad slots.',
    },
    {
      job: 'subscription-cron',
      name: 'Subscription sweep',
      detail: 'Trial warnings, applies cancellations, and — on the 1st only — raises monthly invoices for paid accounts.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#080B12] text-white flex">

      <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E63946] rounded-sm flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">GX</span>
          </div>
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">Command Center</p>
            <p className="text-[9px] font-bold text-[#E63946] uppercase tracking-[0.3em]">Admin Access</p>
          </div>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto"><AdminNav /></nav>
      </aside>

      <div className="flex-1 ml-[260px]">
        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight">
            Diagnostics <span className="text-[#E63946]">& Jobs</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">
            Run scheduled work · Inspect system state
          </p>
        </header>

        <div className="p-8 max-w-[1000px] space-y-8">

          {/* ── STATE ────────────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9922A] mb-3">What the system is holding</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Expiring in 14 days', value: state?.expiringSoon, tone: 'warn' },
                { label: 'Already expired', value: state?.expired },
                { label: 'Invoices overdue', value: state?.overdueInv, tone: 'bad' },
                { label: 'Invoices unpaid', value: state?.unpaidInv },
                { label: 'Promoted listings', value: state?.featured },
                { label: 'Boosted jobs', value: state?.boosted },
                { label: 'Comped accounts', value: state?.comped, tone: 'note' },
              ].map(c => (
                <div key={c.label} className="bg-[#0D1420] border border-white/5 rounded-sm p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">{c.label}</p>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className={`text-3xl font-black ${
                      c.tone === 'bad' && c.value > 0 ? 'text-[#E63946]'
                        : c.tone === 'warn' && c.value > 0 ? 'text-[#F59E0B]'
                        : c.tone === 'note' && c.value > 0 ? 'text-[#8B5CF6]'
                        : 'text-white'
                    }`}>
                    {c.value ?? '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── JOBS ─────────────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9922A] mb-3">Scheduled jobs</p>
            <div className="space-y-3">
              {JOBS.map(j => (
                <div key={j.job} className="bg-[#0D1420] border border-white/5 rounded-sm p-5 flex items-start justify-between gap-6">
                  <div>
                    <p className="font-black text-[15px] text-white mb-1">{j.name}</p>
                    <p className="text-[12px] text-white/40 leading-relaxed max-w-lg">{j.detail}</p>
                  </div>
                  <button onClick={() => runJob(j.name, j.job)} disabled={running !== null}
                    className="flex-shrink-0 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[10px] px-5 py-2.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-30">
                    {running === j.job ? 'Running…' : 'Run now'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── RESULTS ──────────────────────────────────────────────── */}
          {results.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9922A] mb-3">Results</p>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="bg-[#0D1420] border border-white/5 rounded-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-[12px] uppercase tracking-widest text-white">{r.name}</span>
                      <span className="text-[11px] text-white/30">{r.at}</span>
                    </div>
                    <pre className="text-[11px] text-white/60 font-mono whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(r.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}