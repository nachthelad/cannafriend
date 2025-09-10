import bundleAnalyzer from '@next/bundle-analyzer';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  eslint: {
    ignoreDuringBuilds: true, // Keep ESLint enabled but non-blocking
    dirs: ['app', 'components', 'lib', 'hooks'],
  },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
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
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://apis.google.com https://accounts.google.com; connect-src 'self' https://pagead2.googlesyndication.com https://apis.google.com https://accounts.google.com https://oauth2.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://firebaseapp.com https://firebase-analytics.com; img-src 'self' data: https://pagead2.googlesyndication.com https://lh3.googleusercontent.com; frame-src https://accounts.google.com;",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
