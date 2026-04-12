'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'kgofu.koape@gmail.com';

const TIERS = ['free', 'pay_per_ad', 'pro', 'premium'];

type Dealer = {
  id: string;
  business_name: string;
  slug: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  status: string;
  subscription_tier: string;
  saps_dealer_number: string;
  registration_number: string;
  business_type: string;
  years_in_business: number;
  contact_person: string;
  address: string;
  saps_certificate_url: string;
  business_registration_url: string;
  id_document_url: string;
  created_at: string;
  rating: number;
  review_count: number;
};

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'];

export default function AdminDealersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [filtered, setFiltered] = useState<Dealer[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [changingTier, setChangingTier] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    let result = dealers;
    if (statusFilter !== 'all') result = result.filter((d) => d.status === statusFilter);
    if (search) result = result.filter((d) =>
      d.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.email?.toLowerCase().includes(search.toLowerCase()) ||
      d.city?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [statusFilter, search, dealers]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) { router.push('/'); return; }
    await loadDealers();
    setLoading(false);
  };

  const loadDealers = async () => {
    const { data } = await supabase
      .from('dealers')
      .select('*')
      .order('created_at', { ascending: false });
    setDealers(data || []);
    setFiltered(data || []);
  };

  const handleStatusChange = async (dealerId: string, newStatus: string) => {
    setActionLoading(dealerId);
    const { error } = await supabase
      .from('dealers')
      .update({ status: newStatus })
      .eq('id', dealerId);

    if (!error) {
      setDealers((prev) => prev.map((d) => d.id === dealerId ? { ...d, status: newStatus } : d));
      if (selectedDealer?.id === dealerId) {
        setSelectedDealer((prev) => prev ? { ...prev, status: newStatus } : prev);
      }
    }
    setActionLoading(null);
  };

  const handleTierChange = async (dealerId: string, newTier: string) => {
    setChangingTier(dealerId);
    const { error } = await supabase
      .from('dealers')
      .update({ subscription_tier: newTier })
      .eq('id', dealerId);

    if (!error) {
      setDealers((prev) => prev.map((d) => d.id === dealerId ? { ...d, subscription_tier: newTier } : d));
      if (selectedDealer?.id === dealerId) {
        setSelectedDealer((prev) => prev ? { ...prev, subscription_tier: newTier } : prev);
      }
    }
    setChangingTier(null);
  };

  const handleDelete = async (dealerId: string) => {
    if (!confirm('Are you sure you want to permanently delete this dealer? This cannot be undone.')) return;
    setActionLoading(dealerId);
    await supabase.from('dealers').delete().eq('id', dealerId);
    setDealers((prev) => prev.filter((d) => d.id !== dealerId));
    if (selectedDealer?.id === dealerId) setSelectedDealer(null);
    setActionLoading(null);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

  const statusCounts = {
    all: dealers.length,
    pending: dealers.filter((d) => d.status === 'pending').length,
    approved: dealers.filter((d) => d.status === 'approved').length,
    rejected: dealers.filter((d) => d.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B12] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">

      {/* SIDEBAR */}
      <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E63946] rounded-sm flex items-center justify-center">
              <span className="text-white font-black text-sm">GX</span>
            </div>
            <div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">
                Command Center
              </p>
              <p className="text-[9px] font-bold text-[#E63946] uppercase tracking-[0.3em]">Admin Access</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E63946] flex items-center justify-center text-white font-black text-xs">K</div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest">Kgofu</p>
              <p className="text-[9px] text-[#E63946] font-bold uppercase tracking-widest">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="mb-2">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Main</p>
            <ul className="space-y-1">
              <li>
                <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">
                  <span>⚡</span><span>Overview</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/dealers" className="flex items-center gap-3 px-3 py-2.5 rounded-sm bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946] font-black text-[11px] uppercase tracking-widest">
                  <span>🏪</span>
                  <span>Dealers</span>
                  {statusCounts.pending > 0 && (
                    <span className="ml-auto bg-[#F59E0B] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {statusCounts.pending}
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <Link href="/admin/listings" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">
                  <span>📋</span><span>Listings</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">
                  <span>👥</span><span>Users</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/analytics" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">
                  <span>📈</span><span>Analytics</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="mt-6">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Quick Links</p>
            <ul className="space-y-1">
              <li>
                <Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">
                  <span>🌐</span><span>View Site</span>
                </Link>
              </li>
              <li>
                <Link href="https://supabase.com/dashboard/project/xklyirzvbjncedymrjqj" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">
                  <span>🗄️</span><span>Supabase</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-red-400 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-widest transition-all"
          >
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-[260px] overflow-y-auto">

        {/* Header */}
        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 sticky top-0 z-40">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight text-white">
            Dealer <span className="text-[#E63946]">Management</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">
            {dealers.length} total dealers · {statusCounts.pending} pending
          </p>
        </header>

        <div className="flex h-[calc(100vh-73px)]">

          {/* LEFT — Dealer List */}
          <div className="w-[420px] flex-shrink-0 border-r border-white/5 flex flex-col">

            {/* Search + Filter */}
            <div className="p-4 border-b border-white/5 space-y-3">
              <input
                type="text"
                placeholder="Search dealers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#080B12] border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E63946]/50"
              />
              <div className="flex gap-1">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`flex-1 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all ${
                      statusFilter === f
                        ? 'bg-[#E63946] text-white'
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {f} ({statusCounts[f as keyof typeof statusCounts]})
                  </button>
                ))}
              </div>
            </div>

            {/* Dealer List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filtered.map((dealer) => (
                <button
                  key={dealer.id}
                  onClick={() => setSelectedDealer(dealer)}
                  className={`w-full text-left px-4 py-4 hover:bg-white/5 transition-all ${
                    selectedDealer?.id === dealer.id ? 'bg-[#E63946]/5 border-l-2 border-[#E63946]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-sm flex items-center justify-center font-black text-sm flex-shrink-0 ${
                      dealer.status === 'approved' ? 'bg-[#10B981]/10 text-[#10B981]' :
                      dealer.status === 'pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                      'bg-[#E63946]/10 text-[#E63946]'
                    }`}>
                      {dealer.business_name?.charAt(0) || 'D'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">{dealer.business_name}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider truncate">
                        {dealer.city}, {dealer.province}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm ${
                        dealer.status === 'approved' ? 'bg-[#10B981]/10 text-[#10B981]' :
                        dealer.status === 'pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                        'bg-[#E63946]/10 text-[#E63946]'
                      }`}>
                        {dealer.status}
                      </span>
                      <span className="text-[8px] text-white/20 uppercase">{dealer.subscription_tier}</span>
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-white/30 text-sm">No dealers found</div>
              )}
            </div>
          </div>

          {/* RIGHT — Dealer Detail */}
          <div className="flex-1 overflow-y-auto">
            {selectedDealer ? (
              <div className="p-6 space-y-6">

                {/* Dealer Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-sm flex items-center justify-center font-black text-2xl ${
                      selectedDealer.status === 'approved' ? 'bg-[#10B981]/10 text-[#10B981]' :
                      selectedDealer.status === 'pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                      'bg-[#E63946]/10 text-[#E63946]'
                    }`}>
                      {selectedDealer.business_name?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white">
                        {selectedDealer.business_name}
                      </h2>
                      <p className="text-white/40 text-xs uppercase tracking-widest">
                        Applied {formatDate(selectedDealer.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dealers/${selectedDealer.slug}`}
                      target="_blank"
                      className="text-[10px] font-black uppercase tracking-widest text-[#4CC9F0] border border-[#4CC9F0]/30 px-3 py-2 rounded-sm hover:bg-[#4CC9F0]/10 transition-all"
                    >
                      View Storefront
                    </Link>
                    <button
                      onClick={() => handleDelete(selectedDealer.id)}
                      disabled={actionLoading === selectedDealer.id}
                      className="text-[10px] font-black uppercase tracking-widest text-[#E63946] border border-[#E63946]/30 px-3 py-2 rounded-sm hover:bg-[#E63946]/10 transition-all disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Status + Tier Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Application Status</p>
                    <div className="flex gap-2">
                      {['pending', 'approved', 'rejected'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(selectedDealer.id, status)}
                          disabled={actionLoading === selectedDealer.id || selectedDealer.status === status}
                          className={`flex-1 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 ${
                            selectedDealer.status === status
                              ? status === 'approved' ? 'bg-[#10B981] text-white'
                                : status === 'pending' ? 'bg-[#F59E0B] text-black'
                                : 'bg-[#E63946] text-white'
                              : 'bg-white/5 text-white/40 hover:bg-white/10'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Subscription Tier</p>
                    <div className="flex gap-2 flex-wrap">
                      {TIERS.map((tier) => (
                        <button
                          key={tier}
                          onClick={() => handleTierChange(selectedDealer.id, tier)}
                          disabled={changingTier === selectedDealer.id || selectedDealer.subscription_tier === tier}
                          className={`px-3 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 ${
                            selectedDealer.subscription_tier === tier
                              ? 'bg-[#C9922A] text-black'
                              : 'bg-white/5 text-white/40 hover:bg-white/10'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white mb-4">
                    Business <span className="text-[#E63946]">Details</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Contact Person', value: selectedDealer.contact_person },
                      { label: 'Email', value: selectedDealer.email },
                      { label: 'Phone', value: selectedDealer.phone },
                      { label: 'Business Type', value: selectedDealer.business_type },
                      { label: 'Registration No', value: selectedDealer.registration_number },
                      { label: 'SAPS Dealer No', value: selectedDealer.saps_dealer_number },
                      { label: 'Years in Business', value: selectedDealer.years_in_business?.toString() },
                      { label: 'Address', value: selectedDealer.address },
                      { label: 'City', value: selectedDealer.city },
                      { label: 'Province', value: selectedDealer.province },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">{item.label}</p>
                        <p className="text-sm font-bold text-white">{item.value || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white mb-4">
                    Uploaded <span className="text-[#4CC9F0]">Documents</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'SAPS Certificate', url: selectedDealer.saps_certificate_url },
                      { label: 'Business Registration', url: selectedDealer.business_registration_url },
                      { label: 'ID Document', url: selectedDealer.id_document_url },
                    ].map((doc) => (
                      <div key={doc.label}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">{doc.label}</p>
                        {doc.url ? (
                          
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-[#4CC9F0]/10 border border-[#4CC9F0]/20 px-3 py-2 rounded-sm text-[#4CC9F0] text-[10px] font-black uppercase tracking-widest hover:bg-[#4CC9F0]/20 transition-all"
                          >
                            📄 View Document
                          </a>
                        ) : (
                          <span className="text-white/20 text-xs">Not uploaded</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-4">🏪</div>
                  <p className="text-white/30 font-black uppercase tracking-widest text-sm">Select a dealer to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}