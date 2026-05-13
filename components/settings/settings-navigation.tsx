"use client";

import { cn } from "@/lib/utils";
import type {
  SettingsNavigationProps,
} from "@/types";
import {
  productNavItemActiveClass,
  productNavItemBaseClass,
  productNavItemDestructiveIdleClass,
  productNavItemIdleClass,
} from "@/features/shared/surfaces/product/product-nav-item-styles";

export function SettingsNavigation({
  sections,
  activeSection,
  onSectionChange,
  navigationTitle,
}: SettingsNavigationProps) {
  const activeSectionEntry =
    sections.find((section) => section.id === activeSection) ?? sections[0];

  return (
    <div className="md:w-64 md:flex-shrink-0 md:self-start">
      {/* Mobile navigation */}
      <div className="md:hidden mb-6 overflow-x-auto">
        <div className="flex gap-2 rounded-[18px] border border-white/8 bg-[var(--dashboard-panel)]/80 p-2">
          {sections.map((section) => {
            const isActive = section.id === activeSectionEntry.id;
            const isDestructive = Boolean(section.isDestructive);
            return (
              <button
                key={`mobile-${section.id}`}
                type="button"
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-[14px] px-3 py-2 text-sm font-medium transition-[background-color,color]",
                  isActive
                    ? productNavItemActiveClass
                    : isDestructive
                      ? productNavItemDestructiveIdleClass
                      : "text-white/82 hover:bg-white/[0.04] hover:text-white"
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
        className="sticky top-24 hidden space-y-1 self-start rounded-[22px] border border-white/8 bg-[var(--dashboard-panel)]/72 p-2 md:block md:w-64"
      >
        {sections.map((section, index) => {
          const isActive = section.id === activeSectionEntry.id;
          const isDestructive = Boolean(section.isDestructive);
          const prevSection = sections[index - 1];
          const shouldAddSeparator =
            isDestructive && prevSection && !prevSection.isDestructive;

          return (
            <div key={section.id}>
              {shouldAddSeparator && (
                <div className="my-4 border-t border-white/8" />
              )}
              <button
                type="button"
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  productNavItemBaseClass,
                  "w-full text-left text-[0.94rem] md:cursor-pointer",
                  isActive
                    ? productNavItemActiveClass
                    : isDestructive
                      ? productNavItemDestructiveIdleClass
                      : productNavItemIdleClass
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
