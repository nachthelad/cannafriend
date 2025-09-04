"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { Plant, LogEntry } from "@/types";
import { formatDateWithLocale } from "@/lib/utils";
import { Leaf, Calendar, Droplet, Zap, Scissors } from "lucide-react";

interface MobilePlantCardProps {
  plant: Plant;
  lastWatering?: LogEntry;
  lastFeeding?: LogEntry;
  lastTraining?: LogEntry;
  lastEnvironment?: LogEntry;
  onDelete?: (plant: Plant) => void;
  onEdit?: (plant: Plant) => void;
  onAddLog?: (plant: Plant) => void;
  language: string;
}

export function MobilePlantCard({
  plant,
  lastWatering,
  lastFeeding,
  lastTraining,
  language,
}: MobilePlantCardProps) {
  const { t } = useTranslation(["plants", "common"]);
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
            alt={`${plant.name} - ${t("plantCard.coverPhoto", {
              ns: "plants",
            })}`}
            fill
            className="object-cover transition-transform duration-300"
            loading="lazy"
          />
        ) : plant.photos && plant.photos.length > 0 ? (
          <Image
            src={plant.photos[0]}
            alt={`${plant.name} - ${t("plantCard.coverPhoto", {
              ns: "plants",
            })}`}
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
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <h3 className="text-white text-lg font-semibold drop-shadow">
            {plant.name}
          </h3>
          <Badge
            variant={plant.seedType === "autoflowering" ? "default" : "outline"}
            className="bg-white/90 text-black backdrop-blur-sm"
          >
            {plant.seedType === "autoflowering"
              ? t("seedType.autoflowering", { ns: "plants" })
              : t("seedType.photoperiodic", { ns: "plants" })}
          </Badge>
        </div>
      </div>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Badge variant="outline" className="mr-2">
            {plant.growType === "indoor"
              ? t("growType.indoor", { ns: "plants" })
              : t("growType.outdoor", { ns: "plants" })}
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
                {t("plantCard.lastWatering", { ns: "plants" })}:{" "}
                {lastWatering.amount}ml (
                {t(`watering.${lastWatering.method}`, { ns: "journal" })})
              </span>
            ) : (
              <span>{t("plantCard.noWateringRecords", { ns: "plants" })}</span>
            )}
          </div>
          <div className="flex items-center">
            <Zap className="h-3 w-3 mr-1" />
            {lastFeeding ? (
              <span>
                {t("plantCard.lastFeeding", { ns: "plants" })}:{" "}
                {lastFeeding.npk} ({lastFeeding.amount}ml/L)
              </span>
            ) : (
              <span>{t("plantCard.noFeedingRecords", { ns: "plants" })}</span>
            )}
          </div>
          <div className="flex items-center">
            <Scissors className="h-3 w-3 mr-1" />
            {lastTraining ? (
              <span>
                {t("plantCard.lastTraining", { ns: "plants" })}:{" "}
                {t(`training.${lastTraining.method}`, { ns: "journal" })}
              </span>
            ) : (
              <span>{t("plantCard.noTrainingRecords", { ns: "plants" })}</span>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
