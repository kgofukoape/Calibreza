'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

type Step = 'disclaimer' | 'budget' | 'discipline' | 'frame' | 'experience' | 'result';

interface Answers {
  budget:     string;
  discipline: string;
  frame:      string;
  experience: string;
}

const STEPS: Step[] = ['disclaimer', 'budget', 'discipline', 'frame', 'experience', 'result'];

const QUESTIONS = {
  budget: {
    title: 'What is your budget?',
    subtitle: 'For the platform only — budget R2,500–R4,500 separately for competency and CFR licensing.',
    options: [
      { value: '10000',  label: 'Up to R10,000',  desc: 'Entry-level platforms' },
      { value: '25000',  label: 'Up to R25,000',  desc: 'Mid-range proven options' },
      { value: '50000',  label: 'Up to R50,000',  desc: 'Premium configurations' },
      { value: '999999', label: 'No Limit',        desc: 'Show me the best available' },
    ],
  },
  discipline: {
    title: 'What is your primary purpose?',
    subtitle: 'This determines your FCA licensing section and platform type.',
    options: [
      { value: 'self_defense', label: 'Self Defence / EDC',     desc: 'Section 13 FCA — home protection, carry' },
      { value: 'sport',        label: 'Dedicated Sport Shooting', desc: 'Section 16 FCA — IDPA, IPSC competition' },
      { value: 'hunting',      label: 'Hunting',                  desc: 'Section 15/16 FCA — game, field use' },
      { value: 'collection',   label: 'Collection',               desc: 'Section 17 FCA — dedicated collecting' },
    ],
  },
  frame: {
    title: 'What frame profile suits you?',
    subtitle: 'Test before you buy — visit an accredited range to feel the difference.',
    options: [
      { value: 'subcompact', label: 'Subcompact',     desc: 'Maximum concealment, reduced grip' },
      { value: 'compact',    label: 'Compact',         desc: 'Balanced — most versatile choice' },
      { value: 'fullsize',   label: 'Full Size',       desc: 'Maximum control and capacity' },
      { value: 'any',        label: 'No Preference',   desc: 'Show me all options' },
    ],
  },
  experience: {
    title: 'What is your experience level?',
    subtitle: 'Helps us recommend the right action type and trigger characteristics.',
    options: [
      { value: 'first_time',   label: 'First Time Owner',  desc: 'Pre-competency certificate stage' },
      { value: 'beginner',     label: 'Beginner',           desc: 'Some range experience' },
      { value: 'intermediate', label: 'Intermediate',       desc: 'Current licence holder' },
      { value: 'advanced',     label: 'Advanced',           desc: 'Competitive / experienced operator' },
    ],
  },
};

function getCategorySlug(discipline: string): string[] {
  switch (discipline) {
    case 'self_defense': return ['pistols', 'revolvers'];
    case 'sport':        return ['pistols', 'revolvers', 'shotguns'];
    case 'hunting':      return ['bolt-action', 'semi-auto-rifles', 'lever-action', 'rifles'];
    case 'collection':   return ['pistols', 'revolvers', 'bolt-action', 'rifles'];
    default:             return ['pistols', 'revolvers'];
  }
}

function useTypingEffect(text: string, speed = 10) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone]           = useState(false);
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else { setDone(true); clearInterval(timer); }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return { displayed, done };
}

