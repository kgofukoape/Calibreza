import type { MetadataRoute } from 'next';

// ─── ROBOTS.TXT ──────────────────────────────────────────────────────────────
// Tells crawlers what to index and where the sitemap lives.
//
// Note what is DISALLOWED below: the admin console, dashboards, auth pages and
// API routes. Two reasons — those pages are useless in search results, and
// having them indexed advertises your attack surface to anyone scanning.
//
// The secret admin path is deliberately NOT listed. Naming it here would
// publish the very thing it relies on staying unlisted; it is already
// unreachable without the gate cookie.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://calibreza.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/dealer-dashboard',
          '/dealer-dashboard/',
          '/club-dashboard',
          '/club-dashboard/',
          '/service-dashboard',
          '/service-dashboard/',
          '/dashboard',
          '/dashboard/',
          '/settings',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/auth/',
          '/advertise/enquiry',   // unlisted sales intake form
          '/not-found-gx',
          '/rsvp-result',
        ],
      },
      {
        // Block the noisier SEO crawlers — they cost bandwidth and give nothing
        userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot'],
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}