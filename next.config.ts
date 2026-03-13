import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* Decommissioned App Hosting (paid) in favor of Static Export (Free Tier) */
  output: 'export',
  /* Ensure clean URLs for static hosting */
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    /* Static exports do not support the dynamic Image Optimization API (requires paid runtime) */
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
