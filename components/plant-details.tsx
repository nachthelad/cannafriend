"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";
import type { Plant } from "@/types";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  Calendar,
  Leaf,
  Sun,
  Moon,
  Droplet,
  Zap,
  Scissors,
} from "lucide-react";
import type { LogEntry } from "@/types";

interface PlantDetailsProps {
  plant: Plant;
  lastWatering?: LogEntry;
  lastFeeding?: LogEntry;
  lastTraining?: LogEntry;
}

export function PlantDetails({
  plant,
  lastWatering,
  lastFeeding,
  lastTraining,
}: PlantDetailsProps) {
  const { t } = useTranslation();

  const daysSincePlanting = plant.plantingDate
    ? differenceInDays(new Date(), parseISO(plant.plantingDate))
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("plantPage.details")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">{t("newPlant.seedType")}</div>
            <div>
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
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t("newPlant.growType")}</div>
            <div className="flex items-center">
              {plant.growType === "indoor" ? (
                <Sun className="h-4 w-4 mr-2 text-primary" />
              ) : (
                <Moon className="h-4 w-4 mr-2 text-primary" />
              )}
              <span>
                {plant.growType === "indoor"
                  ? t("newPlant.indoor")
                  : t("newPlant.outdoor")}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">
              {t("newPlant.plantingDate")}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <span>
                {plant.plantingDate &&
                  format(parseISO(plant.plantingDate), "PPP")}
              </span>
            </div>
          </div>

          {plant.growType === "indoor" &&
            plant.seedType !== "autofloreciente" &&
            plant.lightSchedule && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  {t("newPlant.lightSchedule")}
                </div>
                <div className="flex items-center">
                  <Sun className="h-4 w-4 mr-2 text-primary" />
                  <span>{plant.lightSchedule}</span>
                </div>
              </div>
            )}

          <div className="space-y-2">
            <div className="text-sm font-medium">{t("plantPage.age")}</div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <span>
                {daysSincePlanting} {t("plantPage.days")}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">
              {t("plantPage.lastWatering")}
            </div>
            <div className="flex items-center">
              <Droplet className="h-4 w-4 mr-2 text-primary" />
              <span>
                {lastWatering
                  ? `${lastWatering.amount}ml (${t(
                      `watering.${lastWatering.method}`
                    )})`
                  : t("plantPage.noWateringRecords")}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">
              {t("plantPage.lastFeeding")}
            </div>
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-2 text-primary" />
              <span>
                {lastFeeding
                  ? `${lastFeeding.npk} (${lastFeeding.amount}ml/L)`
                  : t("plantPage.noFeedingRecords")}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">
              {t("plantPage.lastTraining")}
            </div>
            <div className="flex items-center">
              <Scissors className="h-4 w-4 mr-2 text-primary" />
              <span>
                {lastTraining
                  ? t(`training.${lastTraining.method}`)
                  : t("plantPage.noTrainingRecords")}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
