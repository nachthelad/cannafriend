"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { Plant } from "@/types";
import { formatDateWithLocale } from "@/lib/utils";
import { Leaf, Calendar, Droplet, Zap, Scissors } from "lucide-react";
import type { LogEntry } from "@/types";

interface PlantCardProps {
  plant: Plant;
  lastWatering?: LogEntry;
  lastFeeding?: LogEntry;
  lastTraining?: LogEntry;
  compact?: boolean;
  detailed?: boolean;
}

export function PlantCard({
  plant,
  lastWatering,
  lastFeeding,
  lastTraining,
  compact = false,
  detailed = false,
}: PlantCardProps) {
  const { t, i18n } = useTranslation(["plants", "common", "journal"]);
  const language = i18n.language;
  const router = useRouter();

  const handleClick = () => {
    router.push(`/plants/${plant.id}`);
  };

  return (
    <Card
      className="group overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
      onClick={handleClick}
    >
      <div className="relative aspect-[4/3] sm:aspect-video">
        {plant.coverPhoto ? (
          <Image
            src={plant.coverPhoto}
            alt={`${plant.name} - ${t("plantCard.coverPhoto")}`}
            fill
            className="object-cover transition-transform duration-300"
            loading="lazy"
          />
        ) : plant.photos && plant.photos.length > 0 ? (
          <Image
            src={plant.photos[0]}
            alt={`${plant.name} - ${t("plantCard.coverPhoto")}`}
            fill
            className="object-cover transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Leaf className="h-16 w-16 text-white opacity-50" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <h3 className="text-white text-lg font-semibold drop-shadow">
            {plant.name}
          </h3>
        </div>
      </div>
      {!compact && (
        <>
          <CardContent className="pb-2">
            {detailed ? (
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={plant.seedType === "autoflowering" ? "default" : "outline"}
                >
                  {plant.seedType === "autoflowering"
                    ? t("newPlant.autoflowering")
                    : t("newPlant.photoperiodic")}
                </Badge>
                <Badge variant="outline">
                  {plant.growType === "indoor"
                    ? t("newPlant.indoor")
                    : t("newPlant.outdoor")}
                </Badge>
                {plant.growType === "indoor" && plant.lightSchedule && (
                  <Badge variant="outline">{plant.lightSchedule}</Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center text-sm text-muted-foreground">
                <Badge variant="outline" className="mr-2">
                  {plant.growType === "indoor"
                    ? t("newPlant.indoor")
                    : t("newPlant.outdoor")}
                </Badge>
                {plant.growType === "indoor" && plant.lightSchedule && (
                  <Badge variant="outline">{plant.lightSchedule}</Badge>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0 text-xs text-muted-foreground">
            <div className="space-y-1">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {plant.plantingDate &&
                  formatDateWithLocale(plant.plantingDate, "PPP", language)}
              </div>
              <div className="flex items-center">
                <Droplet className="h-3 w-3 mr-1" />
                {lastWatering ? (
                  <span>
                    {t("plantCard.lastWatering")}: {lastWatering.amount}ml (
                    {t(`watering.${lastWatering.method}`, { ns: "journal" })})
                  </span>
                ) : (
                  <span>{t("plantCard.noWateringRecords")}</span>
                )}
              </div>
              <div className="flex items-center">
                <Zap className="h-3 w-3 mr-1" />
                {lastFeeding ? (
                  <span>
                    {t("plantCard.lastFeeding")}: {lastFeeding.npk} (
                    {lastFeeding.amount}ml/L)
                  </span>
                ) : (
                  <span>{t("plantCard.noFeedingRecords")}</span>
                )}
              </div>
              <div className="flex items-center">
                <Scissors className="h-3 w-3 mr-1" />
                {lastTraining ? (
                  <span>
                    {t("plantCard.lastTraining")}:{" "}
                    {t(`training.${lastTraining.method}`, { ns: "journal" })}
                  </span>
                ) : (
                  <span>{t("plantCard.noTrainingRecords")}</span>
                )}
              </div>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
