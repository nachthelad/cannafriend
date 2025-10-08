import type { TFunction } from "i18next";
import type { Plant, LogEntry, Reminder } from "./entities";
import type { Roles } from "./firestore";
import type { Session, SessionEditFormValues } from "@/components/sessions/types";
import type { SubscriptionDetails } from "@/components/settings/subscription-management";

export type ListedUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  premium: boolean;
  createdAt?: number;
};

export interface MobileAdminProps {
  users: ListedUser[];
  loading: boolean;
  sortDir: "newest" | "oldest";
  setSortDir: (dir: "newest" | "oldest") => void;
  fetchUsers: () => void;
  togglePremium: (user: ListedUser, premium: boolean) => void;
  copyToClipboard: (text: string, label?: string) => void;
}

export interface MobileDashboardProps {
  plants: Plant[];
  recentLogs: LogEntry[];
  remindersCount: number;
  hasOverdue: boolean;
  userEmail?: string;
  reminders: any[];
  isPremium: boolean;
}

export interface SimplePlantCardProps {
  plant: Plant;
  language: string;
  viewMode?: "grid" | "list";
  /**
   * Adds optional visual tweaks for responsive layouts without requiring a
   * separate mobile-only component. "overlay" mirrors the richer styling of
   * the previous mobile implementation.
   */
  variant?: "default" | "overlay";
  showGrowType?: boolean;
  className?: string;
}

export interface MobileJournalProps {
  userId: string;
  language: string;
}

export interface MobileJournalData {
  logs: LogEntry[];
  plants: Plant[];
}

export type MobileJournalSortBy = "date" | "type" | "plant";
export type MobileJournalSortOrder = "asc" | "desc";

export interface MobileJournalEntryProps {
  log: LogEntry;
  showPlantName?: boolean;
  onDelete?: (log: LogEntry) => void;
  onEdit?: (log: LogEntry) => void;
  language: string;
}

export interface MobilePlantPageProps {
  plant: Plant;
  userId: string;
  lastWatering?: LogEntry;
  lastFeeding?: LogEntry;
  lastTraining?: LogEntry;
  lastEnvironment?: LogEntry;
  onAddPhoto?: (plant: Plant) => void;
  onRemovePhoto?: (index: number) => void;
  onSetCoverPhoto?: (photoUrl: string) => void;
  onUpdate?: (patch: Partial<Plant>) => void;
  language: string;
}

export interface MobileRemindersProps {
  userId: string;
  plants: Plant[];
  initialReminders: Reminder[];
}

export interface MobileReminderItemProps {
  reminder: Reminder;
  language: string;
  isProcessing: boolean;
  onMarkDone: (reminder: Reminder) => Promise<void>;
  onSnooze: (reminder: Reminder, hours: number) => Promise<void>;
  onToggleActive: (reminder: Reminder, isActive: boolean) => Promise<void>;
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => Promise<void>;
}

export interface MobileSessionsProps {
  sessions: Session[];
  onAddSession: () => void;
  onEdit: (session: SessionEditFormValues & { id: string }) => Promise<void>;
  onDelete: (sessionId: string) => void;
  onToggleFavorite: (session: Session) => void;
  isFavorite: (session: Session) => boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterMethod: string;
  onFilterMethodChange: (method: string) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  availableMethods: string[];
  backHref: string;
}

export interface SessionListItemProps {
  session: Session;
  t: TFunction<["sessions", "common"]>;
  onView: () => void;
}

export interface SessionDetailViewProps {
  session: Session;
  t: TFunction<["sessions", "common"]>;
  onBack: () => void;
  onEdit: (session: SessionEditFormValues & { id: string }) => Promise<void>;
  onDelete: (sessionId: string) => void;
}

export interface MobileSettingsProps {
  userId: string;
  email?: string | null;
  providerId?: string | null;
  showHeader?: boolean;
}

export interface PreferencesState {
  timezone: string;
  darkMode: boolean;
  roles: Roles;
}

export type MobilePreferencesState = PreferencesState;

export interface SettingsData {
  preferences: PreferencesState;
  subscription: SubscriptionDetails | null;
}

export type MobileSettingsData = SettingsData;
