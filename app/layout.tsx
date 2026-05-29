import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeSynchronizer } from "@/components/providers/theme-synchronizer";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { UpdateProvider } from "@/components/providers/update-provider";
import { DeferredAnalytics } from "@/components/common/deferred-analytics";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], display: "swap", preload: true });
const DARK_THEME_COLOR = "#1a1f1a";
const LIGHT_THEME_COLOR = "#fcfcfc";

export const metadata: Metadata = {
  metadataBase: new URL("https://cannafriend.app"),
  title: "Cannafriend - Seguimiento de Plantas y Diario de Cultivo",
  description:
    "Registra el crecimiento de tus plantas y mantén el seguimiento con registros detallados y monitoreo ambiental",
  keywords:
    "plant growth, plant tracker, cultivation journal, plant care, growth monitoring, plant management, registro de crecimiento de plantas, registro de seguimiento de plantas, registro de cultivo de plantas, registro de monitoreo ambiental, registro de gestión de plantas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cannafriend",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://cannafriend.app",
    siteName: "Cannafriend",
    title: "Cannafriend - Seguimiento de Plantas y Diario de Cultivo",
    description:
      "Registra el crecimiento de tus plantas y mantén el seguimiento con registros detallados y monitoreo ambiental",
  },
  alternates: {
    canonical: "https://cannafriend.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cannafriend - Seguimiento de Plantas y Diario de Cultivo",
    description:
      "Registra el crecimiento de tus plantas y mantén el seguimiento con registros detallados y monitoreo ambiental",
  },
  icons: {
    icon: [
      {
        url: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/logo-white.png",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: DARK_THEME_COLOR },
    { media: "(prefers-color-scheme: light)", color: LIGHT_THEME_COLOR },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content={DARK_THEME_COLOR} />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Cannafriend" />
        <meta name="author" content="Cannafriend Team" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="alternate" hrefLang="es" href="https://cannafriend.app/" />
        <link rel="alternate" hrefLang="en" href="https://cannafriend.app/" />
        <link rel="alternate" hrefLang="x-default" href="https://cannafriend.app/" />
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Cannafriend",
              applicationCategory: "LifestyleApplication",
              operatingSystem: "Web, Android, iOS",
              url: "https://cannafriend.app",
              description:
                "Registra el crecimiento de tus plantas y mantén el seguimiento con registros detallados y monitoreo ambiental",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var storedTheme = localStorage.getItem('theme');
                  var theme = storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
                    ? storedTheme
                    : 'dark';
                  var resolvedTheme = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(resolvedTheme);
                  document.documentElement.style.colorScheme = resolvedTheme;
                  var themeColor = resolvedTheme === 'dark' ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}';
                  var themeColorMeta = document.querySelector('meta[name="theme-color"]:not([media])')
                    || document.querySelector('meta[name="theme-color"]');
                  if (!themeColorMeta) {
                    themeColorMeta = document.createElement('meta');
                    themeColorMeta.setAttribute('name', 'theme-color');
                    document.head.appendChild(themeColorMeta);
                  }
                  themeColorMeta.setAttribute('content', themeColor);
                  themeColorMeta.removeAttribute('media');
                  var appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
                  if (appleMeta) {
                    appleMeta.setAttribute('content', resolvedTheme === 'dark' ? 'black-translucent' : 'default');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/favicon-96x96.png"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href="/favicon.svg"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          type="image/png"
          href="/logo-white.png"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body className={inter.className}>
        <Script
          id="service-worker-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                if ('serviceWorker' in navigator) {
                  var isLocalDevHost =
                    location.protocol !== 'https:' ||
                    location.hostname === 'localhost' ||
                    location.hostname === '127.0.0.1';

                  if (isLocalDevHost) {
                    navigator.serviceWorker.getRegistrations()
                      .then(function(registrations){
                        return Promise.all(
                          registrations.map(function(registration){
                            return registration.unregister();
                          })
                        );
                      })
                      .catch(function(e){
                        console.warn('SW unregister failed', e);
                      });
                    return;
                  }

                  window.addEventListener('load', function(){
                    navigator.serviceWorker.register('/sw.js').then(function(reg){
                      navigator.serviceWorker.addEventListener('message', function(event){
                        if (event && event.data && event.data.type === 'RELOAD_PAGE') {
                          location.reload();
                        }
                      });
                      return reg;
                    }).catch(function(e){
                      console.warn('SW registration failed', e);
                    });
                  });
                }
              })();
            `,
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-md"
        >
          Saltar al contenido
        </a>
        <I18nProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <ThemeSynchronizer />
            <UpdateProvider>
              {children}
              <DeferredAnalytics />
              <Toaster position="bottom-center" />
            </UpdateProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
