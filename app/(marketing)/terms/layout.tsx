import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Términos de Servicio | Cannafriend",
  alternates: { canonical: "https://cannafriend.app/terms" },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
