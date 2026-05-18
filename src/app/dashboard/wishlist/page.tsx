'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

type SortOption = 'date_added' | 'price_asc' | 'price_desc' | 'expiring_soon';
type FilterOption = 'all' | 'available' | 'under_offer' | 'expired';

export default function WishlistPage() {
  const router = useRouter();
  const [user, setUser]           = useState<any>(null);
  const [items, setItems]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [sortBy, setSortBy]       = useState<SortOption>('date_added');
  const [filter, setFilter]       = useState<FilterOption>('all');
  const [pinging, setPinging]     = useState<string | null>(null);
  const [pingDone, setPingDone]   = useState<string | null>(null);
  const [removing, setRemoving]   = useState<string | null>(null);

  useEffect(() => { loadWishlist(); }, []);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      if (!currentUser) { router.push('/login'); return; }
      setUser(currentUser);

      // Step 1: get saved listing IDs
      const { data: savedData, error: savedError } = await supabase
        .from('saved_listings')
        .select('id, created_at, listing_id')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (savedError) throw savedError;
      if (!savedData || savedData.length === 0) { setItems([]); return; }

      // Step 2: fetch listings separately — avoids join column name issues
      const listingIds = savedData.map((s: any) => s.listing_id).filter(Boolean);
      const { data: listingsData } = await supabase
        .from('listings')
        .select('id, title, price, status, images, province, city, category_id, listing_type, is_featured, created_at, view_count, is_negotiable, seller_id, dealer_id, makes:make_id(name), conditions:condition_id(name)')
        .in('id', listingIds);

      // Step 3: merge
      const merged = savedData.map((saved: any) => ({
        ...saved,
        listings: listingsData?.find((l: any) => l.id === saved.listing_id) || null,
      }));

      setItems(merged);
    } catch (err) {
      console.error('Wishlist load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (savedId: string, listingId: string) => {
    setRemoving(listingId);
    await supabase.from('saved_listings').delete().eq('id', savedId);
    setItems(prev => prev.filter(i => i.id !== savedId));
    setRemoving(null);
  };

  const pingAvailability = async (item: any) => {
    const listing = item.listings;
    if (!listing || !user) return;
    setPinging(listing.id);
    try {
      const recipientId = listing.dealer_id || listing.seller_id;
      if (recipientId && recipientId !== user.id) {
        await supabase.from('user_messages').insert({
          sender_id:    user.id,
          recipient_id: recipientId,
          listing_id:   listing.id,
          body:         `Hi, I have this listing saved on my Gun X wishlist and wanted to check — is the ${listing.title} still available?`,
          is_read:      false,
        });
      }
      setPingDone(listing.id);
      setTimeout(() => setPingDone(null), 4000);
    } catch (err) {
      console.error('Ping error:', err);
    } finally {
      setPinging(null);
    }
  };

  const formatWhatsApp = (phone: string) => {
    if (!phone) return null;
    const d = phone.replace(/\D/g, '');
    return d.startsWith('27') ? d : d.startsWith('0') ? '27' + d.slice(1) : '27' + d;
  };

  const getDaysListed = (createdAt: string) => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  };

  const getDaysOnWishlist = (savedAt: string) => {
    return Math.floor((Date.now() - new Date(savedAt).getTime()) / 86400000);
  };

  const getExpiryDays = (createdAt: string) => {
    const daysListed = getDaysListed(createdAt);
    return Math.max(0, 90 - daysListed);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':      return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'under_offer': return 'text-[#C9922A] border-[#C9922A]/30 bg-[#C9922A]/10';
      case 'sold':        return 'text-red-400 border-red-500/30 bg-red-500/10';
      default:            return 'text-[#8A8E99] border-white/10 bg-white/5';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':      return '● Available';
      case 'under_offer': return '◐ Under Offer';
      case 'sold':        return '✗ Sold';
      default:            return status;
    }
  };

  // Sort and filter
  const processedItems = items
    .filter(item => {
      const listing = item.listings;
      if (!listing) return false;
      if (filter === 'available')   return listing.status === 'active';
      if (filter === 'under_offer') return listing.status === 'under_offer';
      if (filter === 'expired')     return listing.status === 'sold' || getExpiryDays(listing.created_at) === 0;
      return true;
    })
    .sort((a, b) => {
      const la = a.listings;
      const lb = b.listings;
      if (!la || !lb) return 0;
      switch (sortBy) {
        case 'price_asc':     return (la.price || 0) - (lb.price || 0);
        case 'price_desc':    return (lb.price || 0) - (la.price || 0);
        case 'expiring_soon': return getExpiryDays(la.created_at) - getExpiryDays(lb.created_at);
        default:              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const availableCount   = items.filter(i => i.listings?.status === 'active').length;
  const underOfferCount  = items.filter(i => i.listings?.status === 'under_offer').length;
  const soldCount        = items.filter(i => i.listings?.status === 'sold').length;
  const priceDrop        = items.filter(i => i.listings?.is_featured).length; // proxy for price drop

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-3xl md:text-4xl font-black uppercase tracking-wide text-[#F0EDE8]">
            My <span className="text-[#C9922A]">Wishlist</span>
          </h1>
          <p className="text-[#8A8E99] text-[13px] mt-1">
            {items.length} saved listing{items.length !== 1 ? 's' : ''} · {availableCount} still available
          </p>
        </div>
        <Link href="/browse"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:brightness-110 transition-all text-center flex-shrink-0">
          + Find More Listings
        </Link>
      </div>

      {/* STATS ROW */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Saved',        value: items.length,      color: 'text-[#F0EDE8]',  border: 'border-white/10' },
            { label: 'Available',    value: availableCount,    color: 'text-green-400',   border: 'border-green-500/20' },
            { label: 'Under Offer',  value: underOfferCount,   color: 'text-[#C9922A]',  border: 'border-[#C9922A]/20' },
            { label: 'Sold / Gone',  value: soldCount,         color: 'text-red-400',     border: 'border-red-500/20' },
          ].map(stat => (
            <div key={stat.label} className={`bg-[#191C23] border ${stat.border} rounded-sm p-4 text-center`}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS + SORT */}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'available', 'under_offer', 'expired'] as FilterOption[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-[#C9922A] text-black' : 'bg-[#191C23] border border-white/10 text-[#8A8E99] hover:text-[#F0EDE8]'
                }`}>
                {f === 'all' ? 'All' : f === 'under_offer' ? 'Under Offer' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}
            className="bg-[#191C23] border border-white/10 text-[#F0EDE8] text-[12px] px-3 py-2 rounded-sm focus:outline-none appearance-none">
            <option value="date_added">Sort: Date Added</option>
            <option value="price_asc">Sort: Price ↑</option>
            <option value="price_desc">Sort: Price ↓</option>
            <option value="expiring_soon">Sort: Expiring Soon</option>
          </select>
        </div>
      )}

      {/* EMPTY STATE */}
      {items.length === 0 && (
        <div className="bg-[#191C23] border border-white/5 rounded-sm p-12 text-center">
          <div className="text-5xl mb-4">⭐</div>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-2xl font-black uppercase mb-2">Your wishlist is empty</h3>
          <p className="text-[#8A8E99] text-sm mb-6">Save listings by clicking the ☆ Save button on any listing page.</p>
          <Link href="/browse"
            className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:brightness-110 transition-all">
            Browse Listings
          </Link>
        </div>
      )}

      {/* WISHLIST GRID */}
      {processedItems.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {processedItems.map(item => {
            const listing       = item.listings;
            if (!listing) return null;

            const daysOnWishlist = getDaysOnWishlist(item.created_at);
            const daysListed     = getDaysListed(listing.created_at);
            const expiryDays     = getExpiryDays(listing.created_at);
            const isExpiringSoon = expiryDays <= 7 && expiryDays > 0;
            const isExpired      = expiryDays === 0 || listing.status === 'sold';
            const isSold         = listing.status === 'sold';
            const phone          = listing.dealers?.phone || listing.profiles?.phone;
            const waNumber       = phone ? formatWhatsApp(phone) : null;
            const waMsg          = encodeURIComponent(`Hi, I have your ${listing.title} saved on my Gun X wishlist — is it still available?`);
            const waUrl          = waNumber ? `https://wa.me/${waNumber}?text=${waMsg}` : null;
            const sellerName     = listing.dealers?.business_name || listing.profiles?.full_name || 'Private Seller';
            const image          = listing.images?.[0];

            return (
              <div key={item.id}
                className={`bg-[#191C23] border rounded-sm overflow-hidden transition-all group ${
                  isSold ? 'border-red-500/20 opacity-70' : isExpiringSoon ? 'border-[#C9922A]/40' : 'border-white/5 hover:border-[#C9922A]/30'
                }`}>

                {/* EXPIRY WARNING */}
                {isExpiringSoon && !isSold && (
                  <div className="bg-[#C9922A]/10 border-b border-[#C9922A]/20 px-4 py-2 flex items-center gap-2">
                    <span className="text-[#C9922A] text-sm">⏳</span>
                    <p className="text-[#C9922A] text-[11px] font-black uppercase tracking-widest">
                      Listing expires in {expiryDays} day{expiryDays !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                {isSold && (
                  <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2">
                    <span className="text-red-400 text-sm">✗</span>
                    <p className="text-red-400 text-[11px] font-black uppercase tracking-widest">This item has been sold</p>
                  </div>
                )}

                <div className="flex gap-0">
                  {/* IMAGE */}
                  <div className="w-[120px] sm:w-[140px] flex-shrink-0 bg-[#13151A] relative overflow-hidden">
                    {image
                      ? <img src={image} alt={listing.title} className="w-full h-full object-cover" style={{ minHeight: '140px' }} />
                      : <div className="w-full flex items-center justify-center text-3xl opacity-20" style={{ minHeight: '140px' }}>🔫</div>}
                    {listing.is_featured && (
                      <div className="absolute top-2 left-2 bg-[#C9922A] text-black text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase">⭐ Featured</div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 min-w-0 p-4 flex flex-col gap-2">
                    {/* Status + Remove */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${getStatusColor(listing.status)}`}>
                        {getStatusLabel(listing.status)}
                      </span>
                      <button
                        onClick={() => removeFromWishlist(item.id, listing.id)}
                        disabled={removing === listing.id}
                        className="text-[#8A8E99] hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none"
                        title="Remove from wishlist">
                        {removing === listing.id ? '...' : '×'}
                      </button>
                    </div>

                    {/* Title */}
                    <Link href={`/listings/${listing.id}`}
                      className="font-black text-[14px] text-[#F0EDE8] hover:text-[#C9922A] transition-colors leading-tight line-clamp-2">
                      {listing.title}
                    </Link>

                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        className="text-2xl font-black text-[#C9922A]">
                        R {listing.price?.toLocaleString('en-ZA')}
                      </span>
                      {listing.is_negotiable && <span className="text-[10px] text-[#8A8E99] font-bold">ONO</span>}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#8A8E99]">
                      <span>📍 {listing.city || listing.province || 'N/A'}</span>
                      <span>👁 {listing.views_count || 0} view{listing.views_count !== 1 ? 's' : ''}</span>
                      <span>📅 Listed {daysListed}d ago</span>
                    </div>

                    {/* Wishlist meta */}
                    <div className="flex flex-wrap gap-x-3 text-[10px] text-[#8A8E99]/60 border-t border-white/5 pt-2">
                      <span>⭐ Saved {daysOnWishlist === 0 ? 'today' : `${daysOnWishlist}d ago`}</span>
                      {!isSold && expiryDays > 0 && <span>{expiryDays}d until expiry</span>}
                      <span>🏪 {sellerName}</span>
                    </div>

                    {/* ACTION BUTTONS */}
                    {!isSold && (
                      <div className="flex gap-2 flex-wrap pt-1">
                        <Link href={`/listings/${listing.id}`}
                          className="flex-1 text-center bg-[#C9922A] text-black font-black uppercase tracking-widest text-[10px] py-2 rounded-sm hover:brightness-110 transition-all min-w-[70px]">
                          View Ad
                        </Link>

                        {waUrl && (
                          <a href={waUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 bg-[#25D366] text-white font-black uppercase tracking-widest text-[10px] px-3 py-2 rounded-sm hover:brightness-110 transition-all">
                            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            WA
                          </a>
                        )}

                        <button
                          onClick={() => pingAvailability(item)}
                          disabled={pinging === listing.id || pingDone === listing.id}
                          className={`flex items-center gap-1 font-black uppercase tracking-widest text-[10px] px-3 py-2 rounded-sm border transition-all ${
                            pingDone === listing.id
                              ? 'bg-green-500/10 border-green-500/20 text-green-400'
                              : 'border-white/10 text-[#8A8E99] hover:border-[#C9922A]/40 hover:text-[#C9922A]'
                          }`}>
                          {pingDone === listing.id ? '✓ Sent' : pinging === listing.id ? '...' : '📨 Ping'}
                        </button>
                      </div>
                    )}

                    {/* SOLD — find similar */}
                    {isSold && (
                      <Link href={`/browse/${listing.category_id}`}
                        className="text-center border border-[#C9922A]/30 text-[#C9922A] font-black uppercase tracking-widest text-[10px] py-2 rounded-sm hover:bg-[#C9922A]/10 transition-all">
                        Find Similar →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NO RESULTS AFTER FILTER */}
      {items.length > 0 && processedItems.length === 0 && (
        <div className="bg-[#191C23] border border-white/5 rounded-sm p-10 text-center">
          <p className="text-[#8A8E99] text-sm mb-3">No listings match this filter.</p>
          <button onClick={() => setFilter('all')} className="text-[#C9922A] font-black uppercase tracking-widest text-[12px] hover:brightness-125">
            Show All
          </button>
        </div>
      )}

      {/* CTA STRIP */}
      {items.length > 0 && (
        <div className="bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black text-[16px] uppercase">
              Have something to sell?
            </p>
            <p className="text-[#8A8E99] text-[12px]">First 5 listings free · No subscription needed</p>
          </div>
          <Link href="/sell"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all whitespace-nowrap flex-shrink-0">
            Post a Free Listing →
          </Link>
        </div>
      )}
    </div>
  );
}
