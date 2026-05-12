"use client";

import { getDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { userDoc } from "@/lib/paths";
import type {
  SettingsData,
  SettingsPreferencesState,
  SubscriptionDetails,
} from "@/types";

export const DEFAULT_SETTINGS_PREFERENCES: SettingsPreferencesState = {
  timezone: "",
  darkMode: true,
};

export function getStoredSettingsPreferences(
  userId: string,
): SettingsPreferencesState {
  try {
    const raw = window.localStorage.getItem(`cf:userSettings:${userId}`);
    if (!raw) {
      return DEFAULT_SETTINGS_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<SettingsPreferencesState>;
    return {
      timezone:
        typeof parsed.timezone === "string"
          ? parsed.timezone
          : DEFAULT_SETTINGS_PREFERENCES.timezone,
      darkMode:
        typeof parsed.darkMode === "boolean"
          ? parsed.darkMode
          : DEFAULT_SETTINGS_PREFERENCES.darkMode,
    };
  } catch {
    return DEFAULT_SETTINGS_PREFERENCES;
  }
}

export async function fetchSettingsData(userId: string): Promise<SettingsData> {
  const userRef = userDoc(userId);
  const userSnap = await getDoc(userRef);

  let preferences = DEFAULT_SETTINGS_PREFERENCES;

  if (userSnap.exists()) {
    const data = userSnap.data() as Partial<SettingsPreferencesState>;
    preferences = {
      timezone:
        typeof data.timezone === "string"
          ? data.timezone
          : DEFAULT_SETTINGS_PREFERENCES.timezone,
      darkMode:
        typeof data.darkMode === "boolean"
          ? data.darkMode
          : DEFAULT_SETTINGS_PREFERENCES.darkMode,
    };
  }

  let subscription: SubscriptionDetails | null = null;

  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/mercadopago/subscription-status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        subscription = (await response.json()) as SubscriptionDetails;
      }
    } catch {
      subscription = null;
    }
  }

  return {
    preferences,
    subscription,
  };
}
