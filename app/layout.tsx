import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeSynchronizer } from "@/components/providers/theme-synchronizer";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { UpdateProvider } from "@/components/providers/update-provider";
import { DeferredAnalytics } from "@/components/common/deferred-analytics";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], display: "swap", preload: true });

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
    statusBarStyle: "default",
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
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#10b981" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cannafriend" />
        <meta name="author" content="Cannafriend Team" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="alternate" hrefLang="es" href="https://cannafriend.app/" />
        <link rel="alternate" hrefLang="en" href="https://cannafriend.app/" />
        <link rel="alternate" hrefLang="x-default" href="https://cannafriend.app/" />
        <script
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function(){
                    navigator.serviceWorker.register('/sw.js').then(function(reg){
                      // Listen for skip waiting messages
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
      </head>
      <body className={inter.className}>
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
