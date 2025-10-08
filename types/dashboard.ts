import type { LogEntry, Plant } from "./entities";

export interface DashboardContainerProps {
  userId: string;
  userEmail: string;
}

export interface DashboardData {
  plants: Plant[];
  lastWaterings: Record<string, LogEntry>;
  lastFeedings: Record<string, LogEntry>;
  lastTrainings: Record<string, LogEntry>;
  recentLogs: LogEntry[];
  remindersCount: number;
  hasOverdue: boolean;
  reminders: any[];
  isPremium: boolean;
}