// Fallback template if API fails
function generateFallback(answers: Answers): string {
  const sectionMap: Record<string, string> = {
    self_defense: 'Section 13 of the FCA',
    sport:        'Section 16 of the FCA',
    hunting:      'Section 15 or Section 16 of the FCA',
    collection:   'Section 17 of the FCA',
  };
  return `Your licensing pathway falls under ${sectionMap[answers.discipline] || 'the FCA'}. Your first step — before any platform selection — is completing a SAPS-accredited Competency Certificate. This covers FCA regulatory knowledge, lawful storage, and live-fire proficiency. Once passed, your CFR application can be submitted. Processing typically runs 90 to 180 days.

Visit the Gun X Services Directory at /services to connect with a professional Motivation Writer who can prepare your CFR application portfolio. A well-prepared motivation significantly improves approval rates. Before spending your budget, visit an accredited range in the Clubs & Ranges directory at /clubs to physically test grip profiles and trigger characteristics on platforms matching your stated frame preference.

All firearm storage must comply with Section 86 of the FCA. An approved SANS 1522 safe must be installed before your licence is issued — Class A for handguns, Class B for long arms. Budget this into your total cost of ownership.

This advisory is informational only and does not constitute legal advice. Consult a SAPS-accredited dealer and qualified legal professional before any acquisition decision.`;
}

