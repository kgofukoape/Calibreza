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
  const [contactMessage, setContactMessage] = useState('');
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    loadData();
    incrementViews();
  }, [params.id]);

  const formatCategory = (cat: string) =>
    cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'N/A';

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);

      // Fixed query — removed broken categories join, added dealers join
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select(`
          *,
          makes:make_id(name),
          calibres:calibre_id(name),
          conditions:condition_id(name),
          provinces:province_id(name),
          dealers:dealer_id(business_name, slug, logo_url, phone, email, rating)
        `)
        .eq('id', params.id)
        .single();

      if (listingError || !listingData) throw listingError;
      setListing(listingData);

      // Set seller info — dealer listing or private
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
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', listingData.seller_id)
          .single();
        setSeller(userData ? { ...userData, is_dealer: false } : null);
      }

      // Similar listings — same category, exclude current
      const { data: similarData } = await supabase
        .from('listings')
        .select(`
          *,
          makes:make_id(name),
          calibres:calibre_id(name),
          conditions:condition_id(name),
          provinces:province_id(name)
        `)
        .eq('category_id', listingData.category_id)
        .eq('status', 'active')
        .neq('id', params.id)
        .limit(4);

      setSimilarListings(similarData || []);
    } catch (error) {
      console.error('Error loading listing:', error);
      setListing(null);
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    try {
      await supabase.rpc('increment_listing_views', { listing_id: params.id });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const handleContactSeller = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setShowContactModal(true);
  };

  const sendMessage = async () => {
    if (!contactMessage.trim()) return;
    try {
      alert(`Message sent to ${seller?.full_name}:\n\n${contactMessage}`);
      setShowContactModal(false);
      setContactMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Check out this ${listing.title} for R${listing.price.toLocaleString()}`,
          url: url,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleReport = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return;
    try {
      alert(`Report submitted. Reason: ${reportReason}`);
      setShowReportModal(false);
      setReportReason('');
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0D0F13]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#C9922A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[14px] text-[#8A8E99]">Loading listing...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0D0F13]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#F0EDE8] mb-2">Listing Not Found</h2>
            <p className="text-[#8A8E99] mb-6">This listing may have been removed or doesn't exist.</p>
            <Link href="/browse" className="bg-[#C9922A] text-black font-bold px-6 py-3 rounded-sm">
              Browse Listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images =
    listing?.images && Array.isArray(listing.images) && listing.images.length > 0
      ? listing.images
      : null;

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-[#191C23] border-b border-white/5 py-4 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto text-[11px] text-[#8A8E99] tracking-widest uppercase flex items-center gap-2">
          <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/browse" className="hover:text-[#C9922A] transition-colors">Browse</Link>
          <span>/</span>
          <span className="text-[#F0EDE8]">{listing.title}</span>
        </div>
      </div>

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 md:px-8 py-8 flex flex-col lg:flex-row gap-10">

        {/* LEFT: Images & Description */}
        <div className="flex-1 flex flex-col gap-8">

          {/* Image Gallery */}
          <div className="flex flex-col gap-3">
            <div className="w-full aspect-[4/3] bg-[#191C23] border border-white/5 rounded-md flex items-center justify-center relative overflow-hidden group">
              {images ? (
                <img
                  src={images[selectedImage]}
                  alt={listing.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-7xl opacity-10">📷</span>
              )}
              {images && images.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/70 text-white text-[12px] font-bold px-3 py-1.5 rounded-sm">
                  {selectedImage + 1} / {images.length}
                </div>
              )}
            </div>

            {images && images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {images.slice(0, 5).map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square bg-[#191C23] rounded-sm overflow-hidden transition-all ${
                      selectedImage === idx
                        ? 'border-2 border-[#C9922A]'
                        : 'border border-white/10 hover:border-[#C9922A]/50'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8">
            <h2
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="font-bold text-2xl tracking-wide uppercase text-[#F0EDE8] border-b border-white/5 pb-4 mb-6"
            >
              Description
            </h2>
            <div className="text-[14px] md:text-[15px] text-[#8A8E99] leading-relaxed whitespace-pre-wrap">
              {listing.description || 'No description provided.'}
            </div>
          </div>

          {/* Legal Notice */}
          <div className="bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-md p-6">
            <h3 className="font-bold text-[14px] text-[#C9922A] mb-3 flex items-center gap-2">
              <span>⚠️</span> Legal Compliance Notice
            </h3>
            <p className="text-[13px] text-[#8A8E99] leading-relaxed">
              All firearm transactions must comply with the Firearms Control Act (Act 60 of 2000).
              Buyer must possess a valid firearm licence for the appropriate category. Seller verification required.
            </p>
          </div>
        </div>

        {/* RIGHT: Details & Actions */}
        <aside className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-6">

          {/* Main Card */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8 flex flex-col gap-6">
            <div>
              <h1
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="font-extrabold text-3xl md:text-4xl uppercase text-[#F0EDE8] leading-tight mb-2"
              >
                {listing.title}
              </h1>
              <p className="text-[13px] text-[#8A8E99] flex items-center gap-2">
                📍 {listing.city}, {listing.provinces?.name || 'N/A'} • Listed{' '}
                {new Date(listing.created_at).toLocaleDateString()}
              </p>
            </div>

            <div
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="font-extrabold text-[40px] md:text-[48px] text-[#C9922A] leading-none"
            >
              R {listing.price.toLocaleString()}
              {listing.is_negotiable && (
                <span className="text-[18px] text-[#8A8E99] ml-2 font-bold">ONO</span>
              )}
            </div>

            <button
              onClick={handleContactSeller}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="w-full bg-[#C9922A] text-black font-bold text-[18px] tracking-[0.1em] uppercase py-4 rounded-[3px] hover:brightness-110 transition-all shadow-lg"
            >
              Contact Seller
            </button>

            <div className="flex items-center justify-center gap-4 text-[12px] font-bold tracking-widest uppercase text-[#8A8E99] border-t border-white/5 pt-6">
              <button className="hover:text-[#F0EDE8] transition-colors">⭐ Save</button>
              <span>|</span>
              <button onClick={handleShare} className="hover:text-[#F0EDE8] transition-colors">🔗 Share</button>
              <span>|</span>
              <button onClick={handleReport} className="hover:text-red-400 transition-colors text-red-500/70">🚩 Report</button>
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8">
            <h3
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8] border-b border-white/5 pb-3 mb-5"
            >
              {seller?.is_dealer ? 'Dealer Information' : 'Seller Information'}
            </h3>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-[#C9922A] flex items-center justify-center overflow-hidden">
                {seller?.logo_url ? (
                  <img src={seller.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="text-xl font-bold text-black"
                  >
                    {seller?.full_name?.charAt(0) || 'S'}
                  </span>
                )}
              </div>
              <div>
                <div className="font-bold text-[16px] text-[#F0EDE8]">
                  {seller?.full_name || 'Private Seller'}
                </div>
                <div className="text-[12px] text-[#8A8E99]">
                  {seller?.is_dealer ? 'Licensed Dealer' : 'Private Seller'}
                </div>
              </div>
            </div>

            {seller?.is_dealer && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#2A9C6E]/10 flex items-center justify-center text-[10px] border border-[#2A9C6E]/30 text-[#2A9C6E]">✓</span>
                  <span className="text-[13px] text-[#F0EDE8]">Verified Dealer</span>
                </div>
                {seller?.slug && (
                  <Link
                    href={`/dealers/${seller.slug}`}
                    className="text-[12px] text-[#C9922A] font-bold uppercase tracking-widest hover:brightness-125 transition-all"
                  >
                    View Dealer Storefront →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8">
            <h3
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8] border-b border-white/5 pb-3 mb-5"
            >
              Specifications
            </h3>

            <div className="flex flex-col gap-0">
              {[
                ['Make', listing.makes?.name || 'N/A'],
                ['Model', listing.model || 'N/A'],
                ['Calibre', listing.calibres?.name || 'N/A'],
                ['Condition', listing.conditions?.name || 'N/A'],
                ['Category', formatCategory(listing.category_id)],
                ['Action Type', listing.action_type || 'N/A'],
                ['Capacity', listing.capacity || 'N/A'],
                ['Barrel Length', listing.barrel_length || 'N/A'],
                ['Province', listing.provinces?.name || 'N/A'],
              ]
                .filter(([, val]) => val !== 'N/A')
                .map(([label, val], i, arr) => (
                  <div
                    key={label}
                    className={`flex justify-between py-3 ${i !== arr.length - 1 ? 'border-b border-white/5' : ''}`}
                  >
                    <span className="text-[13px] text-[#8A8E99]">{label}</span>
                    <span className="text-[13px] font-medium text-[#F0EDE8]">{val}</span>
                  </div>
                ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Similar Listings */}
      {similarListings.length > 0 && (
        <section className="max-w-[1280px] mx-auto w-full px-6 md:px-8 py-16">
          <h2
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="font-extrabold text-3xl md:text-4xl uppercase text-[#F0EDE8] mb-8"
          >
            Similar <span className="text-[#C9922A]">Listings</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarListings.map((item) => (
              <ListingCard
                key={item.id}
                id={item.id}
                title={item.title}
                make={item.makes?.name || 'Unknown'}
                calibre={item.calibres?.name || 'N/A'}
                price={item.price}
                province={item.provinces?.name || 'N/A'}
                condition={item.conditions?.name || 'N/A'}
                category={formatCategory(item.category_id)}
                listingType={item.listing_type}
                sellerName={item.city || 'Private'}
                images={item.images}
              />
            ))}
          </div>
        </section>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-8 max-w-md w-full">
            <h3
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="font-bold text-2xl uppercase text-[#F0EDE8] mb-4"
            >
              Contact Seller
            </h3>
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Hi, I'm interested in your listing..."
              className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-4 text-[14px] text-[#F0EDE8] placeholder-[#8A8E99] focus:outline-none focus:border-[#C9922A] min-h-[150px] mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={sendMessage}
                className="flex-1 bg-[#C9922A] text-black font-bold py-3 rounded-sm hover:brightness-110"
              >
                Send Message
              </button>
              <button
                onClick={() => setShowContactModal(false)}
                className="px-6 bg-transparent border border-white/20 text-[#F0EDE8] font-bold py-3 rounded-sm hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-8 max-w-md w-full">
            <h3
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="font-bold text-2xl uppercase text-[#F0EDE8] mb-4"
            >
              Report Listing
            </h3>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-4 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A] mb-4"
            >
              <option value="">Select a reason...</option>
              <option value="scam">Suspected scam</option>
              <option value="illegal">Illegal item</option>
              <option value="fake">Fake/counterfeit</option>
              <option value="duplicate">Duplicate listing</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={submitReport}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-sm hover:brightness-110"
              >
                Submit Report
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-6 bg-transparent border border-white/20 text-[#F0EDE8] font-bold py-3 rounded-sm hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}