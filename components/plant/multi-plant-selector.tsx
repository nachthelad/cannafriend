"use client";

import Image from "next/image";

import { SimplePlantCard } from "@/components/mobile/simple-plant-card";
import { Check, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plant } from "@/types";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  productSelectableActiveClass,
  productSelectableIdleClass,
} from "@/features/shared/surfaces/product/product-nav-item-styles";

interface MultiPlantSelectorProps {
  plants: Plant[];
  selectedPlantIds: string[];
  onSelectionChange: (ids: string[]) => void;
  language?: string;
  className?: string;
  variant?: "carousel" | "desktop-grid";
}

export function MultiPlantSelector({
  plants,
  selectedPlantIds,
  onSelectionChange,
  language,
  className,
  variant = "carousel",
}: MultiPlantSelectorProps) {
  const { t } = useTranslation(["common", "plants"]);
  const togglePlant = (plantId: string) => {
    if (selectedPlantIds.includes(plantId)) {
      onSelectionChange(selectedPlantIds.filter((id) => id !== plantId));
    } else {
      onSelectionChange([...selectedPlantIds, plantId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(plants.map((p) => p.id));
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  const allSelected =
    plants.length > 0 && selectedPlantIds.length === plants.length;

  if (variant === "desktop-grid") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {t("selectedCount", { ns: "common", count: selectedPlantIds.length })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={allSelected ? deselectAll : selectAll}
            className="h-8 rounded-full px-3 text-xs font-medium"
          >
            {allSelected
              ? t("deselectAll", { ns: "common" })
              : t("selectAll", { ns: "common" })}
          </Button>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {plants.map((plant) => {
            const isSelected = selectedPlantIds.includes(plant.id);

            return (
              <button
                key={plant.id}
                type="button"
                onClick={() => togglePlant(plant.id)}
                className={cn(
                  "group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-2.5 text-left transition-[border-color,background-color,box-shadow,transform] duration-200",
                  isSelected
                    ? `${productSelectableActiveClass} shadow-[0_14px_36px_-24px_rgba(69,209,86,0.85)]`
                    : "border-white/8 bg-[var(--dashboard-panel)]/72 text-white/82 hover:border-white/14 hover:bg-[var(--dashboard-panel)]"
                )}
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-muted/50">
                  {plant.coverPhoto ? (
                    <Image
                      src={plant.coverPhoto}
                      alt={plant.name}
                      fill
                      className="object-cover"
                    />
                  ) : plant.photos?.[0] ? (
                    <Image
                      src={plant.photos[0]}
                      alt={plant.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <Leaf className="h-6 w-6 text-primary/60" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {plant.name}
                    </p>
                    <span
                      className={cn(
                        "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors",
                        isSelected
                          ? productSelectableActiveClass
                          : productSelectableIdleClass
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/8 bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground">
                      {plant.seedType === "autoflowering"
                        ? t("seedType.autoflowering", { ns: "plants" })
                        : t("seedType.photoperiodic", { ns: "plants" })}
                    </span>
                    <span className="rounded-full border border-white/8 bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground">
                      {plant.growType === "indoor"
                        ? t("growType.indoor", { ns: "plants" })
                        : t("growType.outdoor", { ns: "plants" })}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t("selectedCount", { ns: "common", count: selectedPlantIds.length })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={allSelected ? deselectAll : selectAll}
          className="h-8 text-xs font-medium"
        >
          {allSelected
            ? t("deselectAll", { ns: "common" })
            : t("selectAll", { ns: "common" })}
        </Button>
      </div>

      <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        <div className="flex w-max space-x-3 p-1">
          {plants.map((plant) => {
            const isSelected = selectedPlantIds.includes(plant.id);
            return (
              <div
                key={plant.id}
                onClick={() => togglePlant(plant.id)}
                className={cn(
                  "relative w-[88px] cursor-pointer transition-[border-color,box-shadow,transform,opacity] duration-200 rounded-lg overflow-hidden border-2 sm:w-[100px]",
                  isSelected
                    ? "border-[#45d156] bg-[rgba(69,209,86,0.12)] ring-2 ring-[rgba(69,209,86,0.18)] scale-[0.98]"
                    : "border-transparent opacity-80 hover:opacity-100 bg-background"
                )}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 z-20 rounded-full bg-[rgba(69,209,86,0.95)] p-1 shadow-sm backdrop-blur-sm">
                    <Check className="h-3 w-3 text-[#06110a]" />
                  </div>
                )}

                <div className="relative aspect-square w-full">
                  {/* Reuse SimplePlantCard visual but block the link */}
                  <div className="pointer-events-none">
                    <SimplePlantCard
                      plant={plant}
                      language={language || ""}
                      variant="overlay"
                      aspectRatio="square"
                      hideSeedType={true}
                      className="rounded-none border-0"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
