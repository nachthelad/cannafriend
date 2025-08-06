export interface Plant {
  id: string;
  name: string;
  seedType: "autofloreciente" | "fotoperiodica";
  growType: "indoor" | "outdoor";
  plantingDate: string;
  lightSchedule?: string;
  photos?: string[]; // URLs de las fotos de la planta
  coverPhoto?: string; // URL de la foto de portada para la plant card
  createdAt: string;
}

export interface LogEntry {
  id: string;
  type:
    | "watering"
    | "feeding"
    | "training"
    | "environment"
    | "note"
    | "flowering";
  date: string;
  notes?: string;
  createdAt: string;
  plantId?: string;
  plantName?: string;

  // Watering specific
  amount?: number;
  method?: string;

  // Feeding specific
  npk?: string;

  // Environment specific
  temperature?: number;
  humidity?: number;
  ph?: number;
  light?: number;
}

export interface EnvironmentData {
  id: string;
  date: string;
  temperature: number;
  humidity: number;
  ph: number;
  createdAt: string;
}
