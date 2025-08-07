"use client";

import { useContext } from "react";
import { LanguageContext } from "@/components/providers/language-provider";

type Lang = "es" | "en";
export type TFunction = (key: string) => string;
export interface UseTranslationValue {
  language: Lang;
  setLanguage: (language: Lang) => void;
  t: TFunction;
}

export const useTranslation = (): UseTranslationValue => {
  return useContext(LanguageContext) as UseTranslationValue;
};
