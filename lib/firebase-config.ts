// Firebase configuration and path constants
// This file centralizes all Firebase-related paths, collection names, and utilities

// Collection names
export const COLLECTIONS = {
  USERS: "users",
  PLANTS: "plants",
  LOGS: "logs",
  ENVIRONMENT: "environment",
  REMINDERS: "reminders",
} as const;

// Storage paths
export const STORAGE_PATHS = {
  IMAGES: "images",
} as const;

// Path builders
export const buildUserPath = (userId: string): string => {
  return `${COLLECTIONS.USERS}/${userId}`;
};

export const buildPlantsPath = (userId: string): string => {
  return `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PLANTS}`;
};

export const buildPlantPath = (userId: string, plantId: string): string => {
  return `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PLANTS}/${plantId}`;
};

export const buildLogsPath = (userId: string, plantId: string): string => {
  return `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PLANTS}/${plantId}/${COLLECTIONS.LOGS}`;
};

export const buildLogPath = (
  userId: string,
  plantId: string,
  logId: string
): string => {
  return `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PLANTS}/${plantId}/${COLLECTIONS.LOGS}/${logId}`;
};

export const buildEnvironmentPath = (
  userId: string,
  plantId: string
): string => {
  return `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PLANTS}/${plantId}/${COLLECTIONS.ENVIRONMENT}`;
};

export const buildRemindersPath = (userId: string): string => {
  return `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.REMINDERS}`;
};

export const buildReminderPath = (
  userId: string,
  reminderId: string
): string => {
  return `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.REMINDERS}/${reminderId}`;
};

// Storage path builders
export const buildImageStoragePath = (
  userId: string,
  fileName: string
): string => {
  return `${STORAGE_PATHS.IMAGES}/${userId}/${fileName}`;
};

// Utility functions for path validation
export const isValidUserId = (userId: string): boolean => {
  return typeof userId === "string" && userId.length > 0;
};

export const isValidPlantId = (plantId: string): boolean => {
  return typeof plantId === "string" && plantId.length > 0;
};

export const isValidLogId = (logId: string): boolean => {
  return typeof logId === "string" && logId.length > 0;
};

export const isValidReminderId = (reminderId: string): boolean => {
  return typeof reminderId === "string" && reminderId.length > 0;
};
