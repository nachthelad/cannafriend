"use client";

import type { LogoProps, LogoVariant } from "@/types/common";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/favicon.svg";

function getSizeStyle(size?: number | string) {
  if (size === undefined) return undefined;
  if (typeof size === "number") {
    return { width: `${size}px`, height: `${size}px` };
  }
  return { width: size, height: size };
}

function getBadgeBg(variant: LogoVariant) {
  if (variant === "badgeDark") return "bg-slate-900";
  if (variant === "badgeLight") return "bg-white";
  return "bg-transparent";
}

/**
 * Cannafriend logo mark rendered from the new branded assets in /public.
 * Uses an inline-flex wrapper so the image can scale cleanly with arbitrary sizes.
 */
export function Logo({
  size = 24,
  variant = "mark",
  className,
  style,
  "aria-label": ariaLabel,
  ...props
}: LogoProps) {
  const sizeStyle = getSizeStyle(size);
  const isMark = variant === "mark";
  const badgePadding = isMark ? "" : "p-1";
  const badgeRadius = isMark ? "" : "rounded-xl";

  return (
    <span
      role="img"
      aria-label={ariaLabel ?? (isMark ? "Cannafriend logo" : "Cannafriend logo badge")}
      {...props}
      className={cn(
        "inline-flex items-center justify-center",
        badgePadding,
        badgeRadius,
        getBadgeBg(variant),
        className
      )}
      style={{ ...sizeStyle, ...style }}
    >
      <img
        src={LOGO_SRC}
        alt=""
        aria-hidden="true"
        className={cn(
          "block object-contain",
          isMark ? "h-full w-full" : "h-5/6 w-5/6"
        )}
      />
    </span>
  );
}

export default Logo;

export type { LogoVariant } from "@/types/common";
