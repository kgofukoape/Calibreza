'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/admin', icon: '⚡', label: 'Overview' },
  { href: '/admin/dealers', icon: '🏪', label: 'Dealers' },
  { href: '/admin/clubs', icon: '⊕', label: 'Clubs' },
  { href: '/admin/listings', icon: '📋', label: 'Listings' },
  { href: '/admin/analytics', icon: '📈', label: 'Analytics' },
  { href: '/admin/ads', icon: '📢', label: 'Ad Manager' },
  { href: '/admin/crm', icon: '💰', label: 'CRM' },
  { href: '/admin/sentinel', icon: '👁️', label: 'Tokoloshe', active: true },
];

const TASKS = [
  { id: 'security_scan', label: 'Security Scan', icon: '🛡️', desc: 'Scan for bots, scrapers and suspicious sessions' },
  { id: 'listing_moderation', label: 'Listing Moderation', icon: '📋', desc: 'Scan listings for FCA violations and prohibited content' },
  { id: 'revenue_check', label: 'Revenue Check', icon: '💰', desc: 'Review overdue invoices and expiring ads' },
  { id: 'traffic_analysis', label: 'Traffic Analysis', icon: '📈', desc: 'Analyse traffic patterns and engagement' },
  { id: 'daily_brief', label: 'Daily Brief', icon: '📰', desc: 'Full platform status report' },
];

const LEVEL_STYLES: Record<string, string> = {
  info: 'border-[#4CC9F0]/30 bg-[#4CC9F0]/5 text-[#4CC9F0]',
  warning: 'border-[#F59E0B]/30 bg-[#F59E0B]/5 text-[#F59E0B]',
  critical: 'border-[#E63946]/30 bg-[#E63946]/5 text-[#E63946]',
  action: 'border-[#10B981]/30 bg-[#10B981]/5 text-[#10B981]',
};

const LEVEL_ICONS: Record<string, string> = {
  info: 'ℹ️', warning: '⚠️', critical: '🚨', action: '✅',
};

const SUGGESTED_PROMPTS = [
  "Who are my top 5 dealers this month?",
  "Are there any suspicious listings I should know about?",
  "How is revenue looking this week?",
  "Which ad slots are vacant right now?",
  "What should I prioritise today?",
  "Flag any overdue invoices and tell me who to chase",
  "Is the site performing well or are there issues?",
];

