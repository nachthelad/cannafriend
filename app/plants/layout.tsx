import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Mis Plantas | Cannafriend",
  robots: { index: false, follow: false },
};

export default function PlantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
