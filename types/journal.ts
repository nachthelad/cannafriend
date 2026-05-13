import type { LogEntry, Plant } from "./entities";

export interface JournalData {
  logs: LogEntry[];
  plants: Plant[];
}

export interface JournalEntriesProps {
  logs: LogEntry[];
  showPlantName?: boolean;
  onDelete?: (log: LogEntry) => void;
}

export type JournalSortBy = "date" | "type" | "plant";
export type JournalSortOrder = "asc" | "desc";

export interface JournalDesktopProps {
  userId: string;
  language: string;
}
