"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/use-translation"
import type { Plant } from "@/types"
import { format, parseISO, differenceInDays } from "date-fns"
import { Calendar, Leaf, Sun, Moon } from "lucide-react"

interface PlantDetailsProps {
  plant: Plant
}

export function PlantDetails({ plant }: PlantDetailsProps) {
  const { t } = useTranslation()

  const daysSincePlanting = plant.plantingDate ? differenceInDays(new Date(), parseISO(plant.plantingDate)) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("plantPage.details")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">{t("newPlant.strain")}</div>
            <div className="flex items-center">
              <Leaf className="h-4 w-4 mr-2 text-primary" />
              <span>{plant.strain}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t("newPlant.seedType")}</div>
            <div>
              <Badge variant={plant.seedType === "autoflower" ? "default" : "outline"}>
                {plant.seedType === "autoflower"
                  ? t("newPlant.autoflower")
                  : plant.seedType === "feminized"
                    ? t("newPlant.feminized")
                    : t("newPlant.regular")}
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
              <span>{plant.growType === "indoor" ? t("newPlant.indoor") : t("newPlant.outdoor")}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t("newPlant.plantingDate")}</div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <span>{plant.plantingDate && format(parseISO(plant.plantingDate), "PPP")}</span>
            </div>
          </div>

          {plant.growType === "indoor" && plant.seedType !== "autoflower" && plant.lightSchedule && (
            <div className="space-y-2">
              <div className="text-sm font-medium">{t("newPlant.lightSchedule")}</div>
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
        </div>
      </CardContent>
    </Card>
  )
}
