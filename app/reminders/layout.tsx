import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Recordatorios | Cannafriend",
  robots: { index: false, follow: false },
};

export default function RemindersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
