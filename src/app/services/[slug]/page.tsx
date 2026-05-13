'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

const CAT_BADGE: Record<string, string> = {
  legal:     'text-[#F59E0B] border-[#F59E0B]/20 bg-[#F59E0B]/5',
  gunsmith:  'text-[#C9922A] border-[#C9922A]/20 bg-[#C9922A]/5',
  training:  'text-[#4CC9F0] border-[#4CC9F0]/20 bg-[#4CC9F0]/5',
  logistics: 'text-[#8B5CF6] border-[#8B5CF6]/20 bg-[#8B5CF6]/5',
  hunting:   'text-[#10B981] border-[#10B981]/20 bg-[#10B981]/5',
  range:     'text-[#2A9C6E] border-[#2A9C6E]/20 bg-[#2A9C6E]/5',
  other:     'text-[#8A8E99] border-white/10 bg-white/5',
};

const CAT_LABEL: Record<string, string> = {
  legal:     '⚖️ Legal & Licensing',
  gunsmith:  '🔧 Gunsmithing',
  training:  '🎯 Training',
  logistics: '🔒 Logistics & Storage',
  hunting:   '🌿 Hunting & Field',
  range:     '🎯 Shooting Range',
  other:     '📋 Other',
};

const inp = 'w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50 transition-colors';

