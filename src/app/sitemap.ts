import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// ─── SITEMAP ─────────────────────────────────────────────────────────────────
// Tells search engines every page worth indexing, including the dynamic ones
// (listings, dealer storefronts, club/range profiles, service providers).
// Without this, deep pages are only found if something links to them — which is
// how a new marketplace stays invisible while older competitors rank.
//
// Regenerates hourly so new listings appear without a redeploy.
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://calibreza.vercel.app';

// Anon key is correct here: the sitemap must only ever contain PUBLIC pages,
// and RLS keeps this query to publicly visible rows.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const STATIC_ROUTES: Array<{ path: string; priority: number; freq: 'daily' | 'weekly' | 'monthly' | 'yearly' }> = [
  { path: '',                     priority: 1.0, freq: 'daily'   },
  { path: '/browse',              priority: 0.9, freq: 'daily'   },
  { path: '/dealers',             priority: 0.8, freq: 'weekly'  },
  { path: '/clubs',               priority: 0.8, freq: 'weekly'  },
  { path: '/services',            priority: 0.7, freq: 'weekly'  },
  { path: '/jobs',                priority: 0.7, freq: 'daily'   },
  { path: '/wanted',              priority: 0.7, freq: 'daily'   },
  { path: '/advisor',             priority: 0.8, freq: 'monthly' },
  { path: '/sell',                priority: 0.7, freq: 'monthly' },
  { path: '/advertise',           priority: 0.6, freq: 'monthly' },
  { path: '/about',               priority: 0.5, freq: 'monthly' },
  { path: '/contact',             priority: 0.5, freq: 'monthly' },
  { path: '/faqs',                priority: 0.5, freq: 'monthly' },
  { path: '/firearm-ownership',   priority: 0.7, freq: 'monthly' },
  { path: '/guides/firearm-ownership', priority: 0.7, freq: 'monthly' },
  { path: '/sport-shooting',      priority: 0.6, freq: 'weekly'  },
  { path: '/dealer/pricing',      priority: 0.5, freq: 'monthly' },
  { path: '/dealer/apply',        priority: 0.5, freq: 'monthly' },
  { path: '/clubs/pricing',       priority: 0.5, freq: 'monthly' },
  { path: '/clubs/apply',         priority: 0.4, freq: 'monthly' },
  // Legal — low priority but should be indexed for trust signals
  { path: '/terms',               priority: 0.3, freq: 'yearly'  },
  { path: '/privacy',             priority: 0.3, freq: 'yearly'  },
  { path: '/popi',                priority: 0.3, freq: 'yearly'  },
  { path: '/legal',               priority: 0.3, freq: 'yearly'  },
  { path: '/dealer-terms',        priority: 0.3, freq: 'yearly'  },
  { path: '/advertising-policy',  priority: 0.3, freq: 'yearly'  },
];

const CATEGORIES = [
  'pistols', 'rifles', 'shotguns', 'revolvers', 'air-guns', 'airsoft',
  'optics', 'holsters', 'magazines', 'ammunition', 'reloading',
  'knives', 'accessories',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map(r => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  // Category browse pages
  CATEGORIES.forEach(cat => {
    entries.push({
      url: `${SITE_URL}/browse/${cat}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    });
  });

  // Dynamic content. Each query is wrapped so a single failure (or a paused
  // database) degrades to a partial sitemap rather than breaking the build.
  try {
    const { data: listings } = await supabase
      .from('listings')
      .select('id, updated_at, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5000);

    listings?.forEach(l => {
      entries.push({
        url: `${SITE_URL}/listings/${l.id}`,
        lastModified: l.updated_at ? new Date(l.updated_at) : (l.created_at ? new Date(l.created_at) : now),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  } catch (e) {
    console.error('sitemap: listings query failed', e);
  }

  try {
    const { data: dealers } = await supabase
      .from('dealers')
      .select('slug, updated_at')
      .eq('status', 'approved')
      .limit(1000);

    dealers?.forEach(d => {
      if (!d.slug) return;
      entries.push({
        url: `${SITE_URL}/dealers/${d.slug}`,
        lastModified: d.updated_at ? new Date(d.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  } catch (e) {
    console.error('sitemap: dealers query failed', e);
  }

  try {
    const { data: clubs } = await supabase
      .from('clubs')
      .select('slug, updated_at')
      .limit(1000);

    clubs?.forEach(c => {
      if (!c.slug) return;
      entries.push({
        url: `${SITE_URL}/clubs/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  } catch (e) {
    console.error('sitemap: clubs query failed', e);
  }

  try {
    const { data: services } = await supabase
      .from('services')
      .select('slug, updated_at')
      .eq('status', 'active')
      .limit(1000);

    services?.forEach(s => {
      if (!s.slug) return;
      entries.push({
        url: `${SITE_URL}/services/${s.slug}`,
        lastModified: s.updated_at ? new Date(s.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    });
  } catch (e) {
    console.error('sitemap: services query failed', e);
  }

  return entries;
}