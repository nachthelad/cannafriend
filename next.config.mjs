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
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
    ],
  },
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
  // Security and PWA headers
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    // 'unsafe-eval' is required in dev for webpack HMR / react-refresh.
    // It is intentionally omitted from the production CSP.
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://storage.googleapis.com https://pagead2.googlesyndication.com"
      : "script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://storage.googleapis.com https://pagead2.googlesyndication.com";

    const csp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      [
        "connect-src 'self'",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://oauth2.googleapis.com",
        "https://accounts.google.com",
        "https://apis.google.com",
        "https://firestore.googleapis.com",
        "https://firebasestorage.googleapis.com",
        "https://firebase-analytics.com",
        "https://www.google-analytics.com",
        "https://fcm.googleapis.com",
        "https://va.vercel-insights.com",
        "https://pagead2.googlesyndication.com",
        // Allow webpack HMR websocket in dev
        ...(isDev ? ["ws://localhost:3000"] : []),
      ].join(" "),
      "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://pagead2.googlesyndication.com",
      "font-src 'self' data:",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "frame-src https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ");

    return [
      {
        // Security headers for all app pages
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
