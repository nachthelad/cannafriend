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
