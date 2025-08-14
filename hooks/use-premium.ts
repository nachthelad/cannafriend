"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Email allowlist removed; premium is controlled via custom claim `premium` or a local dev override.

/**
 * Premium/Access hook for gating premium-only features.
 * - Enables access if:
 *   a) localStorage flag `cf_premium` is "1" (manual override), OR
 *   b) the authenticated user's ID token has custom claim `premium: true`
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

    // Subscribe to auth and read the custom claim
    const unsub = onAuthStateChanged(auth, async (user) => {
      let hasClaim = false;
      try {
        if (user) {
          const token = await user.getIdTokenResult(true);
          hasClaim = Boolean((token.claims as any)?.premium);
        }
      } catch {}
      localPremium = readLocal();
      setIsPremium(Boolean(localPremium || hasClaim));
    });

    return () => unsub();
  }, []);

  return { isPremium } as const;
}
