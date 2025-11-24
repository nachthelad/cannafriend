import type { TFunction } from "i18next";

export interface Session {
  id: string;
  strain: string;
  method?: string;
  amount?: string;
  effects?: string[];
  notes?: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  photos?: string[] | null;
}

export interface SessionsData {
  sessions: Session[];
  favoriteStrains: string[];
  isPremium: boolean;
}

export interface SessionEditFormValues {
  strain: string;
  notes: string;
  date: Date;
  startTime: string;
  endTime: string;
  photos: string[];
  method?: string;
  amount?: string;
}

export interface SessionsContainerProps {
  userId: string;
}

export interface SessionsListProps {
  sessions: Session[];
  t: TFunction<["sessions", "common"]>;
  onAddSession?: () => void;
  addSessionHref?: string;
  onEdit: (session: Session) => void;
  onDelete: (sessionId: string) => void;
  onToggleFavorite: (session: Session) => void;
  isFavorite: (session: Session) => boolean;
  hasActiveFilter: boolean;
  onView?: (session: Session) => void;
}

export interface SessionCardProps {
  session: Session;
  t: TFunction<["sessions", "common"]>;
  onEdit: (session: Session) => void;
  onDelete: (sessionId: string) => void;
  onToggleFavorite: (session: Session) => void;
  isFavorite: (session: Session) => boolean;
  onView?: (session: Session) => void;
}

export interface SessionsHeaderProps {
  t: TFunction<["sessions", "common"]>;
  onAddSession?: () => void;
  addSessionHref?: string;
  onOpenAssistant: () => void;
  isPremium: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterMethod: string;
  onFilterMethodChange: (method: string) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  availableMethods: string[];
}

export interface TimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
