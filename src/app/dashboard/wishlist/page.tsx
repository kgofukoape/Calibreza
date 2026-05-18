'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function WishlistPage() {
  const [items, setItems]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError]       = useState<string>('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      let uid = '';
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        uid = session.user.id;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) uid = user.id;
      }

      if (!uid) {
        setError('Not logged in — please sign in again.');
        setLoading(false);
        return;
      }

      const { data: saved, error: savedErr } = await supabase
        .from('saved_listings')
        .select('id, listing_id, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (savedErr) { setError(`Error: ${savedErr.message}`); setLoading(false); return; }
      if (!saved || saved.length === 0) { setItems([]); setLoading(false); return; }

      const ids = saved.map((s: any) => s.listing_id).filter(Boolean);
      if (ids.length === 0) { setItems([]); setLoading(false); return; }

      // Use EXACT columns from the working listing detail page
      const { data: listingsData, error: listingsErr } = await supabase
        .from('listings')
        .select('id, title, price, status, images, city, view_count, views_count, category_id, is_negotiable, created_at')
        .in('id', ids);

      if (listingsErr) { setError(`Listings error: ${listingsErr.message}`); setLoading(false); return; }

      const map: Record<string, any> = {};
      (listingsData || []).forEach((l: any) => { map[l.id] = l; });

      const results = saved
        .map((s: any) => ({ savedId: s.id, savedAt: s.created_at, listing: map[s.listing_id] || null }))
        .filter((r: any) => r.listing !== null);

      setItems(results);
    } catch (err: any) {
      setError(`Error: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (savedId: string) => {
    setRemoving(savedId);
    await supabase.from('saved_listings').delete().eq('id', savedId);
    setItems(prev => prev.filter((i: any) => i.savedId !== savedId));
    setRemoving(null);
  };

  const daysAgo   = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  const expiresIn = (d: string) => Math.max(0, 90 - daysAgo(d));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#8A8E99] text-sm">Loading your wishlist...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-8 text-center">
      <p className="text-red-400 font-bold mb-4">{error}</p>
      <button onClick={load} className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110">
        Try Again
      </button>
    </div>
  );

  const available  = items.filter((i: any) => i.listing?.status === 'active').length;
  const underOffer = items.filter((i: any) => i.listing?.status === 'under_offer').length;
  const sold       = items.filter((i: any) => i.listing?.status === 'sold').length;

  return (
    <div className="flex flex-col gap-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-3xl md:text-4xl font-black uppercase tracking-wide text-[#F0EDE8]">
            My <span className="text-[#C9922A]">Wishlist</span>
          </h1>
          <p className="text-[#8A8E99] text-[13px] mt-1">{items.length} saved · {available} available</p>
        </div>
        <Link href="/browse" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:brightness-110 transition-all text-center flex-shrink-0">
          + Find More Listings
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Saved',       value: items.length, color: 'text-[#F0EDE8]', border: 'border-white/10'      },
          { label: 'Available',   value: available,    color: 'text-green-400',  border: 'border-green-500/20' },
          { label: 'Under Offer', value: underOffer,   color: 'text-[#C9922A]', border: 'border-[#C9922A]/20' },
          { label: 'Sold',        value: sold,         color: 'text-red-400',    border: 'border-red-500/20'   },
        ].map(s => (
          <div key={s.label} className={`bg-[#191C23] border ${s.border} rounded-sm p-4 text-center`}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="bg-[#191C23] border border-white/5 rounded-sm p-12 text-center">
          <div className="text-5xl mb-4">⭐</div>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2">Your wishlist is empty</h3>
          <p className="text-[#8A8E99] text-sm mb-6">Click ☆ Save on any listing page to add it here.</p>
          <Link href="/browse" className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:brightness-110 transition-all">Browse Listings</Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map(({ savedId, savedAt, listing }: any) => {
            if (!listing) return null;
            const exp          = expiresIn(listing.created_at);
            const isSold       = listing.status === 'sold';
            const expiringSoon = exp <= 7 && exp > 0 && !isSold;
            const image        = listing.images?.[0];
            const location     = listing.city || listing.provinces?.name || 'N/A';

            return (
              <div key={savedId} className={`bg-[#191C23] border rounded-sm overflow-hidden transition-all ${
                isSold ? 'border-red-500/20 opacity-70' : expiringSoon ? 'border-[#C9922A]/40' : 'border-white/5 hover:border-[#C9922A]/30'
              }`}>
                {expiringSoon && <div className="bg-[#C9922A]/10 border-b border-[#C9922A]/20 px-4 py-2"><p className="text-[#C9922A] text-[11px] font-black uppercase tracking-widest">⏳ Expires in {exp} day{exp !== 1 ? 's' : ''}</p></div>}
                {isSold       && <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2"><p className="text-red-400 text-[11px] font-black uppercase tracking-widest">✗ This item has been sold</p></div>}

                <div className="flex">
                  <div className="w-[120px] sm:w-[140px] flex-shrink-0 bg-[#13151A] relative" style={{ minHeight: '140px' }}>
                    {image
                      ? <img src={image} alt={listing.title} className="absolute inset-0 w-full h-full object-cover" />
                      : <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-20">🔫</div>}
                  </div>

                  <div className="flex-1 min-w-0 p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      {listing.status === 'active'
                        ? <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-green-500/10 border border-green-500/30 text-green-400">● Available</span>
                        : listing.status === 'under_offer'
                        ? <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-[#C9922A]/10 border border-[#C9922A]/30 text-[#C9922A]">◐ Under Offer</span>
                        : <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400">✗ Sold</span>}
                      <button onClick={() => remove(savedId)} disabled={removing === savedId}
                        className="text-[#8A8E99] hover:text-red-400 transition-colors text-xl leading-none flex-shrink-0">
                        {removing === savedId ? '…' : '×'}
                      </button>
                    </div>

                    <Link href={`/listings/${listing.id}`} className="font-black text-[14px] text-[#F0EDE8] hover:text-[#C9922A] transition-colors leading-tight">
                      {listing.title}
                    </Link>

                    <div className="flex items-baseline gap-2">
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black text-[#C9922A]">
                        R {listing.price?.toLocaleString('en-ZA')}
                      </span>
                      {listing.is_negotiable && <span className="text-[10px] text-[#8A8E99] font-bold">ONO</span>}
                    </div>

                    <div className="flex flex-wrap gap-x-3 text-[11px] text-[#8A8E99]">
                      <span>📍 {location}</span>
                      <span>👁 {listing.view_count || listing.views_count || 0} views</span>
                      <span>📅 Listed {daysAgo(listing.created_at)}d ago</span>
                    </div>

                    <div className="text-[10px] text-[#8A8E99]/60 border-t border-white/5 pt-2">
                      Saved {daysAgo(savedAt) === 0 ? 'today' : `${daysAgo(savedAt)}d ago`} · {exp}d until expiry
                    </div>

                    {!isSold
                      ? <Link href={`/listings/${listing.id}`} className="text-center bg-[#C9922A] text-black font-black uppercase tracking-widest text-[10px] py-2 rounded-sm hover:brightness-110 transition-all mt-1">View Listing</Link>
                      : <Link href={`/browse/${listing.category_id}`} className="text-center border border-[#C9922A]/30 text-[#C9922A] font-black uppercase tracking-widest text-[10px] py-2 rounded-sm hover:bg-[#C9922A]/10 transition-all mt-1">Find Similar →</Link>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black text-[16px] uppercase">Have something to sell?</p>
            <p className="text-[#8A8E99] text-[12px]">First 5 listings free · No subscription needed</p>
          </div>
          <Link href="/sell" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all whitespace-nowrap flex-shrink-0">
            Post a Free Listing →
          </Link>
        </div>
      )}
    </div>
  );
}
