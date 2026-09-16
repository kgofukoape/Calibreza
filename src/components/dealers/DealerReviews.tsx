'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Review {
  id: string;
  reviewer_id: string;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  dealer_response: string | null;
  dealer_response_at: string | null;
}

function Stars({ value, size = 'text-base' }: { value: number; size?: string }) {
  return (
    <span className={size}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={n <= value ? 'text-[#C9922A]' : 'text-white/15'}>*</span>
      ))}
    </span>
  );
}

export default function DealerReviews({ dealerId }: { dealerId: string }) {
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => { init(); }, [dealerId]);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const u = session?.user ?? null;
    setUser(u);
    if (u) {
      const { data: owned } = await supabase
        .from('dealers').select('id').eq('id', dealerId).eq('user_id', u.id).maybeSingle();
      setIsOwner(!!owned);
    }
    await loadReviews();
    setLoading(false);
  };

  const loadReviews = async () => {
    const { data } = await supabase
      .from('dealer_reviews')
      .select('id, reviewer_id, reviewer_name, rating, comment, created_at, dealer_response, dealer_response_at')
      .eq('dealer_id', dealerId)
      .eq('hidden', false)
      .order('created_at', { ascending: false });
    setReviews(data || []);
  };

  const myExisting = user ? reviews.find(r => r.reviewer_id === user.id) : null;

  const submit = async () => {
    if (!user) return;
    if (myRating < 1) { setMsg('Please choose a star rating.'); return; }
    setSubmitting(true);
    setMsg('');

    let reviewerName = 'User';
    const { data: prof } = await supabase
      .from('seller_public').select('full_name').eq('id', user.id).maybeSingle();
    if (prof?.full_name) reviewerName = prof.full_name;

    const { error } = await supabase.from('dealer_reviews').upsert({
      dealer_id: dealerId,
      reviewer_id: user.id,
      reviewer_name: reviewerName,
      rating: myRating,
      comment: myComment.trim() || null,
    }, { onConflict: 'dealer_id,reviewer_id' });

    setSubmitting(false);
    if (error) { setMsg('Could not save your review: ' + error.message); return; }
    setMsg('Thank you, your review is live.');
    setMyRating(0);
    setMyComment('');
    loadReviews();
  };

  const report = async (id: string) => {
    if (!confirm('Report this review as inappropriate or fake? Our team will look at it.')) return;
    const { error } = await supabase.rpc('report_review', { p_review_id: id });
    alert(error ? ('Could not report: ' + error.message) : 'Thank you. This review has been flagged for review.');
  };

  const sendReply = async (id: string) => {
    const { error } = await supabase.rpc('respond_to_review', { p_review_id: id, p_response: replyText });
    if (error) { alert('Could not post response: ' + error.message); return; }
    setReplyOpen(null);
    setReplyText('');
    loadReviews();
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return <div className="bg-[#13151A] border border-white/5 p-10 rounded-sm text-center text-[#8A8E99]">Loading reviews...</div>;
  }

  return (
    <div className="bg-[#13151A] border border-white/5 p-6 md:p-10 rounded-sm">
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-6 text-[#C9922A]">Customer Reviews</h2>

      {!isOwner && (user ? (
        myExisting && myRating === 0 ? (
          <div className="border border-white/10 rounded-sm p-5 mb-8 bg-[#0D0F13]">
            <p className="text-[13px] text-[#8A8E99] mb-3">You reviewed this dealer:</p>
            <Stars value={myExisting.rating} />
            {myExisting.comment && <p className="text-[14px] text-[#C4C0B8] mt-2">{myExisting.comment}</p>}
            <button onClick={() => { setMyRating(myExisting.rating); setMyComment(myExisting.comment || ''); }}
              className="mt-3 text-[11px] font-black uppercase tracking-widest text-[#C9922A] hover:underline">
              Edit my review
            </button>
          </div>
        ) : (
          <div className="border border-[#C9922A]/20 rounded-sm p-5 mb-8 bg-[#C9922A]/5">
            <p className="text-[13px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">
              {myExisting ? 'Edit your review' : 'Write a review'}
            </p>
            <div className="flex gap-1 mb-3 text-2xl cursor-pointer">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setMyRating(n)}
                  className={n <= myRating ? 'text-[#C9922A]' : 'text-white/20 hover:text-white/40'}>
                  *
                </button>
              ))}
            </div>
            <textarea value={myComment} onChange={e => setMyComment(e.target.value)} rows={3}
              placeholder="Share your experience with this dealer (optional)"
              className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 mb-3" />
            <div className="flex items-center gap-3">
              <button onClick={submit} disabled={submitting}
                className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-2.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-40">
                {submitting ? 'Saving...' : 'Submit Review'}
              </button>
              {msg && <span className="text-[12px] text-[#8A8E99]">{msg}</span>}
            </div>
          </div>
        )
      ) : (
        <div className="border border-white/10 rounded-sm p-5 mb-8 bg-[#0D0F13] text-center">
          <p className="text-[14px] text-[#8A8E99] mb-3">Sign in to leave a review for this dealer.</p>
          <Link href="/login" className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-2.5 rounded-sm hover:brightness-110 transition-all">
            Sign in to review
          </Link>
        </div>
      ))}

      {isOwner && (
        <div className="border border-white/10 rounded-sm p-4 mb-8 bg-[#0D0F13]">
          <p className="text-[13px] text-[#8A8E99]">This is your dealer profile. You can respond to reviews below.</p>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-[#8A8E99] text-center py-8 uppercase font-bold tracking-widest">No reviews yet</p>
      ) : (
        <div className="flex flex-col divide-y divide-white/5">
          {reviews.map(r => (
            <div key={r.id} className="py-5">
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[14px] text-[#F0EDE8]">{r.reviewer_name || 'User'}</span>
                  <Stars value={r.rating} size="text-sm" />
                </div>
                <span className="text-[11px] text-[#8A8E99]">{fmt(r.created_at)}</span>
              </div>
              {r.comment && <p className="text-[14px] text-[#C4C0B8] leading-relaxed mt-1">{r.comment}</p>}

              {r.dealer_response && (
                <div className="mt-3 ml-4 pl-4 border-l-2 border-[#C9922A]/40">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] mb-1">
                    Response from the dealer{r.dealer_response_at ? ' - ' + fmt(r.dealer_response_at) : ''}
                  </p>
                  <p className="text-[14px] text-[#C4C0B8] leading-relaxed">{r.dealer_response}</p>
                </div>
              )}

              {isOwner && (
                replyOpen === r.id ? (
                  <div className="mt-3">
                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2}
                      placeholder="Write your response..."
                      className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 mb-2" />
                    <div className="flex gap-2">
                      <button onClick={() => sendReply(r.id)}
                        className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[11px] px-4 py-2 rounded-sm hover:brightness-110">
                        Post response
                      </button>
                      <button onClick={() => { setReplyOpen(null); setReplyText(''); }}
                        className="text-[11px] uppercase tracking-widest text-[#8A8E99] px-2">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setReplyOpen(r.id); setReplyText(r.dealer_response || ''); }}
                    className="mt-2 text-[10px] uppercase tracking-widest text-[#C9922A] hover:underline">
                    {r.dealer_response ? 'Edit response' : 'Respond'}
                  </button>
                )
              )}

              {user && !isOwner && user.id !== r.reviewer_id && (
                <button onClick={() => report(r.id)}
                  className="mt-2 text-[10px] uppercase tracking-widest text-[#8A8E99] hover:text-[#E63946] transition-colors">
                  Report
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
