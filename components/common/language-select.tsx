"use client";

import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSelect({ ariaLabel }: { ariaLabel?: string }) {
  const { i18n } = useTranslation(["common"]);
  const language = i18n.language;
  const setLanguage = (lang: string) => i18n.changeLanguage(lang);

  const getLanguageDisplay = (lang: string) => {
    switch (lang) {
      case "es":
        return "Español";
      case "en":
        return "English";
      default:
        return "Español"; // Default to Spanish
    }
  };

  return (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger className="w-auto min-w-[120px]" aria-label={ariaLabel}>
        <SelectValue placeholder="Español" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="es">Español</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  );
}