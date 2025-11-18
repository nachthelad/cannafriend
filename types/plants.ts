import type { Plant, LogEntry, EnvironmentData, Reminder } from "./entities";

export interface PlantCardProps {
  plant: Plant;
  lastWatering?: LogEntry;
  lastFeeding?: LogEntry;
  lastTraining?: LogEntry;
  compact?: boolean;
  detailed?: boolean;
  /**
   * Allows tailoring the card visuals for different breakpoints without
   * duplicating the component. "mobile" applies a softer appearance that
   * mirrors the previous dedicated mobile card styling.
   */
  variant?: "default" | "mobile";
  className?: string;
}

export interface PlantContainerProps {
  userId: string;
}

export interface PlantContainerData {
  plants: Plant[];
}

export type ViewMode = "grid" | "list";
export type SortBy = "name" | "date" | "seedType" | "growType";
export type SortOrder = "asc" | "desc";

export interface PlantDetailsProps {
  plant: Plant;
  userId: string;
  lastWatering?: LogEntry;
  lastFeeding?: LogEntry;
  lastTraining?: LogEntry;
  lastFlowering?: LogEntry;
  lastLighting?: LogEntry;
  onUpdate?: (patch: Partial<Plant>) => void;
}

export interface PlantDetailsContainerProps {
  userId: string;
  plantId: string;
}

export interface PlantDetailsData {
  plant: Plant;
  logs: LogEntry[];
  environmentData: EnvironmentData[];
  lastWatering: LogEntry | null;
  lastFeeding: LogEntry | null;
  lastTraining: LogEntry | null;
  lastFlowering: LogEntry | null;
  lastLighting: LogEntry | null;
  lastEnvironmentFromLogs: LogEntry | undefined;
}

export interface PlantDetailsHeaderProps {
  plant: Plant;
  plantId: string;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
}

export interface PlantEnvironmentCardProps {
  environmentData: EnvironmentData[];
  lastEnvironmentFromLogs?: LogEntry;
}

export interface PlantPhotoGalleryProps {
  plant: Plant;
  onPhotosChange: (newPhotos: string[]) => Promise<void>;
  onRemovePhoto: (index: number) => Promise<void>;
  onSetCoverPhoto: (photoUrl: string) => Promise<void>;
  userId: string;
}

export interface PlantGridProps {
  userId: string;
  searchTerm?: string;
  viewMode?: ViewMode;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  seedTypeFilter?: string;
  growTypeFilter?: string;
  includeEnded?: boolean;
}

export interface PlantGridData {
  plants: Plant[];
  lastWaterings: Record<string, LogEntry>;
  lastFeedings: Record<string, LogEntry>;
  lastTrainings: Record<string, LogEntry>;
}

export interface PlantLogsContainerProps {
  userId: string;
  plantId: string;
}

export interface PlantLogsData {
  plant: Plant;
}

export interface LastActivitiesSummaryProps {
  lastWatering?: LogEntry;
  lastFeeding?: LogEntry;
  lastTraining?: LogEntry;
  lastFlowering?: LogEntry;
}

export interface PlantLogsSummaryProps {
  plantId: string;
  logs: LogEntry[];
  lastWatering?: LogEntry;
  lastFeeding?: LogEntry;
  lastTraining?: LogEntry;
  lastFlowering?: LogEntry;
  onDeleteLog: (logId: string) => Promise<void>;
}

export interface ReminderSystemProps {
  plants: Plant[];
  showOnlyOverdue?: boolean;
  reminders?: Reminder[];
}

export interface ImageGalleryModalProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}
