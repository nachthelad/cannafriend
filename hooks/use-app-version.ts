"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const [hasReloaded, setHasReloaded] = useState(false);
  const [server, setServer] = useState<VersionInfo | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const reloadTriggeredRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // Skip update checking in development
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    const check = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as VersionInfo;
        if (cancelled) return;
        setServer(data);
        // Prefer semantic version comparison; fallback to buildTime only if version missing
        const versionDiffers = Boolean(
          data.version && current.version && data.version !== current.version
        );
        const useBuildTimeFallback = !data.version || !current.version;
        const buildTimeDiffers = Boolean(
          useBuildTimeFallback && data.buildTime && data.buildTime !== current.buildTime
        );
        setUpdateAvailable(versionDiffers || buildTimeDiffers);
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

  const reload = useCallback(async () => {
    if (reloadTriggeredRef.current) return;
    reloadTriggeredRef.current = true;
    setHasReloaded(true);
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.update().catch(() => {})));
        for (const reg of regs) {
          const sw = reg.waiting || reg.installing || reg.active;
          if (sw) {
            sw.postMessage({ type: 'SKIP_WAITING' });
          }
        }
        // Wait briefly for controller change
        await new Promise<void>((resolve) => {
          const t = setTimeout(() => resolve(), 500);
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            clearTimeout(t);
            resolve();
          }, { once: true });
        });
      }
    } catch {
      // ignore
    } finally {
      // Reload with cache-busting query to avoid stale caches/proxies
      const url = new URL(window.location.href);
      url.searchParams.set('_v', String(Date.now()));
      window.location.replace(url.toString());
    }
  }, []);

  const dismiss = () => setUpdateAvailable(false);

  return {
    current,
    server,
    updateAvailable,
    reload,
    dismiss,
    hasReloaded,
  } as const;
}
