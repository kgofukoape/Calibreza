'use client';

import React, { useState, useEffect } from 'react';
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
  { href: '/admin/crm', icon: '💰', label: 'CRM', active: true },
  { href: '/admin/users', icon: '👥', label: 'Users' },
];

const PLANS = {
  dealer_free: { label: 'Free', amount: 0, color: 'text-white/40' },
  dealer_pro: { label: 'Pro', amount: 499, color: 'text-[#C9922A]' },
  dealer_premium: { label: 'Premium', amount: 799, color: 'text-[#4CC9F0]' },
  club: { label: 'Club', amount: 299, color: 'text-[#10B981]' },
  service: { label: 'Service', amount: 299, color: 'text-[#8B5CF6]' },
};

const EMPTY_INVOICE = {
  client_type: 'dealer', client_name: '', client_email: '',
  description: '', subtotal: '', vat_pct: '15',
  due_date: '', notes: '', line_items: [{ description: '', amount: '' }],
};

export default function CRMPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'invoices' | 'create'>('overview');
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [invoice, setInvoice] = useState({ ...EMPTY_INVOICE });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('gunx_admin_session') !== 'authenticated') {
        router.push('/admin/login'); return;
      }
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    const [subsRes, invRes, dealersRes] = await Promise.all([
      supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('dealers').select('id, business_name, email, subscription_tier, status, city, province').order('created_at', { ascending: false }),
    ]);
    setSubscriptions(subsRes.data || []);
    setInvoices(invRes.data || []);
    setDealers(dealersRes.data || []);
    setLoading(false);
    checkOverdue(invRes.data || []);
    syncDealerSubscriptions(dealersRes.data || []);
  };

  const checkOverdue = async (invList: any[]) => {
    const today = new Date().toISOString().slice(0, 10);
    const overdue = invList.filter(i => i.status === 'unpaid' && i.due_date < today);
    if (overdue.length > 0) {
      for (const inv of overdue) {
        await supabase.from('invoices').update({ status: 'overdue' }).eq('id', inv.id);
      }
    }
  };

  // Auto-create subscription records for dealers that don't have one
  const syncDealerSubscriptions = async (dealerList: any[]) => {
    const { data: existingSubs } = await supabase.from('subscriptions').select('client_id');
    const existingIds = new Set((existingSubs || []).map(s => s.client_id));
    const newDealers = dealerList.filter(d => d.status === 'approved' && d.subscription_tier !== 'free' && !existingIds.has(d.id));
    for (const dealer of newDealers) {
      const plan = `dealer_${dealer.subscription_tier}`;
      const amount = PLANS[plan as keyof typeof PLANS]?.amount || 0;
      if (amount > 0) {
        await supabase.from('subscriptions').insert({
          client_type: 'dealer', client_id: dealer.id,
          client_name: dealer.business_name, client_email: dealer.email || '',
          plan, amount, status: 'active',
          current_period_start: new Date().toISOString().slice(0, 10),
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          next_billing_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        });
      }
    }
  };

  const handleSuspend = async (sub: any) => {
    const next = sub.status === 'active' ? 'suspended' : 'active';
    await supabase.from('subscriptions').update({ status: next }).eq('id', sub.id);
    // Also update dealer tier if suspending
    if (next === 'suspended' && sub.client_type === 'dealer') {
      await supabase.from('dealers').update({ subscription_tier: 'free' }).eq('id', sub.client_id);
    }
    setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, status: next } : s));
  };

  const handleCancelSub = async (sub: any) => {
    if (!confirm(`Cancel ${sub.client_name}'s subscription? This will downgrade them to Free.`)) return;
    await supabase.from('subscriptions').update({ status: 'cancelled', cancellation_reason: 'Admin cancelled' }).eq('id', sub.id);
    if (sub.client_type === 'dealer') {
      await supabase.from('dealers').update({ subscription_tier: 'free' }).eq('id', sub.client_id);
    }
    setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'cancelled' } : s));
  };

  const handleMarkPaid = async (inv: any) => {
    await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', inv.id);
    // Reactivate subscription if it was suspended
    const sub = subscriptions.find(s => s.client_email === inv.client_email && s.status === 'suspended');
    if (sub) {
      await supabase.from('subscriptions').update({ status: 'active', payment_failures: 0 }).eq('id', sub.id);
      if (sub.client_type === 'dealer') {
        const tier = sub.plan.replace('dealer_', '');
        await supabase.from('dealers').update({ subscription_tier: tier }).eq('id', sub.client_id);
      }
    }
    setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'paid', paid_at: new Date().toISOString() } : i));
  };

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    const lineItems = invoice.line_items.filter(li => li.description && li.amount);
    const subtotal = lineItems.reduce((s, li) => s + parseFloat(li.amount || '0'), 0);
    const vat = Math.round(subtotal * (parseFloat(invoice.vat_pct) / 100));
    const total = subtotal + vat;
    const invNumber = `GX-${Date.now().toString().slice(-6)}`;
    const { error: err } = await supabase.from('invoices').insert({
      invoice_number: invNumber,
      client_type: invoice.client_type,
      client_name: invoice.client_name,
      client_email: invoice.client_email,
      description: invoice.description,
      line_items: lineItems.map(li => ({ description: li.description, amount: parseFloat(li.amount) })),
      subtotal, vat, total,
      status: 'unpaid',
      due_date: invoice.due_date,
      notes: invoice.notes,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    setSuccess(`Invoice ${invNumber} created for R${total.toLocaleString()}`);
    setSaving(false);
    setInvoice({ ...EMPTY_INVOICE });
    loadAll();
  };

  const updateLineItem = (idx: number, field: string, value: string) => {
    const items = [...invoice.line_items];
    items[idx] = { ...items[idx], [field]: value };
    setInvoice({ ...invoice, line_items: items });
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const inputClass = "w-full bg-[#080B12] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#E8EAF0] focus:outline-none focus:border-[#E63946]/50 transition-colors";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5";

  // Stats
  const mrr = subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.amount || 0), 0);
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const paidThisMonth = invoices.filter(i => i.status === 'paid' && i.paid_at?.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((s, i) => s + (i.total || 0), 0);
  const outstanding = invoices.filter(i => ['unpaid', 'overdue'].includes(i.status))
    .reduce((s, i) => s + (i.total || 0), 0);

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">

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
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {NAV.map(item => (
              <li key={item.href}>
                <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${(item as any).active ? 'bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946]' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
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

      <main className="flex-1 ml-[260px] overflow-y-auto">
        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 flex items-center justify-between sticky top-0 z-40">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight text-white">
              Revenue <span className="text-[#E63946]">Engine</span>
            </h1>
            <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">Subscriptions · Invoices · CRM</p>
          </div>
          {overdueInvoices.length > 0 && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-black text-[12px] uppercase tracking-widest">{overdueInvoices.length} Overdue</span>
            </div>
          )}
        </header>

        <div className="p-8 space-y-6">

          {/* REVENUE STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Monthly Recurring', value: `R${mrr.toLocaleString()}`, sub: 'Active subscriptions', color: 'text-[#10B981]', border: 'border-[#10B981]/20' },
              { label: 'Collected This Month', value: `R${paidThisMonth.toLocaleString()}`, sub: 'Invoices paid', color: 'text-[#C9922A]', border: 'border-[#C9922A]/20' },
              { label: 'Outstanding', value: `R${outstanding.toLocaleString()}`, sub: `${overdueInvoices.length} overdue`, color: overdueInvoices.length > 0 ? 'text-red-400' : 'text-[#8A8E99]', border: overdueInvoices.length > 0 ? 'border-red-500/20' : 'border-white/10' },
              { label: 'Active Subscriptions', value: subscriptions.filter(s => s.status === 'active').length, sub: `${subscriptions.filter(s => s.status === 'suspended').length} suspended`, color: 'text-[#4CC9F0]', border: 'border-[#4CC9F0]/20' },
            ].map(s => (
              <div key={s.label} className={`bg-[#0D1420] border ${s.border} rounded-sm p-4`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">{s.label}</p>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-white/30 mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* TABS */}
          <div className="flex gap-2 border-b border-white/5 pb-0">
            {[
              { id: 'overview', label: 'Dealer Overview' },
              { id: 'subscriptions', label: 'Subscriptions' },
              { id: 'invoices', label: `Invoices ${overdueInvoices.length > 0 ? `(${overdueInvoices.length} overdue)` : ''}` },
              { id: 'create', label: '+ Create Invoice' },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className={`px-5 py-3 font-black text-[13px] uppercase tracking-widest border-b-2 transition-all ${activeTab === t.id ? 'border-[#E63946] text-[#E63946]' : 'border-transparent text-white/40 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* DEALER OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase text-white">Dealer Accounts</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#080B12]">
                      {['Dealer', 'Location', 'Plan', 'Status', 'Monthly Value', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {dealers.map(dealer => {
                      const plan = `dealer_${dealer.subscription_tier}`;
                      const planInfo = PLANS[plan as keyof typeof PLANS];
                      const sub = subscriptions.find(s => s.client_id === dealer.id);
                      return (
                        <tr key={dealer.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <p className="text-[13px] font-bold text-white">{dealer.business_name}</p>
                            <p className="text-[10px] text-white/30">{dealer.email}</p>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-white/40">{dealer.city}, {dealer.province}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[12px] font-black uppercase ${planInfo?.color}`}>{planInfo?.label || dealer.subscription_tier}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${
                              dealer.status === 'approved' ? 'bg-[#10B981]/10 text-[#10B981]' :
                              dealer.status === 'pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                              'bg-red-500/10 text-red-400'
                            }`}>{dealer.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[12px] font-black text-[#C9922A]">R{(planInfo?.amount || 0).toLocaleString()}/mo</span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => { setInvoice({ ...EMPTY_INVOICE, client_type: 'dealer', client_name: dealer.business_name, client_email: dealer.email || '', description: `${planInfo?.label} Plan — ${new Date().toLocaleString('en-ZA', { month: 'long', year: 'numeric' })}`, line_items: [{ description: `${planInfo?.label} Dealer Subscription`, amount: (planInfo?.amount || 0).toString() }] }); setActiveTab('create'); }}
                              className="text-[10px] font-black uppercase px-3 py-1.5 bg-[#C9922A]/10 border border-[#C9922A]/30 text-[#C9922A] rounded-sm hover:bg-[#C9922A]/20 transition-all">
                              Invoice
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUBSCRIPTIONS */}
          {activeTab === 'subscriptions' && (
            <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase text-white">Active Subscriptions</h2>
              </div>
              {subscriptions.length === 0 ? (
                <div className="px-6 py-16 text-center text-white/30 text-sm">
                  No subscriptions yet — they auto-populate when dealers sign up on Pro/Premium plans.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#080B12]">
                        {['Client', 'Plan', 'Amount', 'Billing Cycle', 'Next Billing', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {subscriptions.map(sub => (
                        <tr key={sub.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <p className="text-[13px] font-bold text-white">{sub.client_name}</p>
                            <p className="text-[10px] text-white/30">{sub.client_email}</p>
                            <p className="text-[9px] text-white/20 uppercase">{sub.client_type}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[12px] font-black uppercase text-[#C9922A]">{sub.plan?.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[13px] font-black text-[#10B981]">R{(sub.amount || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-white/30">/mo</span>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-white/40 capitalize">{sub.billing_cycle}</td>
                          <td className="px-4 py-3 text-[12px] text-white/60">{fmtDate(sub.next_billing_date)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm border ${
                              sub.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                              sub.status === 'suspended' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' :
                              'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>{sub.status}</span>
                            {sub.payment_failures > 0 && <p className="text-[9px] text-red-400 mt-0.5">{sub.payment_failures} failures</p>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => handleSuspend(sub)}
                                className={`text-[10px] font-black uppercase px-2 py-1 rounded-sm border transition-all ${sub.status === 'active' ? 'border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/10' : 'border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/10'}`}>
                                {sub.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                              <button onClick={() => handleCancelSub(sub)}
                                className="text-[10px] font-black uppercase px-2 py-1 rounded-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* INVOICES */}
          {activeTab === 'invoices' && (
            <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase text-white">
                  Invoice Register <span className="text-white/30">({invoices.length})</span>
                </h2>
              </div>
              {invoices.length === 0 ? (
                <div className="px-6 py-16 text-center text-white/30 text-sm">No invoices yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#080B12]">
                        {['Invoice #', 'Client', 'Description', 'Amount', 'Due Date', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-[12px] font-black text-[#C9922A]">{inv.invoice_number}</td>
                          <td className="px-4 py-3">
                            <p className="text-[13px] font-bold text-white">{inv.client_name}</p>
                            <p className="text-[10px] text-white/30">{inv.client_email}</p>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-white/60 max-w-[200px] truncate">{inv.description}</td>
                          <td className="px-4 py-3">
                            <p className="text-[13px] font-black text-[#10B981]">R{(inv.total || 0).toLocaleString()}</p>
                            {inv.vat > 0 && <p className="text-[10px] text-white/30">incl. R{inv.vat} VAT</p>}
                          </td>
                          <td className="px-4 py-3 text-[12px] text-white/60">{fmtDate(inv.due_date)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm border ${
                              inv.status === 'paid' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                              inv.status === 'overdue' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
                            }`}>{inv.status}</span>
                            {inv.paid_at && <p className="text-[9px] text-white/20 mt-0.5">Paid {fmtDate(inv.paid_at)}</p>}
                          </td>
                          <td className="px-4 py-3">
                            {inv.status !== 'paid' && (
                              <button onClick={() => handleMarkPaid(inv)}
                                className="text-[10px] font-black uppercase px-3 py-1.5 bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] rounded-sm hover:bg-[#10B981]/20 transition-all">
                                Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CREATE INVOICE */}
          {activeTab === 'create' && (
            <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white">Create Invoice</h2>
              </div>
              <form onSubmit={createInvoice} className="p-6 space-y-6">
                {error && <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3 text-red-400 text-sm">{error}</div>}
                {success && <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-sm p-3 text-[#10B981] text-sm font-bold">✓ {success}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Client Type</label>
                    <select name="client_type" value={invoice.client_type} onChange={e => setInvoice({ ...invoice, client_type: e.target.value })} className={inputClass}>
                      {['dealer', 'club', 'service', 'advertiser'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Client Name *</label>
                    <input value={invoice.client_name} onChange={e => setInvoice({ ...invoice, client_name: e.target.value })} required className={inputClass} placeholder="Business Name" />
                  </div>
                  <div>
                    <label className={labelClass}>Client Email *</label>
                    <input type="email" value={invoice.client_email} onChange={e => setInvoice({ ...invoice, client_email: e.target.value })} required className={inputClass} placeholder="billing@company.co.za" />
                  </div>
                  <div>
                    <label className={labelClass}>Due Date *</label>
                    <input type="date" value={invoice.due_date} onChange={e => setInvoice({ ...invoice, due_date: e.target.value })} required className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Invoice Description</label>
                    <input value={invoice.description} onChange={e => setInvoice({ ...invoice, description: e.target.value })} className={inputClass} placeholder="Pro Dealer Subscription — May 2026" />
                  </div>
                </div>

                {/* LINE ITEMS */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className={labelClass}>Line Items</label>
                    <button type="button" onClick={() => setInvoice({ ...invoice, line_items: [...invoice.line_items, { description: '', amount: '' }] })}
                      className="text-[11px] font-black uppercase text-[#C9922A] hover:brightness-125">+ Add Line</button>
                  </div>
                  <div className="space-y-2">
                    {invoice.line_items.map((li, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input value={li.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} className={`${inputClass} flex-1`} placeholder="Description" />
                        <input type="number" value={li.amount} onChange={e => updateLineItem(idx, 'amount', e.target.value)} className={`${inputClass} w-[120px]`} placeholder="Amount (R)" />
                        {invoice.line_items.length > 1 && (
                          <button type="button" onClick={() => setInvoice({ ...invoice, line_items: invoice.line_items.filter((_, i) => i !== idx) })}
                            className="text-red-400 font-black px-2">×</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* VAT + TOTALS */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>VAT %</label>
                    <select value={invoice.vat_pct} onChange={e => setInvoice({ ...invoice, vat_pct: e.target.value })} className={inputClass}>
                      <option value="0">0% — No VAT</option>
                      <option value="15">15% — Standard VAT</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Notes</label>
                    <input value={invoice.notes} onChange={e => setInvoice({ ...invoice, notes: e.target.value })} className={inputClass} placeholder="Payment ref, bank details..." />
                  </div>
                </div>

                {/* TOTALS PREVIEW */}
                {invoice.line_items.some(li => li.amount) && (
                  <div className="bg-[#080B12] border border-white/5 rounded-sm p-4 space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-white/40">Subtotal</span>
                      <span className="font-bold">R{invoice.line_items.reduce((s, li) => s + (parseFloat(li.amount || '0')), 0).toLocaleString()}</span>
                    </div>
                    {invoice.vat_pct !== '0' && (
                      <div className="flex justify-between text-[13px]">
                        <span className="text-white/40">VAT ({invoice.vat_pct}%)</span>
                        <span className="font-bold">R{Math.round(invoice.line_items.reduce((s, li) => s + (parseFloat(li.amount || '0')), 0) * (parseFloat(invoice.vat_pct) / 100)).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[15px] border-t border-white/5 pt-2">
                      <span className="font-black text-white uppercase tracking-widest">Total</span>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black text-[#10B981]">
                        R{Math.round(invoice.line_items.reduce((s, li) => s + (parseFloat(li.amount || '0')), 0) * (1 + parseFloat(invoice.vat_pct) / 100)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={saving}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="bg-[#E63946] text-white font-black uppercase tracking-widest text-[15px] px-10 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Invoice'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}