export default function ServiceProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [service, setService]       = useState<any>(null);
  const [packages, setPackages]     = useState<any[]>([]);
  const [portfolio, setPortfolio]   = useState<any[]>([]);
  const [reviews, setReviews]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('packages');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [reviewForm, setReviewForm] = useState({
    reviewer_name: '', reviewer_email: '', rating: 5, review_text: '',
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => { fetchAll(); }, [slug]);

  const fetchAll = async () => {
    const { data: svc } = await supabase
      .from('services')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .maybeSingle();

    if (!svc) { setLoading(false); return; }
    setService(svc);

    const [pkgRes, portRes, revRes] = await Promise.all([
      supabase.from('service_packages').select('*').eq('service_id', svc.id).eq('is_active', true).order('sort_order'),
      supabase.from('service_portfolio').select('*').eq('service_id', svc.id).order('sort_order'),
      supabase.from('service_reviews').select('*').eq('service_id', svc.id).eq('is_approved', true).order('created_at', { ascending: false }),
    ]);

    setPackages(pkgRes.data || []);
    setPortfolio(portRes.data || []);
    setReviews(revRes.data || []);

    // Default to first populated tab
    if ((pkgRes.data || []).length === 0 && (portRes.data || []).length > 0) {
      setActiveTab('portfolio');
    } else if ((pkgRes.data || []).length === 0) {
      setActiveTab('reviews');
    }

    setLoading(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.reviewer_name.trim() || !reviewForm.review_text.trim()) return;
    setReviewSubmitting(true);
    const { error } = await supabase.from('service_reviews').insert({
      service_id:     service.id,
      reviewer_name:  reviewForm.reviewer_name,
      reviewer_email: reviewForm.reviewer_email || null,
      rating:         reviewForm.rating,
      review_text:    reviewForm.review_text,
      is_approved:    false,
    });
    setReviewSubmitting(false);
    if (!error) setReviewDone(true);
  };

  const waLink = (num: string, msg?: string) => {
    const clean = '27' + num.replace(/^0/, '').replace(/\s/g, '');
    return `https://wa.me/${clean}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0D0F13] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!service) return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <div className="text-5xl">⊕</div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase">Service Not Found</h1>
        <Link href="/services" className="text-[#C9922A] font-bold uppercase tracking-widest text-sm">← Back to Services</Link>
      </div>
    </div>
  );

  const badgeClass = CAT_BADGE[service.type] || CAT_BADGE.other;
  const catLabel   = CAT_LABEL[service.type]  || service.type;

  const tabs = [
    ...(packages.length  > 0 ? [{ id: 'packages',  label: `Packages (${packages.length})`   }] : [{ id: 'packages', label: 'Packages' }]),
    ...(portfolio.length > 0 ? [{ id: 'portfolio', label: `Portfolio (${portfolio.length})` }] : []),
    { id: 'reviews', label: `Reviews${reviews.length > 0 ? ` (${reviews.length})` : ''}` },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* TOP AD */}
      <div className="w-full flex justify-center pt-3 pb-2 px-4">
        <div className="w-full max-w-[970px] h-[70px] md:h-[90px] bg-[#12141a] border border-white/5 flex items-center justify-center relative rounded-sm">
          <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">Advertisement — 970 × 90</span>
          <div className="absolute inset-0 border border-dashed border-white/10 opacity-20 rounded-sm" />
        </div>
      </div>

      {/* COVER + HERO IDENTITY */}
      <div className="relative bg-[#12141a] overflow-hidden" style={{ height: '240px' }}>
        {service.cover_url
          ? <img src={service.cover_url} alt="" className="w-full h-full object-cover opacity-60" />
          : <div className="w-full h-full bg-gradient-to-br from-[#191C23] via-[#13151A] to-[#0D0F13]" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F13] via-[#0D0F13]/50 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full pb-5">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-end gap-4">

            {/* Logo */}
            <div
              className="w-20 h-20 md:w-24 md:h-24 rounded-sm border-4 border-[#0D0F13] flex-shrink-0 overflow-hidden shadow-2xl flex items-center justify-center"
              style={{ background: service.logo_url ? 'transparent' : '#C9922A' }}
            >
              {service.logo_url
                ? <img src={service.logo_url} alt="" className="w-full h-full object-cover" />
                : <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-black font-black text-3xl">
                    {service.name?.charAt(0)}
                  </span>
              }
            </div>

            {/* Name + badges */}
            <div className="flex-1 pb-1">
              <div className="flex items-center flex-wrap gap-2 mb-1.5">
                <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
                  {service.name}
                </h1>
                {service.is_verified    && <span className="bg-[#2A9C6E] text-white text-[10px] font-black px-2.5 py-1 rounded-sm uppercase">✓ Verified</span>}
                {service.saps_accredited && <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-sm uppercase">🛡 SAPS Accredited</span>}
                {service.is_featured    && <span className="bg-[#C9922A] text-black text-[10px] font-black px-2.5 py-1 rounded-sm uppercase">⭐ Featured</span>}
              </div>
              <div className="flex items-center flex-wrap gap-3 text-[12px] text-[#8A8E99] font-bold uppercase tracking-widest">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm border ${badgeClass}`}>{catLabel}</span>
                <span>📍 {service.city}{service.province ? `, ${service.province}` : ''}</span>
                {service.years_experience && <span>🕐 {service.years_experience} yrs</span>}
                {avgRating && <span className="text-[#C9922A]">★ {avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-2 pb-1 flex-shrink-0">
              {service.phone && (
                <a href={`tel:${service.phone}`}
                  className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:brightness-110 transition-all">
                  📞 Call
                </a>
              )}
              {service.whatsapp && (
                <a href={waLink(service.whatsapp)} target="_blank" rel="noopener noreferrer"
                  className="bg-[#25D366] text-white font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:brightness-110 transition-all">
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STICKY TABS */}
      <div className="bg-[#0D0F13] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="flex gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className={`py-4 text-[13px] font-black uppercase tracking-widest border-b-2 whitespace-nowrap flex-shrink-0 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#C9922A] text-[#C9922A]'
                    : 'border-transparent text-[#8A8E99] hover:text-white'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full px-4 md:px-8 py-8">
        <div className="flex gap-8 items-start">

          {/* PRIMARY COLUMN */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* About — always visible */}
            {service.description && (
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-xl font-black uppercase mb-3 text-[#C9922A]">About</h2>
                <p className="text-[#8A8E99] leading-relaxed text-[14px] whitespace-pre-wrap">{service.description}</p>
                {service.specializations?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {service.specializations.map((s: string) => (
                      <span key={s} className="bg-[#0D0F13] border border-white/10 text-[#8A8E99] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── PACKAGES ── */}
            {activeTab === 'packages' && (
              packages.length === 0 ? (
                <div className="bg-[#13151A] border border-white/5 rounded-sm p-12 text-center">
                  <div className="text-5xl mb-3 opacity-20">📋</div>
                  <p className="text-[#8A8E99] text-sm font-bold">No packages listed yet — contact directly for pricing.</p>
                  {service.phone && (
                    <a href={`tel:${service.phone}`}
                      className="inline-block mt-5 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-2.5 rounded-sm hover:brightness-110 transition-all">
                      📞 Call Now
                    </a>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packages.map(pkg => (
                    <div key={pkg.id}
                      className="bg-[#13151A] border border-white/5 hover:border-[#C9922A]/20 rounded-sm p-5 flex flex-col gap-3 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                          className="text-xl font-black uppercase leading-tight">
                          {pkg.name}
                        </h3>
                        {pkg.price != null && (
                          <div className="text-right flex-shrink-0">
                            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                              className="text-2xl font-black text-[#C9922A] leading-none">
                              R{Number(pkg.price).toLocaleString()}
                            </p>
                            {pkg.duration && (
                              <p className="text-[10px] text-[#8A8E99] uppercase tracking-widest mt-0.5">{pkg.duration}</p>
                            )}
                          </div>
                        )}
                      </div>
                      {pkg.description && (
                        <p className="text-[13px] text-[#8A8E99] leading-relaxed flex-1">{pkg.description}</p>
                      )}
                      {service.whatsapp && (
                        <a href={waLink(service.whatsapp, `Hi, I'm interested in your "${pkg.name}" package`)}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] font-black uppercase tracking-widest text-[11px] px-4 py-2 rounded-sm hover:bg-[#25D366]/20 transition-all self-start">
                          WhatsApp Enquiry →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── PORTFOLIO ── */}
            {activeTab === 'portfolio' && (
              portfolio.length === 0 ? (
                <div className="bg-[#13151A] border border-white/5 rounded-sm p-12 text-center">
                  <p className="text-[#8A8E99] text-sm font-bold">No portfolio images uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {portfolio.map(item => (
                    <button key={item.id} onClick={() => setLightboxUrl(item.image_url)}
                      className="relative aspect-square overflow-hidden rounded-sm border border-white/5 hover:border-[#C9922A]/30 transition-all group">
                      <img src={item.image_url} alt={item.caption || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {item.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                          <p className="text-[11px] font-bold text-white text-left">{item.caption}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )
            )}

            {/* ── REVIEWS ── */}
            {activeTab === 'reviews' && (
              <div className="flex flex-col gap-5">

                {/* Rating summary */}
                {reviews.length > 0 && (
                  <div className="bg-[#13151A] border border-white/5 rounded-sm p-5 flex items-center gap-6">
                    <div className="text-center flex-shrink-0">
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        className="text-5xl font-black text-[#C9922A] leading-none">{avgRating}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mt-1">
                        {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = reviews.filter(r => r.rating === star).length;
                        const pct   = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-[11px] text-[#8A8E99] w-3 text-right">{star}</span>
                            <span className="text-[#C9922A] text-[10px]">★</span>
                            <div className="flex-1 bg-white/5 rounded-full h-1.5">
                              <div className="bg-[#C9922A] h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-[#8A8E99] w-4">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Review cards */}
                {reviews.map(review => (
                  <div key={review.id} className="bg-[#13151A] border border-white/5 rounded-sm p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-black text-[13px]">{review.reviewer_name}</p>
                        <p className="text-[10px] text-[#8A8E99]">
                          {new Date(review.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} className={`text-sm ${s <= review.rating ? 'text-[#C9922A]' : 'text-white/10'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[#8A8E99] text-[13px] leading-relaxed">{review.review_text}</p>
                  </div>
                ))}

                {/* Submit a review */}
                <div className="bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-6">
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="text-xl font-black uppercase mb-5">
                    Leave a <span className="text-[#C9922A]">Review</span>
                  </h3>
                  {reviewDone ? (
                    <p className="text-[#2A9C6E] font-bold text-sm">
                      ✅ Review submitted — pending moderation. Thank you!
                    </p>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Your Name *</label>
                          <input required value={reviewForm.reviewer_name}
                            onChange={e => setReviewForm(p => ({ ...p, reviewer_name: e.target.value }))}
                            className={inp} placeholder="Anonymous" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Email (optional)</label>
                          <input type="email" value={reviewForm.reviewer_email}
                            onChange={e => setReviewForm(p => ({ ...p, reviewer_email: e.target.value }))}
                            className={inp} placeholder="Not shown publicly" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Rating *</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} type="button"
                              onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                              className={`text-3xl transition-all ${star <= reviewForm.rating ? 'text-[#C9922A]' : 'text-white/15 hover:text-[#C9922A]/40'}`}>
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Review *</label>
                        <textarea required rows={3} value={reviewForm.review_text}
                          onChange={e => setReviewForm(p => ({ ...p, review_text: e.target.value }))}
                          className={`${inp} resize-none`} placeholder="Share your experience with this provider..." />
                      </div>
                      <button type="submit" disabled={reviewSubmitting}
                        className="self-start bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-2.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                        {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* ── CONTACT ── */}
            {activeTab === 'contact' && (
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-2xl font-black uppercase mb-6 text-[#C9922A]">Contact Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.contact_name && (
                    <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Contact Person</p>
                      <p className="font-bold">{service.contact_name}</p>
                    </div>
                  )}
                  {service.phone && (
                    <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Phone</p>
                      <a href={`tel:${service.phone}`} className="font-bold text-[#C9922A] hover:brightness-125">{service.phone}</a>
                    </div>
                  )}
                  {service.email && (
                    <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Email</p>
                      <a href={`mailto:${service.email}`} className="font-bold hover:text-[#C9922A] transition-colors break-all">{service.email}</a>
                    </div>
                  )}
                  {service.whatsapp && (
                    <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">WhatsApp</p>
                      <a href={waLink(service.whatsapp)} target="_blank" rel="noopener noreferrer"
                        className="font-bold text-[#25D366] hover:brightness-125">{service.whatsapp}</a>
                    </div>
                  )}
                  {service.address && (
                    <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-4 md:col-span-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Address</p>
                      <p className="font-bold">{service.address}</p>
                      <p className="text-[#8A8E99] text-sm">{service.city}{service.province ? `, ${service.province}` : ''}</p>
                    </div>
                  )}
                  {service.website && (
                    <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Website</p>
                      <a href={service.website} target="_blank" rel="noopener noreferrer"
                        className="font-bold text-[#C9922A] hover:brightness-125 truncate block">{service.website}</a>
                    </div>
                  )}
                  {service.service_area_note && (
                    <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Service Area</p>
                      <p className="font-bold">{service.service_area_note}</p>
                    </div>
                  )}
                  {service.accreditation_number && (
                    <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Accreditation No.</p>
                      <p className="font-bold font-mono text-sm">{service.accreditation_number}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* STICKY SIDEBAR */}
          <aside className="hidden lg:flex flex-col gap-3 w-[250px] flex-shrink-0">
            <div className="sticky top-[57px] flex flex-col gap-3">

              {/* CTA card */}
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-lg font-black uppercase mb-4">
                  Get in <span className="text-[#C9922A]">Touch</span>
                </h3>
                <div className="flex flex-col gap-2">
                  {service.phone && (
                    <a href={`tel:${service.phone}`}
                      className="flex items-center justify-center gap-2 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-4 py-3 rounded-sm hover:brightness-110 transition-all">
                      📞 Call {service.contact_name?.split(' ')[0] || 'Now'}
                    </a>
                  )}
                  {service.whatsapp && (
                    <a href={waLink(service.whatsapp)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] font-black uppercase tracking-widest text-[12px] px-4 py-3 rounded-sm hover:bg-[#25D366]/20 transition-all">
                      WhatsApp
                    </a>
                  )}
                  {service.email && (
                    <a href={`mailto:${service.email}`}
                      className="flex items-center justify-center gap-2 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-4 py-3 rounded-sm hover:bg-white/5 transition-all">
                      ✉ Email
                    </a>
                  )}
                </div>
              </div>

              {/* Stats card */}
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-5 space-y-3">
                {service.years_experience && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Experience</p>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black">{service.years_experience} Years</p>
                  </div>
                )}
                {avgRating && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Avg Rating</p>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black text-[#C9922A]">★ {avgRating}</p>
                  </div>
                )}
                {packages.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Packages</p>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black">{packages.length}</p>
                  </div>
                )}
                {portfolio.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Portfolio Photos</p>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black">{portfolio.length}</p>
                  </div>
                )}
              </div>

              <Link href="/services"
                className="block text-center text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#F0EDE8] transition-colors py-1">
                ← All Services
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/92 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt=""
            className="max-w-full max-h-full object-contain rounded-sm shadow-2xl"
            onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white font-black text-xl transition-all">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
