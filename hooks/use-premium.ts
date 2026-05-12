"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { hasLocalPremiumOverride, resolvePremiumState } from "@/lib/premium-state";

// Email allowlist removed; premium is controlled via custom claim `premium` or a local dev override.

/**
 * Premium/Access hook for gating premium-only features.
 * - Enables access if:
 *   a) localStorage flag `cf_premium_v1` is "1" (manual override), OR
 *   b) the authenticated user's ID token has custom claim `premium: true`
 */
export function usePremium() {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [premiumUntil, setPremiumUntil] = useState<number | null>(null);
  const [source, setSource] = useState<
    "admin" | "local_override" | "mercadopago" | "stripe" | "unknown"
  >("unknown");

  useEffect(() => {
    const localPremium = hasLocalPremiumOverride();
    const initialState = resolvePremiumState(null, localPremium);
    setIsPremium(initialState.isPremium);
    setPremiumUntil(initialState.premiumUntil);
    setSource(initialState.source);

    // Subscribe to auth and read the custom claim
    const unsub = onAuthStateChanged(auth, async (user) => {
      let state = resolvePremiumState(null, hasLocalPremiumOverride());
      try {
        if (user) {
          const token = await user.getIdTokenResult(true);
          state = resolvePremiumState(token.claims as any, hasLocalPremiumOverride());
        }
      } catch {}
      setIsPremium(state.isPremium);
      setPremiumUntil(state.premiumUntil);
      setSource(state.source);
    });

    return () => unsub();
  }, []);

  return { isPremium, premiumUntil, source } as const;
}