export default function SentinelPage() {
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [chat, setChat] = useState<Array<{ role: string; content: string; time: string }>>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'console' | 'chat' | 'logs' | 'control'>('console');
  const [statusStream, setStatusStream] = useState<string[]>([
    '🟢 Tokoloshe is online and watching...',
    '📡 Connected to Gun X infrastructure',
    '🔍 Monitoring active sessions',
  ]);
  const [stats, setStats] = useState({
    logsToday: 0, criticalCount: 0, actionsToday: 0, lastScan: 'Never',
  });
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('gunx_admin_session') !== 'authenticated') {
        router.push('/admin/login'); return;
      }
    }
    loadLogs();
    loadTasks();
    loadChat();

    // Real-time log subscription
    const channel = supabase
      .channel('sentinel_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sentinel_logs' }, (payload) => {
        setLogs(prev => [payload.new, ...prev].slice(0, 50));
        addToStream(`${LEVEL_ICONS[payload.new.level]} ${payload.new.action_taken || payload.new.reasoning?.slice(0, 80)}`);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const loadLogs = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('sentinel_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setLogs(data || []);
    const todayLogs = (data || []).filter(l => new Date(l.created_at) >= today);
    setStats({
      logsToday: todayLogs.length,
      criticalCount: todayLogs.filter(l => l.level === 'critical').length,
      actionsToday: todayLogs.filter(l => l.level === 'action' || l.action_taken).length,
      lastScan: data?.[0] ? new Date(data[0].created_at).toLocaleTimeString('en-ZA') : 'Never',
    });
  };

  const loadTasks = async () => {
    const { data } = await supabase.from('sentinel_tasks').select('*');
    setTasks(data || []);
  };

  const loadChat = async () => {
    const { data } = await supabase
      .from('sentinel_chat')
      .select('role, content, created_at')
      .order('created_at', { ascending: true })
      .limit(30);
    if (data) {
      setChat(data.map(m => ({
        role: m.role,
        content: m.content,
        time: new Date(m.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
      })));
    }
  };

  const addToStream = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setStatusStream(prev => [`[${time}] ${msg}`, ...prev].slice(0, 100));
  };

  const runTask = async (taskId: string) => {
    setRunning(taskId);
    addToStream(`🚀 Running task: ${taskId}...`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tokoloshe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ task: taskId }),
      });

      const result = await res.json();
      const analysis = result.analysis;

      addToStream(`✅ ${analysis?.summary || 'Task complete'}`);

      if (analysis?.findings?.length > 0) {
        analysis.findings.forEach((f: string) => addToStream(`🔍 ${f}`));
      }
      if (result.actions?.length > 0) {
        result.actions.forEach((a: string) => addToStream(`⚡ ACTION: ${a}`));
      }
      if (analysis?.recommendations?.length > 0) {
        analysis.recommendations.forEach((r: string) => addToStream(`💡 ${r}`));
      }

      loadLogs();
      loadTasks();
    } catch (err: any) {
      addToStream(`❌ Error: ${err.message}`);
    }
    setRunning(null);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    const msg = message.trim();
    setMessage('');
    setSending(true);
    setIsTyping(true);

    const now = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    setChat(prev => [...prev, { role: 'user', content: msg, time: now }]);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tokoloshe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ mode: 'chat', message: msg }),
      });

      const result = await res.json();
      const reply = result.reply || "Haibo, something went sideways. Try again.";

      setIsTyping(false);
      setChat(prev => [...prev, {
        role: 'assistant',
        content: reply,
        time: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (err: any) {
      setIsTyping(false);
      setChat(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}`, time: now }]);
    }
    setSending(false);
  };

  const resolveLog = async (id: string) => {
    await supabase.from('sentinel_logs').update({ resolved: true }).eq('id', id);
    setLogs(prev => prev.map(l => l.id === id ? { ...l, resolved: true } : l));
  };

  const clearChat = async () => {
    if (!confirm('Clear all chat history with Tokoloshe?')) return;
    await supabase.from('sentinel_chat').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setChat([]);
  };

  const fmtTime = (d: string) => new Date(d).toLocaleString('en-ZA', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  const getTaskInfo = (name: string) => tasks.find(t => t.task_name === name);

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">

      {/* SIDEBAR */}
      <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E63946] rounded-sm flex items-center justify-center">
            <span className="text-white font-black text-sm">GX</span>
          </div>
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">Command Center</p>
            <p className="text-[9px] font-bold text-[#E63946] uppercase tracking-[0.3em]">Admin Access</p>
          </div>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {NAV.map(item => (
              <li key={item.href}>
                <Link href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${(item as any).active ? 'bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946]' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                  <span>{item.icon}</span><span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={() => { localStorage.removeItem('gunx_admin_session'); router.push('/admin/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-red-400 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-widest transition-all">
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-[260px] overflow-y-auto">

        {/* HEADER */}
        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-3xl font-black uppercase tracking-tight text-white">
                👁️ Tokoloshe <span className="text-[#E63946]">Sentinel</span>
              </h1>
              <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">
                Autonomous AI Agent — Full Control Mode
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-1.5 rounded-sm">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[#10B981] font-black text-[11px] uppercase tracking-widest">Online</span>
              </div>
              <span className="text-white/30 text-[11px]">Last scan: {stats.lastScan}</span>
            </div>
          </div>

          {/* STAT PILLS */}
          <div className="flex gap-4 mt-4">
            {[
              { label: 'Logs Today', value: stats.logsToday, color: 'text-[#4CC9F0]' },
              { label: 'Critical', value: stats.criticalCount, color: stats.criticalCount > 0 ? 'text-[#E63946]' : 'text-white/30' },
              { label: 'Actions Taken', value: stats.actionsToday, color: 'text-[#10B981]' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
                <span className="text-[10px] text-white/30 uppercase tracking-widest">{s.label}</span>
              </div>
            ))}
          </div>
        </header>

        <div className="p-8 space-y-6">

          {/* TABS */}
          <div className="flex gap-2 border-b border-white/5">
            {[
              { id: 'console', label: '📡 Live Console' },
              { id: 'chat', label: '💬 Ask Tokoloshe' },
              { id: 'logs', label: `📋 Logs (${logs.filter(l => !l.resolved).length} unresolved)` },
              { id: 'control', label: '⚙️ Control Panel' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className={`px-5 py-3 font-black text-[13px] uppercase tracking-widest border-b-2 transition-all ${activeTab === tab.id ? 'border-[#E63946] text-[#E63946]' : 'border-transparent text-white/40 hover:text-white'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* LIVE CONSOLE */}
          {activeTab === 'console' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Status Stream */}
              <div className="lg:col-span-2 bg-[#060810] border border-[#10B981]/20 rounded-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-[#10B981]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-[#10B981] font-black text-[11px] uppercase tracking-widest">Live Thought Stream</span>
                  </div>
                  <button onClick={() => setStatusStream(['🟢 Stream cleared'])}
                    className="text-[9px] text-white/20 hover:text-white uppercase tracking-widest font-bold">Clear</button>
                </div>
                <div className="font-mono text-[11px] p-4 h-[400px] overflow-y-auto flex flex-col-reverse space-y-reverse space-y-1">
                  {statusStream.map((line, i) => (
                    <div key={i} className={`${i === 0 ? 'text-[#10B981]' : 'text-white/30'} leading-relaxed`}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Run Tasks */}
              <div className="flex flex-col gap-3">
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-lg font-black uppercase text-white">Run Tasks</h3>
                {TASKS.map(task => {
                  const taskInfo = getTaskInfo(task.id);
                  const isRunning = running === task.id;
                  return (
                    <button key={task.id} onClick={() => runTask(task.id)} disabled={!!running}
                      className={`text-left p-4 rounded-sm border transition-all ${isRunning ? 'border-[#E63946]/60 bg-[#E63946]/10' : 'border-white/10 bg-[#0D1420] hover:border-[#E63946]/40 hover:bg-[#E63946]/5'} disabled:opacity-50`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{isRunning ? '⏳' : task.icon}</span>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                          className="font-black text-[13px] uppercase text-white">{task.label}</span>
                      </div>
                      <p className="text-[10px] text-white/30 leading-relaxed">{task.desc}</p>
                      {taskInfo?.last_run && (
                        <p className="text-[9px] text-white/20 mt-1">Last: {fmtTime(taskInfo.last_run)}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CHAT */}
          {activeTab === 'chat' && (
            <div className="flex flex-col gap-4">

              {/* Suggested prompts */}
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map(p => (
                  <button key={p} onClick={() => setMessage(p)}
                    className="text-[11px] font-bold text-[#8A8E99] border border-white/10 px-3 py-1.5 rounded-sm hover:border-[#E63946]/40 hover:text-[#E63946] transition-all">
                    {p}
                  </button>
                ))}
              </div>

              {/* Chat window */}
              <div className="bg-[#060810] border border-white/10 rounded-sm overflow-hidden flex flex-col" style={{ height: '500px' }}>
                <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👁️</span>
                    <span className="text-white font-black text-[13px] uppercase tracking-widest">Tokoloshe</span>
                    <span className="text-[9px] text-[#10B981] font-bold uppercase">● Online</span>
                  </div>
                  <button onClick={clearChat} className="text-[9px] text-white/20 hover:text-white uppercase tracking-widest font-bold">Clear History</button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {chat.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">👁️</div>
                      <p className="text-white/30 text-sm uppercase tracking-widest">Tokoloshe is watching. Ask anything.</p>
                    </div>
                  )}
                  {chat.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-sm px-4 py-3 ${msg.role === 'user' ? 'bg-[#E63946]/15 border border-[#E63946]/20' : 'bg-[#0D1420] border border-white/5'}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                            {msg.role === 'user' ? 'You' : '👁️ Tokoloshe'}
                          </span>
                          <span className="text-[9px] text-white/20">{msg.time}</span>
                        </div>
                        <p className="text-[14px] text-[#E8EAF0] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-[#0D1420] border border-white/5 rounded-sm px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendMessage} className="px-5 py-4 border-t border-white/5 flex gap-3">
                  <input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Ask Tokoloshe anything..."
                    className="flex-1 bg-[#0D1420] border border-white/10 rounded-sm px-4 py-2.5 text-[14px] text-[#E8EAF0] placeholder-white/20 focus:outline-none focus:border-[#E63946]/50 transition-colors"
                  />
                  <button type="submit" disabled={sending || !message.trim()}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="bg-[#E63946] text-white font-black uppercase tracking-widest text-[13px] px-6 py-2.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                    {sending ? '...' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {['all', 'critical', 'warning', 'info', 'action'].map(filter => (
                  <button key={filter}
                    className="text-[10px] font-black uppercase px-3 py-1.5 rounded-sm bg-[#0D1420] border border-white/10 text-white/40 hover:text-white transition-all">
                    {filter}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {logs.length === 0 ? (
                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-12 text-center">
                    <p className="text-white/30 text-sm uppercase tracking-widest">No logs yet — run a task to start</p>
                  </div>
                ) : logs.map(log => (
                  <div key={log.id}
                    className={`border rounded-sm p-5 transition-all ${log.resolved ? 'opacity-40 border-white/5 bg-white/[0.02]' : LEVEL_STYLES[log.level] || LEVEL_STYLES.info}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{LEVEL_ICONS[log.level]}</span>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                            className="font-black text-[14px] uppercase">{log.action_taken || 'Monitoring'}</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-sm bg-black/20">{log.category}</span>
                          {log.level === 'critical' && !log.resolved && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-sm bg-[#E63946] text-white animate-pulse">Action Required</span>
                          )}
                        </div>
                        {log.reasoning && (
                          <p className="text-[13px] leading-relaxed opacity-80 mb-2">{log.reasoning}</p>
                        )}
                        {log.metadata?.findings?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {log.metadata.findings.map((f: string, i: number) => (
                              <p key={i} className="text-[11px] opacity-70">🔍 {f}</p>
                            ))}
                          </div>
                        )}
                        {log.metadata?.recommendations?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {log.metadata.recommendations.map((r: string, i: number) => (
                              <p key={i} className="text-[11px] opacity-70">💡 {r}</p>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] opacity-50 mt-2">{fmtTime(log.created_at)}</p>
                      </div>
                      {!log.resolved && (
                        <button onClick={() => resolveLog(log.id)}
                          className="flex-shrink-0 text-[10px] font-black uppercase px-3 py-1.5 border border-current rounded-sm hover:bg-current hover:text-black transition-all">
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONTROL PANEL */}
          {activeTab === 'control' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Task Scheduler Status */}
              <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="text-xl font-black uppercase text-white">Task Scheduler</h2>
                  <p className="text-white/30 text-[11px] mt-0.5">Tokoloshe runs automatically every hour</p>
                </div>
                <div className="divide-y divide-white/5">
                  {TASKS.map(task => {
                    const taskInfo = getTaskInfo(task.id);
                    const isRunning = running === task.id;
                    return (
                      <div key={task.id} className="px-5 py-4 flex items-center gap-4">
                        <span className="text-xl">{task.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-white uppercase tracking-wide">{task.label}</p>
                          <p className="text-[10px] text-white/30">
                            Last: {taskInfo?.last_run ? fmtTime(taskInfo.last_run) : 'Never'} ·
                            Next: {taskInfo?.next_run ? fmtTime(taskInfo.next_run) : 'Pending'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${taskInfo?.status === 'completed' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
                            {taskInfo?.status || 'Pending'}
                          </span>
                          <button onClick={() => runTask(task.id)} disabled={!!running}
                            className="text-[10px] font-black uppercase px-3 py-1.5 border border-[#E63946]/30 text-[#E63946] rounded-sm hover:bg-[#E63946]/10 transition-all disabled:opacity-30">
                            {isRunning ? '⏳' : 'Run'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Capabilities & Instructions */}
              <div className="bg-[#0D1420] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-xl font-black uppercase text-white mb-4">What Tokoloshe Can Do</h2>
                <div className="space-y-3">
                  {[
                    { icon: '🛡️', title: 'Security', desc: 'Detects bot activity, scraping attacks, suspicious session patterns' },
                    { icon: '📋', title: 'Moderation', desc: 'Scans listings for FCA violations, prohibited keywords, auto-pauses flagged content' },
                    { icon: '💰', title: 'Revenue', desc: 'Monitors overdue invoices, expiring ads, flags missed revenue opportunities' },
                    { icon: '📈', title: 'Traffic', desc: 'Analyses daily traffic trends, identifies high/low engagement areas' },
                    { icon: '📰', title: 'Daily Brief', desc: 'Full platform status report — run manually or schedule for 07:00 daily' },
                    { icon: '💬', title: 'Chat', desc: 'Answer any question about the platform with live data context' },
                  ].map(cap => (
                    <div key={cap.title} className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">{cap.icon}</span>
                      <div>
                        <p className="text-[12px] font-black text-white uppercase tracking-wider">{cap.title}</p>
                        <p className="text-[11px] text-white/40 leading-relaxed">{cap.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-white/5">
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="text-lg font-black uppercase text-[#E63946] mb-3">You're in Full Control</h3>
                  <div className="space-y-2 text-[11px] text-white/40">
                    <p>✓ Every action Tokoloshe takes is logged in the Audit Log</p>
                    <p>✓ You can resolve or override any decision from the Logs tab</p>
                    <p>✓ Tokoloshe never sends client communications without your approval</p>
                    <p>✓ All database changes are reversible via Supabase dashboard</p>
                    <p>✓ Chat history is stored — you can review everything Tokoloshe said</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}