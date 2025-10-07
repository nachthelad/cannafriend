import type { SeedType, GrowType, LightSchedule } from "@/lib/plant-config";
import type { LogType, WateringMethod } from "@/lib/log-config";

export interface Plant {
  id: string;
  name: string;
  seedType: SeedType;
  growType: GrowType;
  plantingDate: string;
  lightSchedule?: LightSchedule;
  seedBank?: string; // Banco de semillas (opcional)
  photos?: string[]; // URLs de las fotos de la planta
  coverPhoto?: string; // URL de la foto de portada para la plant card
  createdAt: string;
}

export interface LogEntry {
  id: string;
  type: LogType;
  date: string;
  notes?: string;
  createdAt: string;
  plantId?: string;
  plantName?: string;

  // Watering specific
  amount?: number;
  method?: WateringMethod;
  unit?: string; // e.g., ml, L, gal

  // Feeding specific
  npk?: string;

  // Environment specific
  temperature?: number;
  humidity?: number;
  ph?: number;
  light?: number;

  // Flowering specific
  lightSchedule?: string;
}

export interface EnvironmentData {
  id: string;
  date: string;
  temperature: number;
  humidity: number;
  ph: number;
  createdAt: string;
}

export interface Reminder {
  id: string;
  plantId: string;
  plantName: string;
  type: "watering" | "feeding" | "training" | "custom";
  title: string;
  description: string;
  interval: number;
  lastReminder: string;
  nextReminder: string;
  isActive: boolean;
  createdAt: string;
}

export * from "./auth";
export * from "./plants";
export * from "./firestore";
export * from "./pwa";
