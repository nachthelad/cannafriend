"use client";

import { track } from "@vercel/analytics";

export type AnalyticsEventName =
  | "signup_completed"
  | "onboarding_completed"
  | "plant_created"
  | "first_log_created"
  | "reminder_created"
  | "returned_within_7_days"
  | "dashboard_fast_log_opened"
  | "dashboard_fast_log_completed"
  | "assistant_free_taste_started"
  | "assistant_free_taste_completed"
  | "premium_checkout_started"
  | "premium_checkout_returned"
  | "premium_status_synced";

export type AnalyticsPayload = Record<string, string | number | boolean | null>;

export function trackEvent(
  name: AnalyticsEventName,
  payload: AnalyticsPayload = {},
): void {
  try {
    track(name, payload);
  } catch {
    // Analytics must never block product flows.
  }
}

export function markActivationCandidate(userId: string): void {
  try {
    const key = `cf:activation:${userId}`;
    const existing = window.localStorage.getItem(key);
    if (existing) {
      return;
    }
    window.localStorage.setItem(
      key,
      JSON.stringify({
        firstLogAt: new Date().toISOString(),
        returnedTracked: false,
      }),
    );
  } catch {
    // Ignore storage failures.
  }
}

export function trackReturnedWithin7Days(userId: string): void {
  try {
    const key = `cf:activation:${userId}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as {
      firstLogAt?: string;
      returnedTracked?: boolean;
    };

    if (!parsed.firstLogAt || parsed.returnedTracked) {
      return;
    }

    const firstLogAt = new Date(parsed.firstLogAt).getTime();
    if (Number.isNaN(firstLogAt)) {
      return;
    }

    const now = Date.now();
    const elapsedMs = now - firstLogAt;
    const minimumReturnGapMs = 60 * 60 * 1000;
    const maxWindowMs = 7 * 24 * 60 * 60 * 1000;

    if (elapsedMs < minimumReturnGapMs || elapsedMs > maxWindowMs) {
      return;
    }

    trackEvent("returned_within_7_days");
    window.localStorage.setItem(
      key,
      JSON.stringify({
        ...parsed,
        returnedTracked: true,
      }),
    );
  } catch {
    // Ignore storage failures.
  }
}
