"use client";

import { useContext } from "react";
import { LanguageContext } from "@/components/providers/language-provider";

export function useTranslation() {
  const { t, language, setLanguage } = useContext(LanguageContext);
  return { t, language, setLanguage } as const;
}
