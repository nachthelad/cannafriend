import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Política de Privacidad | Cannafriend",
  alternates: { canonical: "https://cannafriend.app/privacy" },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
