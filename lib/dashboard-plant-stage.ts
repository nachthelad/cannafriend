import type { Plant } from "@/types";
import { calculateAgeInDays } from "@/lib/utils";

export type DashboardPlantStage = "flowering" | "seedling" | "vegetative";

export function getDashboardPlantStage(
  plant: Plant,
  hasFloweringLog: boolean,
): DashboardPlantStage {
  if (hasFloweringLog || plant.lightSchedule?.trim() === "12/12") {
    return "flowering";
  }

  return calculateAgeInDays(plant.plantingDate) <= 14
    ? "seedling"
    : "vegetative";
}
