import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { UpdateProvider } from "@/components/providers/update-provider";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"], display: "swap", preload: true });

export const metadata: Metadata = {
  title: "Cannafriend - Plant Growth Tracker & Journal",
  description:
    "Track your plant growth and maintenance with detailed logging, environmental monitoring, and journal features. Professional plant cultivation tracking app.",
  keywords:
    "plant growth, plant tracker, cultivation journal, plant care, growth monitoring, plant management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cannafriend",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cannafriend" />
        <meta name="author" content="Cannafriend Team" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
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
        <I18nProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <UpdateProvider>
              {children}
              <Toaster />
              <Analytics />
            </UpdateProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
