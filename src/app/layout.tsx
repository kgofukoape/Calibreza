import type { Metadata } from 'next'
import './globals.css'
import { Suspense } from 'react'
import FloatingAdvisor from '@/components/FloatingAdvisor'
import { Analytics } from '@vercel/analytics/next'

const FALLBACK_URL = 'https://calibreza.vercel.app'

/**
 * Resolve the site URL safely.
 *
 * `new URL()` THROWS on anything that isn't a valid absolute URL — a value like
 * "calibreza.vercel.app" (no protocol) or one with a stray space will crash the
 * entire build with "TypeError: Invalid URL". Next.js masks the offending value
 * as [SENSITIVE] because it is an env var, which makes it hard to diagnose.
 * This never throws: it repairs a missing protocol, and falls back if all else
 * fails.
 */
function resolveSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (raw) {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    try {
      return new URL(withProtocol)
    } catch {
      // fall through to the known-good default
    }
  }

  return new URL(FALLBACK_URL)
}

const SITE_URL_OBJ = resolveSiteUrl()
const SITE_URL = SITE_URL_OBJ.origin

// ─── SITE-WIDE SEO ───────────────────────────────────────────────────────────
// Previously this was just a title and description, which meant:
//   • Links shared on WhatsApp, Facebook or X showed no preview card at all
//   • Search engines had no structured signals beyond the raw page text
//   • No canonical URL, so duplicate-content risk on parameterised pages
//
// `metadataBase` lets Next.js turn the relative image paths below into absolute
// URLs, which is what social platforms require.

export const metadata: Metadata = {
  metadataBase: SITE_URL_OBJ,
  title: {
    default: "Gun X — South Africa's Premier Firearms Classifieds",
    // Child pages set their own title; this wraps it consistently
    template: '%s | Gun X',
  },
  description:
    'Buy and sell firearms, ammunition, optics and accessories across South Africa. Verified dealers, clubs and ranges, FCA-aligned listings, and a free firearm match advisor.',
  keywords: [
    'firearms for sale South Africa',
    'guns for sale',
    'firearm classifieds',
    'gun dealers South Africa',
    'shooting ranges South Africa',
    'ammunition',
    'rifles',
    'pistols',
    'shotguns',
    'FCA compliant',
  ],
  authors: [{ name: 'GX SA (Pty) Ltd' }],
  creator: 'GX SA (Pty) Ltd',
  publisher: 'GX SA (Pty) Ltd',
  applicationName: 'Gun X',
  referrer: 'origin-when-cross-origin',
  formatDetection: { telephone: false, address: false, email: false },

  alternates: { canonical: '/' },

  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: SITE_URL,
    siteName: 'Gun X',
    title: "Gun X — South Africa's Premier Firearms Classifieds",
    description:
      'Buy and sell firearms, ammunition, optics and accessories across South Africa. Verified dealers, clubs and ranges, and a free firearm match advisor.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Gun X — South African firearms classifieds',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: "Gun X — South Africa's Premier Firearms Classifieds",
    description:
      'Buy and sell firearms, ammunition, optics and accessories across South Africa.',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  category: 'shopping',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Organisation structured data — helps search engines understand who runs
  // the site and can produce richer results.
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Gun X',
    legalName: 'GX SA (Pty) Ltd',
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.png`,
    description:
      "South Africa's classifieds platform for licensed firearms, dealers, clubs and ranges.",
    // Locality only. The full street address is published on the legal pages
    // (Terms, Dealer Agreement, POPI Notice, Legal Disclaimer, Advertising
    // Policy and the PAIA Manual) where ECTA s43 and PAIA s51 require it, and
    // is deliberately kept out of site-wide structured data.
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Cape Town',
      addressRegion: 'Western Cape',
      addressCountry: 'ZA',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@gunx.co.za',
      contactType: 'customer support',
      areaServed: 'ZA',
      availableLanguage: ['English'],
    },
  }

  return (
    <html lang="en-ZA">
      <body className="overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {children}
        <Suspense fallback={null}>
          <FloatingAdvisor />
        </Suspense>

        {/* Vercel Web Analytics — real visitor counts, page views and device
            split. This is what backs any audience figure quoted on the
            /advertise rate card, so the numbers shown to advertisers are
            measured rather than estimated. No cookies, no personal data
            stored, which keeps it clean under POPIA. */}
        <Analytics />
      </body>
    </html>
  )
}
