import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Diario de Cultivo | Cannafriend",
  robots: { index: false, follow: false },
};

export default function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
