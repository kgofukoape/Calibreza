'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 'budget' | 'discipline' | 'frame' | 'experience' | 'result';

interface Answers {
  budget:     string;
  discipline: string;
  frame:      string;
  experience: string;
}

const STEPS: Step[] = ['budget', 'discipline', 'frame', 'experience', 'result'];

const QUESTIONS = {
  budget: {
    title: 'What is your budget?',
    subtitle: 'We\'ll match you to listings within your range.',
    options: [
      { value: '10000',  label: 'Up to R10,000',  desc: 'Entry-level platforms' },
      { value: '25000',  label: 'Up to R25,000',  desc: 'Mid-range proven options' },
      { value: '50000',  label: 'Up to R50,000',  desc: 'Premium configurations' },
      { value: '999999', label: 'No Limit',        desc: 'Show me the best' },
    ],
  },
  discipline: {
    title: 'What is your primary purpose?',
    subtitle: 'This determines the platform type that suits your lifestyle.',
    options: [
      { value: 'self_defense', label: 'Self Defence / EDC',    desc: 'Concealed carry, home protection' },
      { value: 'sport',        label: 'Sport Shooting',         desc: 'IDPA, IPSC, practical shooting' },
      { value: 'hunting',      label: 'Hunting',                desc: 'Game, small calibre, long range' },
      { value: 'collection',   label: 'Collection / Investment', desc: 'Historical, limited editions' },
    ],
  },
  frame: {
    title: 'What size platform suits you?',
    subtitle: 'Frame size affects concealability, capacity, and control.',
    options: [
      { value: 'subcompact', label: 'Subcompact',  desc: 'Lightest, most concealable' },
      { value: 'compact',    label: 'Compact',     desc: 'Balance of size and capacity' },
      { value: 'fullsize',   label: 'Full Size',   desc: 'Maximum control and capacity' },
      { value: 'any',        label: 'No Preference', desc: 'Show me all options' },
    ],
  },
  experience: {
    title: 'What is your experience level?',
    subtitle: 'Helps us recommend the right ergonomics and action type.',
    options: [
      { value: 'first_time', label: 'First Time Owner', desc: 'Never owned a firearm' },
      { value: 'beginner',   label: 'Beginner',          desc: 'Some range experience' },
      { value: 'intermediate', label: 'Intermediate',    desc: 'Regular shooter' },
      { value: 'advanced',   label: 'Advanced',          desc: 'Experienced, competitive' },
    ],
  },
};

// ── AI Response Generator ─────────────────────────────────────────────────────
function generateAdvisory(answers: Answers): string {
  const disciplineMap: Record<string, string> = {
    self_defense: 'self-defence and everyday carry',
    sport:        'sport shooting and competition',
    hunting:      'hunting and field use',
    collection:   'collection and investment',
  };

  const frameMap: Record<string, string> = {
    subcompact: 'subcompact platforms offer maximum concealability with reduced capacity — ideal for daily carry under clothing',
    compact:    'compact platforms strike the optimal balance between concealability and magazine capacity — the most versatile choice for most shooters',
    fullsize:   'full-size platforms deliver maximum barrel length, sight radius, and capacity — preferred for range use and home defence',
    any:        'we have selected a range of frame sizes to give you the broadest options across the market',
  };

  const experienceMap: Record<string, string> = {
    first_time:   'As a first-time owner, we strongly recommend a striker-fired platform with consistent trigger pull and no manual safety to master — reducing mechanical complexity while you build fundamentals.',
    beginner:     'With some range experience, you are ready to explore both striker-fired and traditional DA/SA platforms. Focus on ergonomics that feel natural in your grip.',
    intermediate: 'At your experience level, action type preference is personal. Consider a platform you can grow with — one that supports aftermarket upgrades and holster availability.',
    advanced:     'As an experienced shooter, the platform details matter less than the specific configuration. Focus on trigger characteristics, aftermarket support, and match legality if applicable.',
  };

  const budgetMap: Record<string, string> = {
    '10000':  'Your R10,000 budget covers a solid range of reliable entry-level platforms from established manufacturers.',
    '25000':  'With a R25,000 ceiling, the South African market opens significantly — you can access proven duty-grade platforms with excellent aftermarket support.',
    '50000':  'At R50,000, you have access to premium competition-ready configurations, custom work, and collector-grade pieces.',
    '999999': 'With no budget constraint, we have surfaced the finest available configurations currently in the vault.',
  };

  return `ADVISORY ASSESSMENT — ${disciplineMap[answers.discipline]?.toUpperCase() || 'GENERAL USE'}

${budgetMap[answers.budget] || ''}

For your stated discipline of ${disciplineMap[answers.discipline] || 'general use'}, ${frameMap[answers.frame] || 'the selected frame size provides good versatility'}.

${experienceMap[answers.experience] || ''}

CALIBRE GUIDANCE: For self-defence applications, 9mm Luger remains the ballistic and logistical optimum in South Africa — widely available, controllable, and effective. For sport, 9mm Major or .40 S&W are common depending on your division. For hunting, calibre selection depends on intended game — consult a SAPS-licensed dealer to ensure your licence covers your intended calibre.

LEGAL REMINDER: All firearms must be licenced in your name before acquisition. Transfer must occur through a SAPS-licensed dealer. Ensure your competency certificate covers the action type of your selected platform before applying for a licence.

The listings below represent active stock matching your profile. Contact sellers directly — all transactions must be completed through a licensed dealer.`;
}

