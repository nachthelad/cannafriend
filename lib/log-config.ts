// Log types configuration and constants
// This file centralizes all log-related enums, constants, and utilities

// Log types
export const LOG_TYPES = {
  WATERING: "watering",
  FEEDING: "feeding",
  TRAINING: "training",
  ENVIRONMENT: "environment",
  NOTE: "note",
  FLOWERING: "flowering",
} as const;

export type LogType = (typeof LOG_TYPES)[keyof typeof LOG_TYPES];

// Watering methods
export const WATERING_METHODS = {
  TOP_WATERING: "topWatering",
  BOTTOM_WATERING: "bottomWatering",
  DRIP: "drip",
} as const;

export type WateringMethod =
  (typeof WATERING_METHODS)[keyof typeof WATERING_METHODS];

// Feeding types
export const FEEDING_TYPES = {
  ORGANIC: "organic",
  SYNTHETIC: "synthetic",
} as const;

export type FeedingType = (typeof FEEDING_TYPES)[keyof typeof FEEDING_TYPES];

// Training methods
export const TRAINING_METHODS = {
  TOPPING: "topping",
  LST: "lst",
  DEFOLIATION: "defoliation",
  SUPERCROPPING: "supercropping",
} as const;

export type TrainingMethod =
  (typeof TRAINING_METHODS)[keyof typeof TRAINING_METHODS];

// UI options for select components
export const LOG_TYPE_OPTIONS = [
  { value: LOG_TYPES.WATERING, label: "watering" },
  { value: LOG_TYPES.FEEDING, label: "feeding" },
  { value: LOG_TYPES.TRAINING, label: "training" },
  { value: LOG_TYPES.ENVIRONMENT, label: "environment" },
  { value: LOG_TYPES.FLOWERING, label: "flowering" },
  { value: LOG_TYPES.NOTE, label: "note" },
] as const;

export const WATERING_METHOD_OPTIONS = [
  { value: WATERING_METHODS.TOP_WATERING, label: "topWatering" },
  { value: WATERING_METHODS.BOTTOM_WATERING, label: "bottomWatering" },
  { value: WATERING_METHODS.DRIP, label: "drip" },
] as const;

export const FEEDING_TYPE_OPTIONS = [
  { value: FEEDING_TYPES.ORGANIC, label: "organic" },
  { value: FEEDING_TYPES.SYNTHETIC, label: "synthetic" },
] as const;

export const TRAINING_METHOD_OPTIONS = [
  { value: TRAINING_METHODS.TOPPING, label: "topping" },
  { value: TRAINING_METHODS.LST, label: "lst" },
  { value: TRAINING_METHODS.DEFOLIATION, label: "defoliation" },
  { value: TRAINING_METHODS.SUPERCROPPING, label: "supercropping" },
] as const;

// Utility functions
export const isValidLogType = (value: string): value is LogType => {
  return Object.values(LOG_TYPES).includes(value as LogType);
};

export const isValidWateringMethod = (
  value: string
): value is WateringMethod => {
  return Object.values(WATERING_METHODS).includes(value as WateringMethod);
};

export const isValidFeedingType = (value: string): value is FeedingType => {
  return Object.values(FEEDING_TYPES).includes(value as FeedingType);
};

export const isValidTrainingMethod = (
  value: string
): value is TrainingMethod => {
  return Object.values(TRAINING_METHODS).includes(value as TrainingMethod);
};

// Log type specific validation
export const requiresAmount = (logType: LogType): boolean => {
  return logType === LOG_TYPES.WATERING || logType === LOG_TYPES.FEEDING;
};

export const requiresMethod = (logType: LogType): boolean => {
  return logType === LOG_TYPES.WATERING || logType === LOG_TYPES.TRAINING;
};

export const requiresEnvironmentData = (logType: LogType): boolean => {
  return logType === LOG_TYPES.ENVIRONMENT;
};

export const requiresNPK = (logType: LogType): boolean => {
  return logType === LOG_TYPES.FEEDING;
};
