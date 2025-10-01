"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

import { applyTheme } from "@/lib/theme-utils";

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
