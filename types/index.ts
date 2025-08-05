export interface Plant {
  id: string
  name: string
  strain: string
  seedType: "autoflower" | "feminized" | "regular"
  growType: "indoor" | "outdoor"
  plantingDate: string
  lightSchedule?: string
  createdAt: string
}

export interface LogEntry {
  id: string
  type: "watering" | "feeding" | "training" | "environment" | "note"
  date: string
  notes?: string
  createdAt: string

  // Watering specific
  amount?: number
  method?: string

  // Feeding specific
  npk?: string

  // Training specific
  trainingMethod?: string

  // Environment specific
  temperature?: number
  humidity?: number
  ph?: number
  light?: number
}

export interface EnvironmentData {
  id: string
  date: string
  temperature: number
  humidity: number
  ph: number
  createdAt: string
}
