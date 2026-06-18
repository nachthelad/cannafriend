import type { LogEntry, Plant, Reminder } from "./entities";
import type { LogType } from "@/lib/log-config";

export interface DashboardContainerProps {
  userId: string;
  userEmail: string;
}

export interface DashboardStat {
  id: "plants" | "logs" | "reminders";
  label: string;
  value: number;
  deltaLabel?: string;
  helperLabel?: string;
  tone: "success" | "info" | "warning";
}

export interface DashboardPlantPreview {
  id: string;
  name: string;
  href: string;
  imageUrl?: string;
  dayLabel: string;
  stageLabel: string;
}

export interface DashboardActivityItem {
  id: string;
  type: LogType;
  title: string;
  plantName?: string;
  occurredAtLabel: string;
}

export interface DashboardReminderPreview {
  id: string;
  href: string;
  label: string;
  dueLabel: string;
  tone: "info" | "warning" | "neutral";
  reminderType: "watering" | "feeding" | "training" | "custom";
}

export interface DashboardQuickAction {
  id:
    | "watering"
    | "feeding"
    | "photo"
    | "training"
    | "notes";
  label: string;
  href: string;
  kind: "link";
}

export interface DashboardAiPromoState {
  href: string;
  badgeLabel?: string;
  ctaLabel: string;
}

export interface DashboardData {
  plants: Plant[];
  floweringPlantIds: Set<string>;
  recentLogs: LogEntry[];
  logsCount: number;
  remindersCount: number;
  reminders: Reminder[];
  isPremium: boolean;
  stats: DashboardStat[];
  plantsPreview: DashboardPlantPreview[];
  recentActivity: DashboardActivityItem[];
  upcomingReminders: DashboardReminderPreview[];
  quickActions: DashboardQuickAction[];
  aiPromo: DashboardAiPromoState;
}
