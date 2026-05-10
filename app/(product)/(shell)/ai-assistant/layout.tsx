import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Cannafriend IA | Cannafriend",
  robots: { index: false, follow: false },
};

export default function AiAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
