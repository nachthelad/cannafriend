"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Hardcoded allowlist for early access. Emails should be lowercased.
// Edit this array to add or remove users with access to premium-gated features.
const ALLOWED_EMAILS: string[] = [
  // "user@example.com","
  "nacho.vent@gmail.com",
  "devpala@gmail.com",
];

/**
 * Premium/Access hook for gating premium-only features.
 * - Enables access if:
 *   a) localStorage flag `cf_premium` is "1" (manual override), OR
 *   b) the authenticated user's email is in the ALLOWED_EMAILS list
 */
export function usePremium() {
  const [isPremium, setIsPremium] = useState<boolean>(false);

  useEffect(() => {
    const readLocal = () => {
      try {
        return (
          typeof window !== "undefined" &&
          localStorage.getItem("cf_premium") === "1"
        );
      } catch {
        return false;
      }
    };

    // Initial local flag
    let localPremium = readLocal();
    setIsPremium(localPremium);

    // Subscribe to auth to check email allowlist
    const unsub = onAuthStateChanged(auth, (user) => {
      const email = user?.email?.toLowerCase() ?? null;
      const emailAllowed = email ? ALLOWED_EMAILS.includes(email) : false;
      localPremium = readLocal();
      setIsPremium(Boolean(localPremium || emailAllowed));
    });

    return () => unsub();
  }, []);

  return { isPremium } as const;
}
