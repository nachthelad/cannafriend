export interface Plant {
  id: string
  name: string
  strain: string
  seedType: "autoflower" | "feminized" | "regular"
  growType: "indoor" | "outdoor"
  plantingDate: string
  stage: "seedling" | "vegetative" | "flowering" | "harvest"
  lightSchedule?: string
  createdAt: string
  updatedAt: string
}

export interface LogEntry {
  id: string
  plantId: string
  type: "watering" | "fertilization" | "training" | "environment"
  date: string
  notes?: string

  // Watering specific
  waterAmount?: number
  waterMethod?: string

  // Fertilization specific
  npkRatio?: string
  fertilizerAmount?: number
  fertilizerType?: "organic" | "synthetic"

  // Training specific
  trainingType?: string

  // Environment specific
  temperature?: number
  humidity?: number
  ph?: number
  lightIntensity?: number

  createdAt: string
}

export interface User {
  id: string
  email: string
  timezone: string
  language: "es" | "en"
  createdAt: string
}

export interface Photo {
  id: string
  plantId: string
  url: string
  caption?: string
  pestAnalysis?: {
    detected: boolean
    confidence: number
    pests: string[]
    recommendations: string[]
  }
  createdAt: string
}
