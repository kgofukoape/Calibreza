import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublicKey) {
  throw new Error(
    'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).'
  );
}

export const supabase = createClient(supabaseUrl, supabasePublicKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Clear bad sessions automatically
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' && !session) {
    supabase.auth.signOut();
  }
  if (event === 'SIGNED_OUT') {
    // Clear any stale admin session
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gunx_admin_session');
    }
  }
});

export type Listing = {
  id: string;
  title: string;
  description: string;
  category_id: string;
  make_id: string;
  model: string;
  calibre_id: string;
  condition_id: string;
  price: number;
  province_id: string;
  city: string;
  seller_id: string;
  listing_type: 'private' | 'dealer';
  licence_type: string;
  action_type: string;
  capacity: string;
  barrel_length: string;
  overall_length: string;
  included_items: string[];
  status: string;
  is_featured: boolean;
  views_count: number;
  images: string[];
  created_at: string;
  updated_at: string;
  expires_at: string;
};

export type User = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  user_type: 'private' | 'dealer';
  province_id: string;
  city: string;
  is_verified: boolean;
  avg_response_hours: number;
  total_listings: number;
  successful_sales: number;
  member_since: string;
};

export type Make = {
  id: string;
  name: string;
  country: string;
};

export type Calibre = {
  id: string;
  name: string;
  category: string;
};

export type Province = {
  id: string;
  name: string;
  code: string;
};

export type Condition = {
  id: string;
  name: string;
  description: string;
};