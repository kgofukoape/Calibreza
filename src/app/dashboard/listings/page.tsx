'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function MyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) { router.push('/login'); return; }
    setUser(currentUser);

    const { data } = await supabase
      .from('listings')
      .select(`
        *,
        makes:make_id(name),
        conditions:condition_id(name)
      `)
      .eq('seller_id', currentUser.id)
      .order('created_at', { ascending: false });

    setListings(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    await supabase.from('listings').delete().eq('id', id);
    setListings(prev => prev.filter(l => l.id !== id));
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('listings')
      .update({ status: newStatus })
      .eq('id', id);
    if (!error) {
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#2A9C6E]/10 text-[#2A9C6E] border border-[#2A9C6E]/20';
      case 'sold': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'under_offer': return 'bg-[#C9922A]/10 text-[#C9922A] border border-[#C9922A]/20';
      default: return 'bg-white/5 text-[#8A8E99] border border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-extrabold uppercase tracking-wide text-[#F0EDE8]">
          My <span className="text-[#C9922A]">Listings</span>
          <span className="ml-3 text-lg text-[#8A8E99] normal-case font-bold tracking-normal">({listings.length})</span>
        </h1>
        <Link href="/sell" className="bg-[#C9922A] text-black text-[11px] font-bold uppercase tracking-[0.2em] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
          + New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="bg-[#191C23] border border-white/5 rounded-sm p-16 text-center">
          <div className="text-5xl mb-4 opacity-20">📦</div>
          <p className="text-[#8A8E99] mb-4">You haven't posted any listings yet</p>
          <Link href="/sell" className="inline-block bg-[#C9922A] text-black font-bold px-6 py-3 rounded-sm text-[13px] uppercase hover:brightness-110 transition-all">
            Post Your First Listing
          </Link>
        </div>
      ) : (
        <div className="bg-[#191C23] border border-white/5 rounded-sm overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 bg-[#111318] px-5 py-3 border-b border-white/5">
            <span className="col-span-5 text-[10px] text-[#8A8E99] font-black uppercase tracking-widest">Item</span>
            <span className="col-span-2 text-[10px] text-[#8A8E99] font-black uppercase tracking-widest text-center">Status</span>
            <span className="col-span-2 text-[10px] text-[#8A8E99] font-black uppercase tracking-widest text-center">Views</span>
            <span className="col-span-3 text-[10px] text-[#8A8E99] font-black uppercase tracking-widest text-right">Actions</span>
          </div>

          <div className="divide-y divide-white/5">
            {listings.map((listing) => (
              <div key={listing.id} className="grid grid-cols-12 px-5 py-4 items-center hover:bg-white/[0.02] transition-all">

                {/* Item details */}
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden flex-shrink-0">
                    {listing.images?.length > 0 ? (
                      <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg opacity-20">🔫</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#F0EDE8] truncate">{listing.title}</p>
                    <p className="text-xs text-[#C9922A] font-black">R {listing.price?.toLocaleString('en-ZA')}</p>
                    <p className="text-[10px] text-[#8A8E99] uppercase tracking-wider">
                      {listing.makes?.name || '—'} · {listing.conditions?.name || '—'}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 flex justify-center">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${getStatusStyle(listing.status)}`}>
                    {listing.status?.replace('_', ' ') || 'active'}
                  </span>
                </div>

                {/* Views */}
                <div className="col-span-2 text-center">
                  <span className="text-sm font-bold text-[#F0EDE8]">{listing.views_count || 0}</span>
                </div>

                {/* Actions */}
                <div className="col-span-3 flex justify-end gap-2 flex-wrap">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#F0EDE8] transition-colors"
                  >
                    View
                  </Link>
                  <Link
                    href={`/dashboard/listings/edit/${listing.id}`}
                    className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125 transition-all"
                  >
                    Edit
                  </Link>
                  {listing.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(listing.id, 'sold')}
                      className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-red-400 transition-colors"
                    >
                      Sold
                    </button>
                  )}
                  {listing.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(listing.id, 'under_offer')}
                      className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#C9922A] transition-colors"
                    >
                      Under Offer
                    </button>
                  )}
                  {listing.status !== 'active' && (
                    <button
                      onClick={() => handleStatusChange(listing.id, 'active')}
                      className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#2A9C6E] transition-colors"
                    >
                      Relist
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-[#C9922A]/5 border border-[#C9922A]/10 rounded-sm">
        <p className="text-xs text-[#8A8E99] leading-relaxed">
          <strong className="text-[#C9922A]">Pro Tip:</strong> Listings marked as Sold stay visible for 30 days to help buyers track market prices.
        </p>
      </div>
    </div>
  );
}