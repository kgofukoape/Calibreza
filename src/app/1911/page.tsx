import type { Metadata } from 'next';
import { COLLECTION_1911 } from '@/lib/collections';
import CollectionClient from './CollectionClient';

// ─── /1911 ───────────────────────────────────────────────────────────────────
// A server component purely so this page can carry real metadata. The listings
// themselves load client-side in CollectionClient.
//
// The metadata is the point. Gun Africa cannot rank for structured queries
// because its listing titles are whole descriptions and its URLs run to
// hundreds of characters — there is nothing clean for a search engine to
// attach to. A short URL, a real title, a description written for humans and
// CollectionPage structured data is something they cannot easily answer.

export const metadata: Metadata = {
  title: '1911 Pistols for Sale in South Africa | Gun X',
  description:
    'Every 1911-pattern pistol listed on Gun X — Government, Commander and Officer models, Mil-Spec through full custom, from licensed dealers and private sellers across South Africa.',
  alternates: { canonical: 'https://gunx.co.za/1911' },
  openGraph: {
    title: '1911 Pistols for Sale in South Africa | Gun X',
    description:
      'Every 1911-pattern pistol listed on Gun X, from Mil-Spec Government models to full custom builds.',
    url: 'https://gunx.co.za/1911',
    type: 'website',
  },
  keywords: [
    '1911 for sale south africa', '1911 pistol', 'm1911', '.45 acp pistol',
    'colt 1911', 'tisas 1911', 'rock island 1911', 'staccato 2011',
    'government model', 'commander 1911',
  ],
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: '1911 Pistols for Sale in South Africa',
  description: COLLECTION_1911.intro,
  url: 'https://gunx.co.za/1911',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Gun X',
    url: 'https://gunx.co.za',
  },
};

export default function Collection1911Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CollectionClient />
    </>
  );
}