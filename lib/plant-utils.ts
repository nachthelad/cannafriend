import type { Plant } from "@/types";
import type { PlantStatus } from "@/lib/plant-config";
import { PLANT_STATUS } from "@/lib/plant-config";

/**
 * Normalizes Firestore plant documents to ensure status defaults are present.
 * Older documents may not include lifecycle metadata, so we coerce them here.
 */
export const normalizePlant = (data: any, id: string): Plant => {
  const { status, endedAt, ...rest } = data ?? {};

  const normalizedStatus: PlantStatus =
    (status as PlantStatus) ?? PLANT_STATUS.GROWING;

  return {
    id,
    ...rest,
    status: normalizedStatus,
    endedAt: endedAt ?? null,
  } as Plant;
};

export const isPlantGrowing = (plant: Plant): boolean =>
  plant.status === PLANT_STATUS.GROWING;
