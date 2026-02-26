"use client";

import dynamic from "next/dynamic";

export const DeferredAnalytics = dynamic(
  () => import("@vercel/analytics/react").then((m) => m.Analytics),
  { ssr: false },
);