export default function AdvisorPage() {
  const [step, setStep]           = useState<Step>('disclaimer');
  const [answers, setAnswers]     = useState<Answers>({ budget: '', discipline: '', frame: '', experience: '' });
  const [listings, setListings]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [advisory, setAdvisory]   = useState('');
  const [disclaimerAck, setDisclaimerAck] = useState(false);
  const resultRef                 = useRef<HTMLDivElement>(null);

  const { displayed, done } = useTypingEffect(advisory, 8);

  const stepIndex = STEPS.indexOf(step);
  const questionSteps = STEPS.filter(s => s !== 'disclaimer' && s !== 'result');
  const questionIndex = questionSteps.indexOf(step as any);
  const progress = step === 'result' ? 100 : step === 'disclaimer' ? 0 : Math.round(((questionIndex + 1) / questionSteps.length) * 100);

  const handleAnswer = (key: keyof Answers, value: string) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    const keys = Object.keys(QUESTIONS) as (keyof Answers)[];
    const currentIdx = keys.indexOf(key);
    if (currentIdx < keys.length - 1) {
      setStep(keys[currentIdx + 1] as Step);
    } else {
      runAnalysis(updated);
    }
  };

  const runAnalysis = async (a: Answers) => {
    setStep('result');
    setLoading(true);
    setAdvisory('');
    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(a),
      });
      const data = await res.json();
      console.log('Advisor API response:', data);
      if (data.advisory) {
        setAdvisory(data.advisory);
      } else {
        console.error('No advisory in response:', data);
        setAdvisory(generateFallback(a));
      }
    } catch (err) {
      console.error('Advisor fetch error:', err);
      setAdvisory(generateFallback(a));
    }

    // Fetch matched listings
    try {
      const categories = getCategorySlug(a.discipline);
      const maxPrice   = parseInt(a.budget);
      const { data: primary } = await supabase
        .from('listings')
        .select('id, title, price, category_id, images, city, listing_type, is_featured, views_count, is_negotiable, created_at')
        .eq('status', 'active')
        .in('category_id', categories)
        .lte('price', maxPrice)
        .order('is_featured', { ascending: false })
        .order('views_count', { ascending: false })
        .limit(12);

      if (!primary || primary.length === 0) {
        const { data: fallback } = await supabase
          .from('listings')
          .select('id, title, price, category_id, images, city, listing_type, is_featured, views_count, is_negotiable, created_at')
          .eq('status', 'active')
          .in('category_id', categories)
          .order('is_featured', { ascending: false })
          .limit(8);
        setListings(fallback || []);
      } else {
        setListings(primary);
      }
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const restart = () => {
    setStep('disclaimer');
    setDisclaimerAck(false);
    setAnswers({ budget: '', discipline: '', frame: '', experience: '' });
    setListings([]);
    setAdvisory('');
  };

  const formatCategory = (cat: string) =>
    cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

  const currentQuestion = step !== 'result' && step !== 'disclaimer'
    ? QUESTIONS[step as keyof typeof QUESTIONS]
    : null;
  const currentKey = step !== 'result' && step !== 'disclaimer'
    ? step as keyof Answers
    : null;

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#C9922A] animate-pulse" />
            <p className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.4em]">Gun X</p>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none mb-4">
            Firearm <span className="text-[#C9922A]">Match</span> Advisor
          </h1>
          <p className="text-[#8A8E99] text-sm md:text-base leading-relaxed max-w-xl">
            Answer four questions. Our advisor analyses your profile against South African law and surfaces active listings from the vault that match your discipline, budget, and experience level.
          </p>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="w-full h-1 bg-[#191C23]">
        <div className="h-full bg-[#C9922A] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <main className="flex-1 max-w-[800px] mx-auto w-full px-4 md:px-6 py-10 md:py-16">

        {/* ── STEP 0: DISCLAIMER ───────────────────────────────────────── */}
        {step === 'disclaimer' && (
          <div className="animate-fadeIn">
            <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-6 md:p-8 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-red-400 text-xl flex-shrink-0 mt-0.5">⚠️</span>
                <div>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="text-red-400 font-black text-[16px] uppercase tracking-widest mb-2">
                    Important Legal Disclaimer
                  </p>
                  <p className="text-[#8A8E99] text-[13px] leading-relaxed mb-3">
                    This advisory tool is provided for <strong className="text-[#F0EDE8]">general informational purposes only</strong> and does not constitute legal advice, ballistic advice, or a recommendation to purchase any specific firearm.
                  </p>
                  <p className="text-[#8A8E99] text-[13px] leading-relaxed mb-3">
                    All firearm acquisitions in South Africa are governed by the <strong className="text-[#F0EDE8]">Firearms Control Act 60 of 2000 (FCA)</strong>. A valid licence for the correct FCA section must be obtained <strong className="text-[#F0EDE8]">before</strong> any purchase. All transfers must be completed through a SAPS-licensed dealer.
                  </p>
                  <p className="text-[#8A8E99] text-[13px] leading-relaxed mb-3">
                    Always consult a <strong className="text-[#F0EDE8]">SAPS-accredited dealer</strong> and a <strong className="text-[#F0EDE8]">qualified legal professional</strong> before making any firearm acquisition decision.
                  </p>
                  <p className="text-[#8A8E99] text-[13px] leading-relaxed">
                    <strong className="text-red-400">GX SA (Pty) Ltd accepts no liability</strong> for decisions made based on this advisory. Firearm ownership is a serious legal responsibility.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-4 border-t border-red-500/20">
                <input
                  type="checkbox"
                  id="ack"
                  checked={disclaimerAck}
                  onChange={e => setDisclaimerAck(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-red-500 flex-shrink-0 cursor-pointer"
                />
                <label htmlFor="ack" className="text-[13px] text-[#F0EDE8] cursor-pointer leading-relaxed">
                  I understand this advisory is informational only. I will consult a SAPS-accredited dealer and legal professional before any firearm acquisition.
                </label>
              </div>
            </div>

            <button
              onClick={() => { if (disclaimerAck) setStep('budget'); }}
              disabled={!disclaimerAck}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className={`w-full py-4 font-black uppercase tracking-widest text-[15px] rounded-sm transition-all ${
                disclaimerAck
                  ? 'bg-[#C9922A] text-black hover:brightness-110 cursor-pointer'
                  : 'bg-white/5 text-[#8A8E99] cursor-not-allowed'
              }`}>
              {disclaimerAck ? 'I Understand — Begin Assessment →' : 'Please acknowledge the disclaimer above'}
            </button>
          </div>
        )}

        {/* ── STEP INDICATOR ───────────────────────────────────────────── */}
        {step !== 'result' && step !== 'disclaimer' && (
          <div className="flex items-center gap-2 mb-8">
            {questionSteps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-black transition-all ${
                  s === step ? 'bg-[#C9922A] text-black' :
                  questionIndex > i ? 'bg-[#C9922A]/30 text-[#C9922A]' :
                  'bg-[#191C23] border border-white/10 text-[#8A8E99]'
                }`}>{i + 1}</div>
                {i < questionSteps.length - 1 && (
                  <div className={`w-8 h-px transition-all ${questionIndex > i ? 'bg-[#C9922A]/50' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── QUESTION CARD ─────────────────────────────────────────────── */}
        {currentQuestion && currentKey && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
                {currentQuestion.title}
              </h2>
              <p className="text-[#8A8E99] text-[14px]">{currentQuestion.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map(opt => (
                <button key={opt.value}
                  onClick={() => handleAnswer(currentKey, opt.value)}
                  className="group bg-[#13151A] border border-white/5 rounded-sm p-5 text-left hover:border-[#C9922A]/40 hover:bg-[#C9922A]/5 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="font-black text-[16px] uppercase tracking-wide text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors leading-tight">
                      {opt.label}
                    </p>
                    <span className="text-[#8A8E99] group-hover:text-[#C9922A] transition-colors text-lg flex-shrink-0 mt-0.5">→</span>
                  </div>
                  <p className="text-[#8A8E99] text-[12px]">{opt.desc}</p>
                </button>
              ))}
            </div>
            {stepIndex > 1 && (
              <button
                onClick={() => setStep(STEPS[stepIndex - 1])}
                className="mt-6 text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#F0EDE8] transition-colors">
                ← Back
              </button>
            )}
          </div>
        )}

        {/* ── RESULTS ───────────────────────────────────────────────────── */}
        {step === 'result' && (
          <div ref={resultRef} className="space-y-8">

            {/* SUMMARY PILLS */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Budget',     value: answers.budget === '999999' ? 'No Limit' : `R${parseInt(answers.budget).toLocaleString()}` },
                { label: 'Discipline', value: answers.discipline.replace('_', ' ') },
                { label: 'Frame',      value: answers.frame },
                { label: 'Level',      value: answers.experience.replace('_', ' ') },
              ].map(pill => (
                <div key={pill.label} className="bg-[#191C23] border border-[#C9922A]/20 rounded-sm px-3 py-1.5 flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#8A8E99]">{pill.label}</span>
                  <span className="text-[11px] font-black uppercase text-[#C9922A]">{pill.value}</span>
                </div>
              ))}
              <button onClick={restart}
                className="bg-[#191C23] border border-white/10 rounded-sm px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#F0EDE8] transition-all">
                ↺ Restart
              </button>
            </div>

            {/* ADVISORY BLOCK */}
            <div className="bg-[#191C23] border border-[#C9922A]/20 rounded-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#C9922A] animate-pulse" />
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-[11px] font-black uppercase tracking-[0.4em] text-[#C9922A]">
                  Match Advisor — Assessment
                </p>
                {!done && <div className="w-3 h-3 border border-[#C9922A] border-t-transparent rounded-full animate-spin" />}
              </div>
              <pre className="text-[13px] text-[#8A8E99] leading-relaxed whitespace-pre-wrap font-mono">
                {displayed}
                {!done && <span className="inline-block w-2 h-4 bg-[#C9922A] animate-pulse ml-0.5 align-middle" />}
              </pre>
            </div>

            {/* ECOSYSTEM CTA BUTTONS — drives traffic to monetised directories */}
            {done && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/services?search=motivation+writer"
                  className="group bg-[#13151A] border border-white/5 rounded-sm p-4 hover:border-[#C9922A]/40 transition-all flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">📝</span>
                  <div>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="font-black text-[14px] uppercase text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">
                      Find a Motivation Writer
                    </p>
                    <p className="text-[11px] text-[#8A8E99]">Professional CFR application preparation</p>
                  </div>
                  <span className="text-[#8A8E99] group-hover:text-[#C9922A] transition-colors ml-auto">→</span>
                </Link>

                <Link href="/clubs"
                  className="group bg-[#13151A] border border-white/5 rounded-sm p-4 hover:border-[#C9922A]/40 transition-all flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">🎯</span>
                  <div>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="font-black text-[14px] uppercase text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">
                      Find a Range Near You
                    </p>
                    <p className="text-[11px] text-[#8A8E99]">Test-fire before you buy</p>
                  </div>
                  <span className="text-[#8A8E99] group-hover:text-[#C9922A] transition-colors ml-auto">→</span>
                </Link>
              </div>
            )}

            {/* MATCHED LISTINGS */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-2xl font-black uppercase">
                  {loading
                    ? 'Scanning Vault...'
                    : listings.length > 0
                    ? `${listings.length} Matched Listing${listings.length !== 1 ? 's' : ''}`
                    : 'No Exact Match — Top Alternatives'}
                </h2>
                {!loading && listings.length > 0 && (
                  <Link href="/browse" className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125">
                    Browse All →
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-[#191C23] border border-white/5 rounded-sm overflow-hidden animate-pulse">
                      <div className="h-40 bg-[#13151A]" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 bg-white/5 rounded w-3/4" />
                        <div className="h-4 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="bg-[#191C23] border border-white/5 rounded-sm p-10 text-center">
                  <div className="text-4xl mb-4 opacity-30">🔍</div>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="text-xl font-black uppercase mb-2">No Exact Configuration in Vault</p>
                  <p className="text-[#8A8E99] text-sm mb-6">Showing top-rated alternative platforms currently available.</p>
                  <Link href="/browse"
                    className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
                    Browse Full Inventory
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listings.map(listing => {
                    const image = listing.images?.[0];
                    return (
                      <Link key={listing.id} href={`/listings/${listing.id}`}
                        className="group bg-[#191C23] border border-white/5 rounded-sm overflow-hidden hover:border-[#C9922A]/40 transition-all">
                        <div className="relative h-44 bg-[#13151A] overflow-hidden">
                          {image
                            ? <img src={image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            : <div className="w-full h-full flex items-center justify-center text-4xl opacity-10">🔫</div>}
                          {listing.is_featured && (
                            <div className="absolute top-2 left-2 bg-[#C9922A] text-black text-[8px] font-black px-2 py-0.5 rounded-sm uppercase">⭐ Featured</div>
                          )}
                          <div className="absolute top-2 right-2 bg-black/70 text-[#8A8E99] text-[9px] font-black px-2 py-0.5 rounded-sm uppercase">
                            {formatCategory(listing.category_id)}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-black text-[13px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate mb-1">
                            {listing.title}
                          </h3>
                          <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                            className="text-xl font-black text-[#C9922A] mb-2">
                            R {listing.price?.toLocaleString('en-ZA')}
                            {listing.is_negotiable && <span className="text-[11px] text-[#8A8E99] ml-1 font-bold">ONO</span>}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#8A8E99]">
                            <span>📍 {listing.city || 'N/A'}</span>
                            <span>👁 {listing.views_count || 0} views</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LEGAL DISCLAIMER — bottom */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-sm p-5">
              <p className="text-red-400 font-black text-[12px] uppercase tracking-widest mb-2">⚠️ Legal Disclaimer</p>
              <p className="text-[#8A8E99] text-[13px] leading-relaxed">
                This advisory is informational only and does not constitute legal or ballistic advice. All acquisitions must comply with the Firearms Control Act 60 of 2000. A valid licence for the correct FCA section must be obtained before purchase. All transfers must be completed through a SAPS-licensed dealer. GX SA (Pty) Ltd accepts no liability for decisions made based on this advisory.
              </p>
            </div>

            {/* BOTTOM CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/dealers"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] py-3 rounded-sm hover:brightness-110 transition-all text-center">
                Find a Licensed Dealer
              </Link>
              <Link href="/firearm-ownership"
                className="border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] py-3 rounded-sm hover:bg-white/5 transition-all text-center">
                FA Ownership Guide
              </Link>
              <button onClick={restart}
                className="border border-[#C9922A]/30 text-[#C9922A] font-black uppercase tracking-widest text-[12px] py-3 rounded-sm hover:bg-[#C9922A]/10 transition-all">
                ↺ New Assessment
              </button>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
      `}</style>
    </div>
  );
}
