"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";
import type { Plant } from "@/types";
import { formatDateWithLocale } from "@/lib/utils";
import { Leaf, Calendar, Droplet, Zap, Scissors } from "lucide-react";
import type { LogEntry } from "@/types";

interface PlantCardProps {
  plant: Plant;
  lastWatering?: LogEntry;
  lastFeeding?: LogEntry;
  lastTraining?: LogEntry;
}

export function PlantCard({
  plant,
  lastWatering,
  lastFeeding,
  lastTraining,
}: PlantCardProps) {
  const { t, language } = useTranslation();
  const router = useRouter();

  const handleClick = () => {
    router.push(`/plants/${plant.id}`);
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-md"
      onClick={handleClick}
    >
      <div className="h-32 relative">
        {plant.coverPhoto ? (
          <Image
            src={plant.coverPhoto}
            alt={`${plant.name} - ${t("plantCard.coverPhoto")}`}
            fill
            className="object-cover"
          />
        ) : plant.photos && plant.photos.length > 0 ? (
          <Image
            src={plant.photos[0]}
            alt={`${plant.name} - ${t("plantCard.coverPhoto")}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Leaf className="h-16 w-16 text-white opacity-50" />
            </div>
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{plant.name}</CardTitle>
          <Badge
            variant={
              plant.seedType === "autofloreciente" ? "default" : "outline"
            }
          >
            {plant.seedType === "autofloreciente"
              ? t("newPlant.autofloreciente")
              : t("newPlant.fotoperiodica")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
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
                {t(`watering.${lastWatering.method}`)})
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
                {t(`training.${lastTraining.method}`)}
              </span>
            ) : (
              <span>{t("plantCard.noTrainingRecords")}</span>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
