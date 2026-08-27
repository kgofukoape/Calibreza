import { supabase } from './supabase';

// ─── PRIVATE DOCUMENT ACCESS ─────────────────────────────────────────────────
// Application documents — SAPS dealer certificates, business registrations, ID
// documents, PSIRA certificates — live in private buckets. That is deliberate:
// they are the documents a person is most harmed by losing, and a public URL is
// a permanent open link to them.
//
// The consequence is that the stored value is a PATH, not a URL. Linking to it
// directly gives you a broken relative link, which is exactly what the dealer
// admin panel was doing after the buckets were made private — the documents
// were there and could not be opened.
//
// A signed URL is generated on demand instead, valid for five minutes: long
// enough to read a certificate, not long enough to be worth passing around.

export const DOCUMENT_BUCKETS = {
  dealer: 'dealer-documents',
  business: 'business-documents',
  verification: 'verification-docs',
} as const;

export type DocumentBucket = typeof DOCUMENT_BUCKETS[keyof typeof DOCUMENT_BUCKETS];

const SIGNED_URL_SECONDS = 300;

/**
 * Opens a stored document in a new tab.
 *
 * Tolerates rows written before the buckets were private, where the column
 * holds a full URL rather than a path — those open directly.
 */
export async function openDocument(bucket: DocumentBucket, pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) {
    alert('No document was uploaded for this.');
    return;
  }

  // Legacy rows hold a full public URL.
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    window.open(pathOrUrl, '_blank', 'noopener');
    return;
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(pathOrUrl, SIGNED_URL_SECONDS);

    if (error) throw error;
    window.open(data.signedUrl, '_blank', 'noopener');
  } catch (err: any) {
    // Worth distinguishing: a missing file and a permission problem look the
    // same to the user otherwise, and the fixes are entirely different.
    alert(
      `Could not open the document: ${err.message}\n\n` +
      `If this says the object was not found, the upload did not complete. ` +
      `If it mentions permission, the storage policy needs checking.`
    );
  }
}