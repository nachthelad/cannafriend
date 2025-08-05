"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/use-translation"
import type { Plant } from "@/types"
import { format, parseISO } from "date-fns"
import { Leaf, Calendar } from "lucide-react"

interface PlantCardProps {
  plant: Plant
}

export function PlantCard({ plant }: PlantCardProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const handleClick = () => {
    router.push(`/plants/${plant.id}`)
  }

  return (
    <Card className="overflow-hidden cursor-pointer transition-all hover:shadow-md" onClick={handleClick}>
      <div className="h-32 bg-gradient-to-r from-green-400 to-emerald-500 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <Leaf className="h-16 w-16 text-white opacity-50" />
        </div>
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{plant.name}</CardTitle>
          <Badge variant={plant.seedType === "autoflower" ? "default" : "outline"}>
            {plant.seedType === "autoflower"
              ? t("newPlant.autoflower")
              : plant.seedType === "feminized"
                ? t("newPlant.feminized")
                : t("newPlant.regular")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{plant.strain}</p>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Badge variant="outline" className="mr-2">
            {plant.growType === "indoor" ? t("newPlant.indoor") : t("newPlant.outdoor")}
          </Badge>
          {plant.growType === "indoor" && plant.lightSchedule && <Badge variant="outline">{plant.lightSchedule}</Badge>}
        </div>
      </CardContent>
      <CardFooter className="pt-0 text-xs text-muted-foreground">
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          {plant.plantingDate && format(parseISO(plant.plantingDate), "PPP")}
        </div>
      </CardFooter>
    </Card>
  )
}
