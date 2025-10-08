import type { SeedType, GrowType, LightSchedule } from "@/lib/plant-config";
import type { LogType, WateringMethod } from "@/lib/log-config";

export interface Plant {
  id: string;
  name: string;
  seedType: SeedType;
  growType: GrowType;
  plantingDate: string;
  lightSchedule?: LightSchedule;
  seedBank?: string;
  photos?: string[];
  coverPhoto?: string;
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
  amount?: number;
  method?: WateringMethod;
  unit?: string;
  npk?: string;
  temperature?: number;
  humidity?: number;
  ph?: number;
  light?: number;
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
