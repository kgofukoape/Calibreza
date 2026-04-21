/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

// Exclude Supabase edge functions from Next.js build
const withExcludes = {
  ...nextConfig,
  webpack: (config) => {
    config.watchOptions = { ...config.watchOptions, ignored: /supabase\/functions/ };
    return config;
  },
};
module.exports = withExcludes
