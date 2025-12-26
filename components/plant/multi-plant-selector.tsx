"use client";

import { useState } from "react";
import { SimplePlantCard } from "@/components/mobile/simple-plant-card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plant } from "@/types";
import { Button } from "@/components/ui/button";

interface MultiPlantSelectorProps {
  plants: Plant[];
  selectedPlantIds: string[];
  onSelectionChange: (ids: string[]) => void;
  language?: string;
  className?: string;
}

export function MultiPlantSelector({
  plants,
  selectedPlantIds,
  onSelectionChange,
  language,
  className,
}: MultiPlantSelectorProps) {
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

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {selectedPlantIds.length} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={allSelected ? deselectAll : selectAll}
          className="h-8 text-xs font-medium"
        >
          {allSelected ? "Deselect All" : "Select All"}
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
                  "relative w-[100px] cursor-pointer transition-all duration-200 rounded-lg overflow-hidden border-2",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 scale-[0.98]"
                    : "border-transparent opacity-80 hover:opacity-100 bg-background"
                )}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 z-20 bg-primary/90 rounded-full p-1 shadow-sm backdrop-blur-sm">
                    <Check className="h-3 w-3 text-primary-foreground" />
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
