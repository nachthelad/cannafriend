"use client";

import type { LogoProps } from "@/types/common";
import { cn } from "@/lib/utils";
import Logo from "@/components/common/logo";
import DarkModeLogo from "@/components/common/darkmode-logo";

/**
 * Renders the standard logo in light mode and switches to the dark-mode asset automatically.
 * Useful for surfaces (landing page, mixed themes) where we need transparent artwork without manual duplication.
 */
export function ThemeLogo({ className, ...props }: LogoProps) {
  return (
    <>
      <Logo {...props} className={cn("dark:hidden", className)} />
      <DarkModeLogo
        {...props}
        className={cn("hidden dark:inline-flex", className)}
      />
    </>
  );
}

export default ThemeLogo;
