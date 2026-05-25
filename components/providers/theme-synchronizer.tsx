"use client";

import { useEffect } from "react";

import { applyTheme } from "@/lib/theme-utils";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeSynchronizer() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) {
      return;
    }

    applyTheme(resolvedTheme === "dark");
  }, [resolvedTheme]);

  return null;
}
