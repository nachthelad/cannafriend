import type {
  SeedType,
  GrowType,
  LightSchedule,
  PlantStatus,
} from "@/lib/plant-config";
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
  status: PlantStatus;
  endedAt?: string | null;
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
  status?: PlantStatus;
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
  plantId?: string;
  plantName?: string;
  /**
   * User-defined label for the alarm (replaces reminder type/title).
   */
  label: string;
  /**
   * Optional note/description shown in the notification body.
   */
  note?: string;
  /**
   * Days of week when the alarm should fire (0 = Sunday ... 6 = Saturday).
   */
  daysOfWeek: number[];
  /**
   * Time of day in HH:mm (24h) the alarm should fire on active days.
   */
  timeOfDay: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /**
   * ISO date (YYYY-MM-DD or full ISO) the alarm last fired, used to prevent
   * duplicate sends in the same day.
   */
  lastSentDate?: string | null;

  /**
   * Deprecated legacy fields (interval-based reminders). Kept temporarily
   * for migration/interop and will be removed once UI/cron are updated.
   */
  type?: "watering" | "feeding" | "training" | "custom";
  title?: string;
  description?: string;
  interval?: number;
  lastReminder?: string;
  nextReminder?: string;
}
