import type { Plant, Reminder } from "./entities";

export interface RemindersData {
  plants: Plant[];
  reminders: Reminder[];
}

export interface RemindersContentProps {
  userId: string;
}
