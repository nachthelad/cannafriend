import Link from "next/link";
import { ROUTE_PRIVACY, ROUTE_TERMS } from "@/lib/routes";
import type { SettingsFooterProps } from "@/types";

export function SettingsFooter({
  privacyLabel,
  termsLabel,
}: SettingsFooterProps) {
  return (
    <footer className="mt-10 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
        <Link
          href={ROUTE_PRIVACY}
          className="hover:text-primary transition-colors"
        >
          {privacyLabel}
        </Link>
        <span className="text-muted-foreground">|</span>
        <Link
          href={ROUTE_TERMS}
          className="hover:text-primary transition-colors"
        >
          {termsLabel}
        </Link>
      </div>
    </footer>
  );
}
