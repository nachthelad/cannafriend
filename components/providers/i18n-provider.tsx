"use client";

import { useEffect, useState } from "react";
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
import esStrains from "@/lib/locales/es/strains.json";
import enStrains from "@/lib/locales/en/strains.json";
import esAnalyzePlant from "@/lib/locales/es/analyzePlant.json";
import enAnalyzePlant from "@/lib/locales/en/analyzePlant.json";
import enStash from "@/lib/locales/en/stash.json";
import esStash from "@/lib/locales/es/stash.json";

interface I18nProviderProps {
  children: React.ReactNode;
}

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
      strains: esStrains,
      analyzePlant: esAnalyzePlant,
      stash: esStash,
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
      strains: enStrains,
      analyzePlant: enAnalyzePlant,
      stash: enStash,
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
      "strains",
      "analyzePlant",
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
