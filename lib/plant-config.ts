// Plant configuration and constants
// This file centralizes all plant-related enums, constants, and utilities

// Plant seed types
export const SEED_TYPES = {
  AUTOFLOWERING: "autoflowering",
  PHOTOPERIODIC: "photoperiodic",
} as const;

export type SeedType = (typeof SEED_TYPES)[keyof typeof SEED_TYPES];

// Plant grow types
export const GROW_TYPES = {
  INDOOR: "indoor",
  OUTDOOR: "outdoor",
} as const;

export type GrowType = (typeof GROW_TYPES)[keyof typeof GROW_TYPES];

// Plant lifecycle status
export const PLANT_STATUS = {
  GROWING: "growing",
  ENDED: "ended",
} as const;

export type PlantStatus = (typeof PLANT_STATUS)[keyof typeof PLANT_STATUS];

// Light schedules
export const LIGHT_SCHEDULES = {
  VEGETATIVE: "18/6",
  FLOWERING: "12/12",
} as const;

// Light schedule can be any free-text string like "20/4", "18/6", "24/0", "12/12"
export type LightSchedule = string;

// Light schedule options for UI
export const LIGHT_SCHEDULE_OPTIONS = [
  {
    value: LIGHT_SCHEDULES.VEGETATIVE,
    label: "vegetative", // Translation key
    description: "18/6",
  },
  {
    value: LIGHT_SCHEDULES.FLOWERING,
    label: "flowering", // Translation key
    description: "12/12",
  },
] as const;

// Utility functions
export const isAutoflowering = (seedType: SeedType): boolean => {
  return seedType === SEED_TYPES.AUTOFLOWERING;
};

export const isIndoor = (growType: GrowType): boolean => {
  return growType === GROW_TYPES.INDOOR;
};

export const requiresLightSchedule = (
  seedType: SeedType,
  growType: GrowType
): boolean => {
  return isIndoor(growType) && !isAutoflowering(seedType);
};

// Validation helpers
export const isValidSeedType = (value: string): value is SeedType => {
  return Object.values(SEED_TYPES).includes(value as SeedType);
};

export const isValidGrowType = (value: string): value is GrowType => {
  return Object.values(GROW_TYPES).includes(value as GrowType);
};

export const isValidLightSchedule = (value: string): value is LightSchedule => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  // Accept formats like 20/4, 18/6, 24/0, 12/12
  return /^\d{1,2}\/\d{1,2}$/.test(trimmed);
};