// ── Category Mapping ──────────────────────────────────────────────────────────
function getCategorySlug(discipline: string): string[] {
  switch (discipline) {
    case 'self_defense': return ['pistols', 'revolvers'];
    case 'sport':        return ['pistols', 'revolvers', 'shotguns'];
    case 'hunting':      return ['bolt-action', 'semi-auto-rifles', 'lever-action', 'rifles'];
    case 'collection':   return ['pistols', 'revolvers', 'bolt-action', 'rifles'];
    default:             return ['pistols', 'revolvers'];
  }
}

// ── Typing Effect ─────────────────────────────────────────────────────────────
function useTypingEffect(text: string, speed = 12) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone]           = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdvisorPage() {
  const [step, setStep]         = useState<Step>('budget');
  const [answers, setAnswers]   = useState<Answers>({ budget: '', discipline: '', frame: '', experience: '' });
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [advisory, setAdvisory] = useState('');
  const resultRef               = useRef<HTMLDivElement>(null);

  const { displayed, done } = useTypingEffect(advisory, 8);

  const stepIndex = STEPS.indexOf(step);
  const progress  = step === 'result' ? 100 : Math.round((stepIndex / (STEPS.length - 1)) * 100);

  const handleAnswer = (key: keyof Answers, value: string) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);

    const keys = Object.keys(QUESTIONS) as (keyof Answers)[];
    const currentIdx = keys.indexOf(key);

    if (currentIdx < keys.length - 1) {
      setStep(keys[currentIdx + 1] as Step);
    } else {
      // Last question answered — run analysis
      runAnalysis(updated);
    }
  };

  const runAnalysis = async (a: Answers) => {
    setStep('result');
    setLoading(true);
    setAdvisory('');

    // Call Claude Haiku via API
    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(a),
      });
      const data = await res.json();
      setAdvisory(data.advisory || generateAdvisory(a));
    } catch {
      // Fallback to template if API fails
      setAdvisory(generateAdvisory(a));
    }

    // Query Supabase
    try {
      const categories = getCategorySlug(a.discipline);
      const maxPrice   = parseInt(a.budget);

      let query = supabase
        .from('listings')
        .select('id, title, price, category_id, images, city, listing_type, is_featured, view_count, is_negotiable, created_at')
        .eq('status', 'active')
        .in('category_id', categories)
        .lte('price', maxPrice)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12);

      const { data } = await query;

      if (!data || data.length === 0) {
        // Fallback — show any active listings in broad categories
        const { data: fallback } = await supabase
          .from('listings')
          .select('id, title, price, category_id, images, city, listing_type, is_featured, view_count, is_negotiable, created_at')
          .eq('status', 'active')
          .in('category_id', ['pistols', 'revolvers', 'rifles'])
          .order('is_featured', { ascending: false })
          .limit(8);
        setListings(fallback || []);
      } else {
        setListings(data);
      }
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const restart = () => {
    setStep('budget');
    setAnswers({ budget: '', discipline: '', frame: '', experience: '' });
    setListings([]);
    setAdvisory('');
  };

  const formatCategory = (cat: string) =>
    cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

  const currentQuestion = step !== 'result' ? QUESTIONS[step as keyof typeof QUESTIONS] : null;
  const currentKey      = step !== 'result' ? step as keyof Answers : null;

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#C9922A] animate-pulse" />
            <p className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.4em]">AI-Powered</p>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none mb-4">
            Firearm <span className="text-[#C9922A]">Match</span> Advisor
          </h1>
          <p className="text-[#8A8E99] text-sm md:text-base leading-relaxed max-w-xl">
            Answer four questions. Our advisor analyses your profile and surfaces active listings from the vault that match your discipline, budget, and experience level.
          </p>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="w-full h-1 bg-[#191C23]">
        <div className="h-full bg-[#C9922A] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <main className="flex-1 max-w-[800px] mx-auto w-full px-4 md:px-6 py-10 md:py-16">

        {/* STEP INDICATOR */}
        {step !== 'result' && (
          <div className="flex items-center gap-2 mb-8">
            {STEPS.filter(s => s !== 'result').map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-black transition-all ${
                  s === step ? 'bg-[#C9922A] text-black' :
                  STEPS.indexOf(s) < stepIndex ? 'bg-[#C9922A]/30 text-[#C9922A]' :
                  'bg-[#191C23] border border-white/10 text-[#8A8E99]'
                }`}>{i + 1}</div>
                {i < 3 && <div className={`w-8 h-px transition-all ${STEPS.indexOf(s) < stepIndex ? 'bg-[#C9922A]/50' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* QUESTION CARD */}
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

            {stepIndex > 0 && (
              <button onClick={() => setStep(STEPS[stepIndex - 1])}
                className="mt-6 text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#F0EDE8] transition-colors">
                ← Back
              </button>
            )}
          </div>
        )}

        {/* RESULTS */}
        {step === 'result' && (
          <div ref={resultRef} className="space-y-8">

            {/* SUMMARY PILLS */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Budget', value: answers.budget === '999999' ? 'No Limit' : `R${parseInt(answers.budget).toLocaleString()}` },
                { label: 'Use', value: answers.discipline.replace('_', ' ') },
                { label: 'Frame', value: answers.frame },
                { label: 'Level', value: answers.experience.replace('_', ' ') },
              ].map(pill => (
                <div key={pill.label} className="bg-[#191C23] border border-[#C9922A]/20 rounded-sm px-3 py-1.5 flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#8A8E99]">{pill.label}</span>
                  <span className="text-[11px] font-black uppercase text-[#C9922A]">{pill.value}</span>
                </div>
              ))}
              <button onClick={restart}
                className="bg-[#191C23] border border-white/10 rounded-sm px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#F0EDE8] hover:border-white/20 transition-all">
                ↺ Restart
              </button>
            </div>

            {/* AI ADVISORY */}
            <div className="bg-[#191C23] border border-[#C9922A]/20 rounded-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#C9922A] animate-pulse" />
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-[11px] font-black uppercase tracking-[0.4em] text-[#C9922A]">
                  AI Advisory — Generating Assessment
                </p>
                {!done && <div className="w-3 h-3 border border-[#C9922A] border-t-transparent rounded-full animate-spin" />}
              </div>
              <pre className="text-[13px] text-[#8A8E99] leading-relaxed whitespace-pre-wrap font-mono">
                {displayed}
                {!done && <span className="inline-block w-2 h-4 bg-[#C9922A] animate-pulse ml-0.5 align-middle" />}
              </pre>
            </div>

            {/* LISTINGS */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-2xl font-black uppercase">
                  {loading ? 'Scanning Vault...' : listings.length > 0 ? `${listings.length} Matched Listing${listings.length !== 1 ? 's' : ''}` : 'No Exact Match — Top Alternatives'}
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
                  <p className="text-[#8A8E99] text-sm mb-6">
                    Showing top-rated alternative platforms currently available.
                  </p>
                  <Link href="/browse" className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
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
                            <div className="absolute top-2 left-2 bg-[#C9922A] text-black text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tight">
                              ⭐ Featured
                            </div>
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
                            <span>👁 {listing.view_count || 0} views</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LEGAL NOTICE */}
            <div className="bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-sm p-5">
              <p className="text-[#C9922A] font-black text-[12px] uppercase tracking-widest mb-2">⚠️ Legal Notice</p>
              <p className="text-[#8A8E99] text-[13px] leading-relaxed">
                All firearm acquisitions must comply with the Firearms Control Act (Act 60 of 2000). A valid licence for the relevant category is required before purchase. All transfers must be completed through a SAPS-licensed dealer. The AI advisory is informational only and does not constitute legal or ballistic advice.
              </p>
            </div>

            {/* CTA */}
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
                ↺ Start New Assessment
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
