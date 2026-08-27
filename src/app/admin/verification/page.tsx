import { redirect } from 'next/navigation';

// ─── RETIRED ─────────────────────────────────────────────────────────────────
// Verification documents are collected at application and reviewed on the
// Dealers, Clubs and Services pages, where the approval decision is actually
// made.
//
// This page read a separate verification_documents table that nothing
// populated — its upload component was never linked from anywhere on the site,
// so the queue was permanently empty and looked like a working feature.
//
// Kept as a redirect rather than deleted, so an old bookmark lands somewhere
// useful instead of on a 404.
export default function RetiredVerificationPage() {
  redirect('/admin/dealers');
}