"use client";

import { useEffect } from "react";
import type { I18nProviderProps } from "@/types";
import { initReactI18next } from "react-i18next";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation modules
import esCommon from "@/lib/locales/es/common.json";
import enCommon from "@/lib/locales/en/common.json";
import esAuth from "@/lib/locales/es/auth.json";
import enAuth from "@/lib/locales/en/auth.json";
import esValidation from "@/lib/locales/es/validation.json";
import enValidation from "@/lib/locales/en/validation.json";
import esDashboard from "@/lib/locales/es/dashboard.json";
import enDashboard from "@/lib/locales/en/dashboard.json";
import esNutrients from "@/lib/locales/es/nutrients.json";
import enNutrients from "@/lib/locales/en/nutrients.json";
import esPlants from "@/lib/locales/es/plants.json";
import enPlants from "@/lib/locales/en/plants.json";
import esOnboarding from "@/lib/locales/es/onboarding.json";
import enOnboarding from "@/lib/locales/en/onboarding.json";
import esJournal from "@/lib/locales/es/journal.json";
import enJournal from "@/lib/locales/en/journal.json";
import esReminders from "@/lib/locales/es/reminders.json";
import enReminders from "@/lib/locales/en/reminders.json";
import esNav from "@/lib/locales/es/nav.json";
import enNav from "@/lib/locales/en/nav.json";
import esSessions from "@/lib/locales/es/sessions.json";
import enSessions from "@/lib/locales/en/sessions.json";
import esAiAssistant from "@/lib/locales/es/aiAssistant.json";
import enAiAssistant from "@/lib/locales/en/aiAssistant.json";
import enStash from "@/lib/locales/en/stash.json";
import esStash from "@/lib/locales/es/stash.json";
import enLanding from "@/lib/locales/en/landing.json";
import esLanding from "@/lib/locales/es/landing.json";
import enPremium from "@/lib/locales/en/premium.json";
import esPremium from "@/lib/locales/es/premium.json";

// Initialize i18n synchronously to ensure consistency
if (typeof window === "undefined" || !i18n.isInitialized) {
  const resources = {
    es: {
      common: esCommon,
      auth: esAuth,
      validation: esValidation,
      dashboard: esDashboard,
      nutrients: esNutrients,
      plants: esPlants,
      onboarding: esOnboarding,
      journal: esJournal,
      reminders: esReminders,
      nav: esNav,
      sessions: esSessions,
      aiAssistant: esAiAssistant,
      stash: esStash,
      landing: esLanding,
      premium: esPremium,
    },
    en: {
      common: enCommon,
      auth: enAuth,
      validation: enValidation,
      dashboard: enDashboard,
      nutrients: enNutrients,
      plants: enPlants,
      onboarding: enOnboarding,
      journal: enJournal,
      reminders: enReminders,
      nav: enNav,
      sessions: enSessions,
      aiAssistant: enAiAssistant,
      stash: enStash,
      landing: enLanding,
      premium: enPremium,
    },
  };

  if (typeof window !== "undefined") {
    i18n.use(LanguageDetector);
  }

  i18n.use(initReactI18next).init({
    resources,
    lng: "es", // Default to Spanish for consistency
    fallbackLng: "es",
    defaultNS: "common",
    ns: [
      "common",
      "auth",
      "validation",
      "dashboard",
      "nutrients",
      "plants",
      "onboarding",
      "journal",
      "reminders",
      "nav",
      "sessions",
      "aiAssistant",
      "landing",
      "premium",
    ],

    interpolation: {
      escapeValue: false,
    },

    // Only use browser detection on client side
    ...(typeof window !== "undefined" && {
      detection: {
        order: ["localStorage", "htmlTag", "navigator"],
        caches: ["localStorage"],
      },
    }),

    debug: false, // Disable debug to reduce noise
  });
}

export function I18nProvider({ children }: I18nProviderProps) {
  return <>{children}</>;
}
