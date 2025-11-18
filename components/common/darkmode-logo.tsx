"use client";

import type { LogoProps } from "@/types/common";
import { cn } from "@/lib/utils";

const DARK_MODE_LOGO_SRC = "/favicon-96x96.png";

function getSizeStyle(size?: number | string) {
  if (size === undefined) return undefined;
  if (typeof size === "number") {
    return { width: `${size}px`, height: `${size}px` };
  }
  return { width: size, height: size };
}

/**
 * Dedicated logo component that renders the dark-mode optimized PNG.
 * Useful on dark surfaces (sidebar, dark browser tabs) where the default SVG keeps a white background.
 */
export function DarkModeLogo({
  size = 24,
  className,
  style,
  "aria-label": ariaLabel,
  ...props
}: LogoProps) {
  const sizeStyle = getSizeStyle(size);

  return (
    <span
      role="img"
      aria-label={ariaLabel ?? "Cannafriend logo"}
      {...props}
      className={cn("inline-flex items-center justify-center", className)}
      style={{ ...sizeStyle, ...style }}
    >
      <img
        src={DARK_MODE_LOGO_SRC}
        alt=""
        aria-hidden="true"
        className="block h-full w-full object-contain"
      />
    </span>
  );
}

export default DarkModeLogo;
