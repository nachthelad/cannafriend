import type { Plant, Reminder } from "./entities";

export interface RemindersData {
  plants: Plant[];
  reminders: Reminder[];
  legacyDeletedCount: number;
}

export interface RemindersContentProps {
  userId: string;
}
