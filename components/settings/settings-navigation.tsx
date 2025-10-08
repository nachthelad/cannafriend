"use client";

import { cn } from "@/lib/utils";
import type {
  SettingsNavigationProps,
  SettingsSection,
  SettingsSectionId,
} from "@/types";

export function SettingsNavigation({
  sections,
  activeSection,
  onSectionChange,
  navigationTitle,
}: SettingsNavigationProps) {
  const activeSectionEntry =
    sections.find((section) => section.id === activeSection) ?? sections[0];

  return (
    <div className="md:w-64 md:flex-shrink-0">
      {/* Mobile navigation */}
      <div className="md:hidden mb-6 overflow-x-auto">
        <div className="flex gap-2 rounded-lg border border-border bg-card p-2">
          {sections.map((section) => {
            const isActive = section.id === activeSectionEntry.id;
            const isDestructive = Boolean(section.isDestructive);
            return (
              <button
                key={`mobile-${section.id}`}
                type="button"
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? isDestructive
                      ? "bg-destructive text-destructive-foreground shadow-sm"
                      : "bg-primary text-primary-foreground shadow-sm"
                    : isDestructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "hover:bg-muted"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{section.label}</span>
                {isActive ? (
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-current" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop navigation */}
      <nav
        aria-label={navigationTitle}
        className="sticky top-24 hidden space-y-1 border-r bg-card p-2 md:block min-h-[calc(100vh-12rem)]"
      >
        {sections.map((section, index) => {
          const isActive = section.id === activeSectionEntry.id;
          const isDestructive = Boolean(section.isDestructive);
          const isLastSection = index === sections.length - 1;
          const prevSection = sections[index - 1];
          const shouldAddSeparator =
            isDestructive && prevSection && !prevSection.isDestructive;

          return (
            <div key={section.id}>
              {shouldAddSeparator && (
                <div className="my-4 border-t border-border" />
              )}
              <button
                type="button"
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition-colors md:cursor-pointer",
                  isActive
                    ? isDestructive
                      ? "bg-destructive text-destructive-foreground shadow-sm"
                      : "bg-primary text-primary-foreground shadow-sm"
                    : isDestructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "hover:bg-muted"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{section.label}</span>
                {isActive ? (
                  <span className="ml-2 h-2 w-2 flex-shrink-0 rounded-full bg-current" />
                ) : null}
              </button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
