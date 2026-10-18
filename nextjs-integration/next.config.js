/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.graphassets.com',
      },
      {
        protocol: 'https',
        hostname: '**.hygraph.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      // 301 Permanent Redirect: Legacy blog routes to bilingual English route
      {
        source: '/blogs/:slug',
        destination: '/en/blogs/:slug',
        permanent: true,
      },
      // Root blogs landing page redirect
      {
        source: '/blogs',
        destination: '/en/blogs',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
