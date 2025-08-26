import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pagead2.googlesyndication.com",
        port: "",
        pathname: "/**",
      },
    ],
    // Enable Next.js image optimization for remote images
    unoptimized: false,
    formats: ["image/webp", "image/avif"],
  },
  // PWA configuration
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com; connect-src 'self' https://pagead2.googlesyndication.com; img-src 'self' data: https://pagead2.googlesyndication.com;",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
