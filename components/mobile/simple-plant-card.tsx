"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { SimplePlantCardProps } from "@/types";
import { Leaf } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { PLANT_STATUS } from "@/lib/plant-config";

import Link from "next/link";

export function SimplePlantCard({
  plant,
  language,
  viewMode = "grid",
  variant = "default",
  showGrowType = false,
  hideSeedType = false,
  aspectRatio,
  className,
}: SimplePlantCardProps) {
  const { t } = useTranslation(["plants", "common"]);
  const isOverlay = variant === "overlay";

  if (viewMode === "list") {
    return (
      <Link
        href={`/plants/${plant.id}`}
        className={cn(
          "relative overflow-hidden rounded-lg cursor-pointer transition-all active:scale-95 bg-card flex",
          isOverlay && "md:hover:-translate-y-0.5 md:hover:shadow-lg",
          className
        )}
        lang={language}
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
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "text-xs w-fit",
                isOverlay && "bg-emerald-500/10 text-emerald-700"
              )}
            >
              {plant.seedType === "autoflowering"
                ? t("seedType.autoflowering", { ns: "plants" })
                : t("seedType.photoperiodic", { ns: "plants" })}
            </Badge>
            {plant.status === PLANT_STATUS.ENDED && (
              <Badge variant="destructive" className="text-xs w-fit">
                {t("status.ended", { ns: "plants" })}
              </Badge>
            )}
            {showGrowType && (
              <Badge variant="outline" className="text-xs w-fit">
                {plant.growType === "indoor"
                  ? t("growType.indoor", { ns: "plants" })
                  : t("growType.outdoor", { ns: "plants" })}
              </Badge>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/plants/${plant.id}`}
      className={cn(
        "relative overflow-hidden rounded-lg cursor-pointer transition-all active:scale-95 bg-card block",
        isOverlay && "md:hover:-translate-y-0.5 md:hover:shadow-lg",
        className
      )}
      lang={language}
    >
      {/* Plant Image */}
      <div
        className={cn(
          "relative w-full",
          aspectRatio === "square"
            ? "aspect-square"
            : aspectRatio === "video"
            ? "aspect-video"
            : aspectRatio === "auto"
            ? "aspect-auto"
            : cn("aspect-square", isOverlay && "md:aspect-[4/3]")
        )}
      >
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
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3",
          isOverlay && "p-2 backdrop-blur-[1px]"
        )}
      >
        <h3 className="text-white font-semibold text-sm mb-1 leading-tight">
          {plant.name}
        </h3>
        <div className="flex flex-col items-start gap-1 md:flex-row md:items-center md:gap-2">
          {!hideSeedType && (
            <Badge
              variant="secondary"
              className={cn(
                "text-xs bg-white/20 text-white border-white/30 w-fit",
                isOverlay && "bg-white/25 text-white"
              )}
            >
              {plant.seedType === "autoflowering"
                ? t("seedType.autoflowering", { ns: "plants" })
                : t("seedType.photoperiodic", { ns: "plants" })}
            </Badge>
          )}
          {plant.status === PLANT_STATUS.ENDED && (
            <Badge className="text-xs bg-red-500/80 text-white border-transparent w-fit">
              {t("status.ended", { ns: "plants" })}
            </Badge>
          )}
          {showGrowType && (
            <Badge
              variant="outline"
              className="text-xs bg-black/30 text-white border-white/40 w-fit"
            >
              {plant.growType === "indoor"
                ? t("growType.indoor", { ns: "plants" })
                : t("growType.outdoor", { ns: "plants" })}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
