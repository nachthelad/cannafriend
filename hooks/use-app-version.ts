"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type VersionInfo = {
  version: string;
  buildTime: string;
};

/**
 * useAppVersion
 * Detects if a newer deployment is available by comparing the baked build
 * metadata with the server's current metadata from /api/version.
 */
export function useAppVersion(pollIntervalMs: number = 60_000) {
  const current: VersionInfo = useMemo(
    () => ({
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0",
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? "",
    }),
    []
  );

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [server, setServer] = useState<VersionInfo | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as VersionInfo;
        if (cancelled) return;
        setServer(data);
        // Compare by version first, then fallback to buildTime
        if (
          (data.version && data.version !== current.version) ||
          (!!data.buildTime && data.buildTime !== current.buildTime)
        ) {
          setUpdateAvailable(true);
        }
      } catch {
        // ignore network errors
      }
    };

    // Initial check
    check();

    // Polling
    if (pollIntervalMs > 0) {
      timerRef.current = setInterval(check, pollIntervalMs);
    }

    // Check on tab focus (helps prompt shortly after deployment)
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("focus", onFocus);
    };
  }, [current.buildTime, current.version, pollIntervalMs]);

  const reload = () => {
    // Force a hard reload to ensure new assets are used
    window.location.reload();
  };

  const dismiss = () => setUpdateAvailable(false);

  return { current, server, updateAvailable, reload, dismiss } as const;
}

