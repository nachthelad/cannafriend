import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Inventario | Cannafriend",
  robots: { index: false, follow: false },
};

export default function StashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
