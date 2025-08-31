"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";
import type { Plant } from "@/types";
import { Leaf } from "lucide-react";
import { useRouter } from "next/navigation";

interface SimplePlantCardProps {
  plant: Plant;
  language: string;
  viewMode?: "grid" | "list";
}

export function SimplePlantCard({
  plant,
  language,
  viewMode = "grid",
}: SimplePlantCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleClick = () => {
    router.push(`/plants/${plant.id}`);
  };

  if (viewMode === "list") {
    return (
      <div
        className="relative overflow-hidden rounded-lg cursor-pointer transition-all active:scale-95 bg-card flex"
        onClick={handleClick}
      >
        {/* Plant Image */}
        <div className="relative w-20 h-20 shrink-0">
          {plant.coverPhoto ? (
            <Image
              src={plant.coverPhoto}
              alt={plant.name}
              fill
              className="object-cover rounded-l-lg"
            />
          ) : plant.photos && plant.photos.length > 0 ? (
            <Image
              src={plant.photos[0]}
              alt={plant.name}
              fill
              className="object-cover rounded-l-lg"
            />
          ) : (
            <div className="h-full bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/20 dark:to-emerald-800/20 flex items-center justify-center rounded-l-lg">
              <Leaf className="h-6 w-6 text-green-500/60" />
            </div>
          )}
        </div>
        
        {/* Plant Info */}
        <div className="flex-1 p-4 flex flex-col justify-center">
          <h3 className="font-semibold text-base truncate mb-1">
            {plant.name}
          </h3>
          <Badge
            variant="secondary"
            className="text-xs w-fit"
          >
            {plant.seedType === "autoflowering"
              ? t("seedType.autoflowering")
              : t("seedType.photoperiodic")}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-lg cursor-pointer transition-all active:scale-95 bg-card"
      onClick={handleClick}
    >
      {/* Plant Image */}
      <div className="relative aspect-square w-full">
        {plant.coverPhoto ? (
          <Image
            src={plant.coverPhoto}
            alt={plant.name}
            fill
            className="object-cover"
          />
        ) : plant.photos && plant.photos.length > 0 ? (
          <Image
            src={plant.photos[0]}
            alt={plant.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/20 dark:to-emerald-800/20 flex items-center justify-center">
            <Leaf className="h-12 w-12 text-green-500/60" />
          </div>
        )}
      </div>
      
      {/* Plant Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <h3 className="text-white font-semibold text-sm truncate mb-1">
          {plant.name}
        </h3>
        <Badge
          variant="secondary"
          className="text-xs bg-white/20 text-white border-white/30"
        >
          {plant.seedType === "autoflowering"
            ? t("seedType.autoflowering")
            : t("seedType.photoperiodic")}
        </Badge>
      </div>
    </div>
  );
}