'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function ListingDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [listing, setListing] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [similarListings, setSimilarListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [messageSending, setMessageSending] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [viewersNow, setViewersNow] = useState(0);

  useEffect(() => {
    loadData();
    incrementViews();

    const interval = setInterval(() => {
      setViewersNow(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.max(1, Math.min(18, prev + delta));
      });
    }, 28000 + Math.random() * 12000);
    return () => clearInterval(interval);
  }, [params.id]);

  const formatCategory = (cat: string) =>
    cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'N/A';

  const formatWhatsAppNumber = (phone: string) => {
    if (!phone) return null;
    const d = phone.replace(/\D/g, '');
    if (d.startsWith('27')) return d;
    if (d.startsWith('0')) return '27' + d.slice(1);
    return '27' + d;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);

      const { data: listingData, error } = await supabase
        .from('listings')
        .select(`*, makes:make_id(name), calibres:calibre_id(name), conditions:condition_id(name), provinces:province_id(name), dealers:dealer_id(business_name, slug, logo_url, phone, email, rating)`)
        .eq('id', params.id)
        .single();

      if (error || !listingData) throw error;
      setListing(listingData);

      // FOMO logic relative to actual views
      const realViews = listingData.view_count || 1;
      const initialFOMO = realViews > 15 ? (Math.floor(Math.random() * 8) + 4) : (Math.floor(Math.random() * 2) + 1);
      setViewersNow(initialFOMO);

      // Check Database for Saved Status
      if (user) {
        const { data: savedData } = await supabase
          .from('saved_listings')
          .select('id')
          .eq('listing_id', params.id)
          .eq('user_id', user.id)
          .maybeSingle();
        setIsSaved(!!savedData);
      }

      if (listingData.listing_type === 'dealer' && listingData.dealers) {
        setSeller({
          full_name: listingData.dealers.business_name,
          slug: listingData.dealers.slug,
          logo_url: listingData.dealers.logo_url,
          phone: listingData.dealers.phone,
          email: listingData.dealers.email,
          rating: listingData.dealers.rating,
          is_dealer: true,
        });
      } else if (listingData.seller_id) {
        const { data: userData } = await supabase.from('users').select('*').eq('id', listingData.seller_id).single();
        setSeller(userData ? { ...userData, is_dealer: false } : null);
      }

      const { data: similarData } = await supabase
        .from('listings')
        .select(`*, makes:make_id(name), calibres:calibre_id(name), conditions:condition_id(name), provinces:province_id(name)`)
        .eq('category_id', listingData.category_id)
        .eq('status', 'active')
        .neq('id', params.id)
        .limit(4);

      setSimilarListings(similarData || []);
    } catch (err) {
      console.error('Error loading listing:', err);
      setListing(null);
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    try { await supabase.rpc('increment_listing_views', { listing_id: params.id }); } catch {}
  };

  const handleSave = async () => {
    if (!currentUser) { router.push('/login'); return; }
    
    if (isSaved) {
      await supabase.from('saved_listings').delete().eq('listing_id', params.id).eq('user_id', currentUser.id);
    } else {
      await supabase.from('saved_listings').insert({ listing_id: params.id, user_id: currentUser.id });
    }
    setIsSaved(!isSaved);
  };

  const handleContactSeller = () => {
    if (!currentUser) { router.push('/login'); return; }
    setShowContactModal(true);
  };

  const handleShare = async () => {
    try { await navigator.clipboard.writeText(window.location.href); } catch {
      const el = document.createElement('textarea');
      el.value = window.location.href;
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const Leaderboard = () => (
    <div className="w-full flex justify-center py-3">
      <div className="w-full max-w-[970px] h-[90px] bg-[#12141a] border border-white/5 flex items-center justify-center relative rounded-sm">
        <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">Advertisement — 970 × 90</span>
        <div className="absolute inset-0 border border-dashed border-white/10 opacity-20 rounded-sm" />
      </div>
    </div>
  );

  const WaIcon = ({ size = 5 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" className={`w-${size} h-${size} fill-current`} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0D0F13]">
        <Navbar />
        <Leaderboard />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0D0F13]">
        <Navbar />
        <Leaderboard />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <h2 className="text-2xl font-bold text-[#F0EDE8]">Listing Not Found</h2>
          <p className="text-[#8A8E99]">This listing may have been removed.</p>
          <Link href="/browse" className="bg-[#C9922A] text-black font-bold px-6 py-3 rounded-sm">Browse Listings</Link>
        </div>
      </div>
    );
  }

  const images = listing?.images && Array.isArray(listing.images) && listing.images.length > 0 ? listing.images : null;
  const waNumber = formatWhatsAppNumber(seller?.phone);
  const waMsg = encodeURIComponent(`Hi, I'm interested in your ${listing.title} on Gun X. Is it still available?`);
  const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${waMsg}` : null;
  const viewCount = listing.view_count || 1;

  const specs = [
    ['Make', listing.makes?.name],
    ['Model', listing.model],
    ['Calibre', listing.calibres?.name],
    ['Condition', listing.conditions?.name],
    ['Category', formatCategory(listing.category_id)],
    ['Action Type', listing.action_type],
    ['Capacity', listing.capacity],
    ['Barrel Length', listing.barrel_length],
    ['Province', listing.provinces?.name],
  ].filter(([, val]) => val);

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      {/* TOP LEADERBOARD */}
      <div className="px-4">
        <Leaderboard />
      </div>

      {/* BREADCRUMB */}
      <div className="bg-[#191C23] border-b border-white/5 py-3 px-4 md:px-6">
        <div className="max-w-[1280px] mx-auto text-[11px] text-[#8A8E99] tracking-widest uppercase flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/browse" className="hover:text-[#C9922A] transition-colors">Browse</Link>
          <span>/</span>
          <Link href={`/browse/${listing.category_id}`} className="hover:text-[#C9922A] transition-colors">{formatCategory(listing.category_id)}</Link>
          <span>/</span>
          <span className="text-[#F0EDE8] truncate max-w-[200px]">{listing.title}</span>
        </div>
      </div>

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 md:px-6 py-5 md:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8">

        {/* LEFT: Images + Description */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* GALLERY */}
          <div className="flex flex-col gap-2">
            <div className="w-full bg-[#191C23] border border-white/5 rounded-sm flex items-center justify-center relative overflow-hidden"
              style={{ aspectRatio: '4/3', maxHeight: '520px' }}>
              {images
                ? <img src={images[selectedImage]} alt={listing.title} className="w-full h-full object-contain" />
                : <span className="text-6xl opacity-10">📷</span>
              }
              {images && images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImage(i => Math.max(0, i - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/70 rounded-full flex items-center justify-center text-white text-xl hover:bg-black/90">‹</button>
                  <button onClick={() => setSelectedImage(i => Math.min(images.length - 1, i + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/70 rounded-full flex items-center justify-center text-white text-xl hover:bg-black/90">›</button>
                  <div className="absolute top-3 right-3 bg-black/70 text-white text-[11px] font-bold px-2.5 py-1 rounded-sm">{selectedImage + 1} / {images.length}</div>
                </>
              )}
              {listing.is_featured && <div className="absolute top-3 left-3 bg-[#C9922A] text-black text-[10px] font-black px-2 py-1 uppercase tracking-tight rounded-sm">⭐ Featured</div>}
            </div>
            {images && images.length > 1 && (
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {images.slice(0, 8).map((img: string, idx: number) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)}
                    className={`aspect-square bg-[#191C23] rounded-sm overflow-hidden transition-all ${selectedImage === idx ? 'border-2 border-[#C9922A]' : 'border border-white/10 hover:border-[#C9922A]/50'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:hidden bg-[#191C23] border border-white/5 rounded-sm p-5">
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-extrabold text-2xl uppercase text-[#F0EDE8] leading-tight mb-2">{listing.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mb-3 text-[12px] text-[#8A8E99]">
              <span>📍 {listing.city}</span>
              <span>👁 {viewCount} view{viewCount !== 1 ? 's' : ''}</span>
              <span>📅 {new Date(listing.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-extrabold text-4xl text-[#C9922A] leading-none mb-4">
              R {listing.price?.toLocaleString()}
              {listing.is_negotiable && <span className="text-[16px] text-[#8A8E99] ml-2 font-bold">ONO</span>}
            </div>
            <button onClick={handleContactSeller} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="w-full bg-[#C9922A] text-black font-bold text-[16px] tracking-widest uppercase py-3.5 rounded-sm hover:brightness-110 transition-all mb-3">
              Contact Seller
            </button>
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold text-[14px] tracking-widest uppercase py-3 rounded-sm hover:brightness-110 transition-all">
                <WaIcon /> WhatsApp Seller
              </a>
            )}
          </div>

          <div className="bg-[#191C23] border border-white/5 rounded-sm p-5 md:p-6">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-bold text-xl tracking-wide uppercase text-[#F0EDE8] border-b border-white/5 pb-3 mb-4">Description</h2>
            <div className="text-[14px] text-[#8A8E99] leading-relaxed whitespace-pre-wrap">{listing.description || 'No description provided.'}</div>
          </div>

          <Leaderboard />

          <div className="lg:hidden bg-[#191C23] border border-white/5 rounded-sm p-5">
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-bold text-[16px] tracking-widest uppercase text-[#F0EDE8] border-b border-white/5 pb-3 mb-4">Specifications</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {specs.map(([label, val]) => (
                <div key={label as string}>
                  <span className="text-[10px] text-[#8A8E99] uppercase tracking-widest font-bold block">{label}</span>
                  <span className="text-[13px] text-[#F0EDE8] font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-sm p-5">
            <h3 className="font-bold text-[13px] text-[#C9922A] mb-2">⚠️ Legal Compliance Notice</h3>
            <p className="text-[13px] text-[#8A8E99] leading-relaxed mb-2">
              All firearm transactions must comply with the Firearms Control Act (Act 60 of 2000). Buyer must possess a valid firearm licence for the appropriate category. Transfer must be completed through a licensed dealer.
            </p>
            <Link href="/dealers" className="text-[#C9922A] text-[12px] font-bold uppercase tracking-widest hover:brightness-125 transition-all">
              Find a Licensed Dealer Near You →
            </Link>
          </div>

          <div className="lg:hidden flex items-center justify-center gap-6 text-[11px] font-bold tracking-widest uppercase text-[#8A8E99]">
            <button onClick={handleSave} className={`transition-colors ${isSaved ? 'text-[#C9922A]' : 'hover:text-[#F0EDE8]'}`}>{isSaved ? '⭐ Saved' : '☆ Save'}</button>
            <span>|</span>
            <button onClick={handleShare} className={`transition-colors ${shareCopied ? 'text-[#2A9C6E]' : 'hover:text-[#F0EDE8]'}`}>{shareCopied ? '✓ Copied!' : '🔗 Share'}</button>
            <span>|</span>
            <button onClick={() => { if (!currentUser) { router.push('/login'); return; } setShowReportModal(true); }} className="hover:text-red-400 transition-colors text-red-500/70">🚩 Report</button>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:flex w-[340px] xl:w-[380px] flex-shrink-0 flex-col gap-4">

          <div className="bg-[#191C23] border border-white/5 rounded-sm p-6 flex flex-col gap-4">

            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-red-400 font-black text-[12px] uppercase tracking-widest">
                {viewersNow} people viewing right now
              </span>
            </div>

            <div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-extrabold text-2xl xl:text-3xl uppercase text-[#F0EDE8] leading-tight mb-1">{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#8A8E99]">
                <span>📍 {listing.city}</span>
                <span>·</span>
                <span>👁 <strong className="text-[#F0EDE8]">{viewCount}</strong> view{viewCount !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>📅 {new Date(listing.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-extrabold text-[44px] xl:text-[52px] text-[#C9922A] leading-none">
              R {listing.price?.toLocaleString()}
              {listing.is_negotiable && <span className="text-[18px] text-[#8A8E99] ml-2 font-bold">ONO</span>}
            </div>

            <button onClick={handleContactSeller} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="w-full bg-[#C9922A] text-black font-bold text-[17px] tracking-widest uppercase py-4 rounded-sm hover:brightness-110 transition-all shadow-lg">
              Contact Seller
            </button>

            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] text-white font-bold text-[15px] tracking-widest uppercase py-3.5 rounded-sm hover:brightness-110 transition-all">
                <WaIcon size={5} /> WhatsApp Seller
              </a>
            )}

            <div className="flex items-center justify-center gap-4 text-[11px] font-bold tracking-widest uppercase text-[#8A8E99] border-t border-white/5 pt-3">
              <button onClick={handleSave} className={`transition-colors flex items-center gap-1 ${isSaved ? 'text-[#C9922A]' : 'hover:text-[#F0EDE8]'}`}>
                {isSaved ? '⭐ Saved' : '☆ Save'}
              </button>
              <span>|</span>
              <button onClick={handleShare} className={`transition-colors ${shareCopied ? 'text-[#2A9C6E]' : 'hover:text-[#F0EDE8]'}`}>
                {shareCopied ? '✓ Copied!' : '🔗 Share'}
              </button>
              <span>|</span>
              <button onClick={() => { if (!currentUser) { router.push('/login'); return; } setShowReportModal(true); }} className="hover:text-red-400 transition-colors text-red-500/70">
                🚩 Report
              </button>
            </div>
          </div>

          <div className="bg-[#191C23] border border-white/5 rounded-sm p-5">
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-bold text-[15px] tracking-widest uppercase text-[#F0EDE8] border-b border-white/5 pb-3 mb-4">
              {seller?.is_dealer ? 'Dealer' : 'Seller'}
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-[#C9922A] flex items-center justify-center overflow-hidden flex-shrink-0">
                {seller?.logo_url
                  ? <img src={seller.logo_url} alt="" className="w-full h-full object-cover" />
                  : <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-bold text-black">{seller?.full_name?.charAt(0) || 'S'}</span>
                }
              </div>
              <div>
                <p className="font-bold text-[14px] text-[#F0EDE8]">{seller?.full_name || 'Private Seller'}</p>
                <p className="text-[11px] text-[#8A8E99]">{seller?.is_dealer ? 'Licensed Dealer' : 'Private Seller'}</p>
                {seller?.rating && <p className="text-[11px] text-[#C9922A]">★ {seller.rating.toFixed(1)}</p>}
              </div>
            </div>
            {seller?.is_dealer && seller?.slug && (
              <Link href={`/dealers/${seller.slug}`} className="text-[12px] text-[#C9922A] font-bold uppercase tracking-widest hover:brightness-125 block">
                View Full Dealer Storefront →
              </Link>
            )}
          </div>

          <div className="bg-[#191C23] border border-white/5 rounded-sm p-5">
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-bold text-[15px] tracking-widest uppercase text-[#F0EDE8] border-b border-white/5 pb-3 mb-3">
              Specifications
            </h3>
            <div className="flex flex-col">
              {specs.map(([label, val], i) => (
                <div key={label as string} className={`flex justify-between py-2.5 ${i !== specs.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <span className="text-[12px] text-[#8A8E99]">{label}</span>
                  <span className="text-[12px] font-medium text-[#F0EDE8] text-right ml-4">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full bg-[#12141a] border border-white/5 rounded-sm flex flex-col items-center justify-center" style={{ height: '250px' }}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest font-bold mb-1">Advertisement</span>
            <span className="text-[9px] text-[#3A3E49] font-bold">300 × 250</span>
          </div>

          <div className="w-full bg-[#12141a] border border-white/5 rounded-sm flex flex-col items-center justify-center" style={{ height: '300px' }}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest font-bold mb-1">Advertisement</span>
            <span className="text-[9px] text-[#3A3E49] font-bold">300 × 300</span>
          </div>
        </aside>
      </main>

      {similarListings.length > 0 && (
        <section className="max-w-[1280px] mx-auto w-full px-4 md:px-6 pb-12">
          <Leaderboard />
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-extrabold text-2xl md:text-3xl uppercase text-[#F0EDE8] mb-5 mt-2">
            Similar <span className="text-[#C9922A]">Listings</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {similarListings.map(item => (
              <ListingCard
                key={item.id} id={item.id} title={item.title}
                make={item.makes?.name || 'Unknown'} calibre={item.calibres?.name || 'N/A'}
                price={item.price} province={item.provinces?.name || 'N/A'}
                condition={item.conditions?.name || 'N/A'} category={formatCategory(item.category_id)}
                listingType={item.listing_type} sellerName={item.city || 'Private'}
                images={item.images}
              />
            ))}
          </div>
        </section>
      )}

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0D0F13]/95 backdrop-blur-sm border-t border-white/10 px-4 py-3 flex gap-3">
        <button onClick={handleContactSeller} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-3.5 rounded-sm hover:brightness-110 transition-all">
          Contact Seller
        </button>
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold uppercase tracking-widest text-[13px] px-4 rounded-sm hover:brightness-110 transition-all">
            <WaIcon size={5} />
          </a>
        )}
      </div>

      {showContactModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#191C23] border border-white/10 rounded-sm p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black text-2xl uppercase text-[#F0EDE8]">Contact {seller?.is_dealer ? 'Dealer' : 'Seller'}</h3>
              <button onClick={() => setShowContactModal(false)} className="text-[#8A8E99] hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/5">
              <div className="w-11 h-11 rounded-full bg-[#C9922A] flex items-center justify-center overflow-hidden flex-shrink-0">
                {seller?.logo_url ? <img src={seller.logo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-black font-black text-lg">{(seller?.full_name || 'S').charAt(0)}</span>}
              </div>
              <div>
                <p className="font-bold text-[14px] text-[#F0EDE8]">{seller?.full_name || 'Private Seller'}</p>
                <p className="text-[11px] text-[#8A8E99] uppercase tracking-wider">{seller?.is_dealer ? 'Licensed Dealer' : 'Private Seller'}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-5">
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-[#25D366]/10 border border-[#25D366]/30 rounded-sm px-4 py-3.5 hover:bg-[#25D366]/20 transition-all">
                  <div className="w-9 h-9 bg-[#25D366]/20 rounded-full flex items-center justify-center flex-shrink-0 text-[#25D366]"><WaIcon /></div>
                  <div>
                    <p className="text-[10px] text-[#8A8E99] uppercase tracking-widest font-bold">WhatsApp</p>
                    <p className="text-[14px] font-bold text-[#25D366]">Message on WhatsApp</p>
                  </div>
                </a>
              )}
              {seller?.phone && (
                <a href={`tel:${seller.phone}`} className="flex items-center gap-4 bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3.5 hover:border-[#C9922A]/50 transition-all group">
                  <div className="w-9 h-9 bg-[#C9922A]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#C9922A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" fill="currentColor" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8A8E99] uppercase tracking-widest font-bold">Phone</p>
                    <p className="text-[14px] font-bold text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{seller.phone}</p>
                  </div>
                </a>
              )}
              {seller?.email && (
                <a href={`mailto:${seller.email}?subject=Enquiry: ${encodeURIComponent(listing?.title || '')}`}
                  className="flex items-center gap-4 bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3.5 hover:border-[#C9922A]/50 transition-all group">
                  <div className="w-9 h-9 bg-[#C9922A]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#C9922A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" fill="currentColor" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8A8E99] uppercase tracking-widest font-bold">Email</p>
                    <p className="text-[14px] font-bold text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{seller.email}</p>
                  </div>
                </a>
              )}
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Send a Message</p>
              {messageSent ? (
                <div className="bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm p-3 text-center">
                  <p className="text-[#2A9C6E] font-bold text-sm">✓ Message sent!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <textarea value={messageBody} onChange={e => setMessageBody(e.target.value)} rows={3}
                    placeholder={`Hi, I'm interested in your ${listing?.title}...`}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#F0EDE8] resize-none focus:outline-none focus:border-[#C9922A]/60" />
                  <button
                    onClick={async () => {
                      if (!messageBody.trim() || !currentUser || !listing) return;
                      const recipientId = listing.seller_id || listing.dealer_id;
                      if (!recipientId || recipientId === currentUser.id) return;
                      setMessageSending(true);
                      const { error } = await supabase.from('user_messages').insert({ sender_id: currentUser.id, recipient_id: recipientId, listing_id: listing.id, body: messageBody.trim(), is_read: false });
                      setMessageSending(false);
                      if (!error) { setMessageSent(true); setMessageBody(''); }
                    }}
                    disabled={messageSending || !messageBody.trim()}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] py-2.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                    {messageSending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              )}
            </div>
            <p className="text-[11px] text-[#8A8E99] mt-3 text-center">
              Always meet at a <Link href="/dealers" className="text-[#C9922A] hover:brightness-125" onClick={() => setShowContactModal(false)}>licensed dealer</Link> for all transfers.
            </p>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#191C23] border border-white/5 rounded-sm p-6 max-w-md w-full">
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-bold text-2xl uppercase text-[#F0EDE8] mb-4">Report Listing</h3>
            <select value={reportReason} onChange={e => setReportReason(e.target.value)}
              className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-4 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A] mb-4">
              <option value="">Select a reason...</option>
              <option value="scam">Suspected scam</option>
              <option value="illegal">Illegal item</option>
              <option value="fake">Fake/counterfeit</option>
              <option value="duplicate">Duplicate listing</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-3">
              <button onClick={async () => { if (!reportReason.trim()) return; alert(`Report submitted.`); setShowReportModal(false); setReportReason(''); }} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-sm hover:brightness-110">Submit Report</button>
              <button onClick={() => setShowReportModal(false)} className="px-5 bg-transparent border border-white/20 text-[#F0EDE8] font-bold py-3 rounded-sm hover:bg-white/5">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}