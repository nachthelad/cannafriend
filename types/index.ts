export interface Plant {
  id: string
  name: string
  strain: string
  seedType: "autoflower" | "feminized" | "regular"
  growType: "indoor" | "outdoor"
  plantingDate: string
  stage: "seedling" | "vegetative" | "flowering" | "harvest"
  createdAt: string
  updatedAt: string
  notes?: string
  lightSchedule?: string
  expectedHarvest?: string
}

export interface LogEntry {
  id: string
  plantId: string
  type: "watering" | "fertilization" | "training" | "environment" | "observation"
  date: string
  notes?: string

  // Watering specific
  waterAmount?: number
  waterMethod?: "top" | "bottom" | "spray"

  // Fertilization specific
  fertilizerType?: string
  npkRatio?: string
  amount?: number
  isOrganic?: boolean

  // Training specific
  trainingType?: "topping" | "lst" | "defoliation" | "scrog" | "sog"

  // Environment specific
  temperature?: number
  humidity?: number
  ph?: number
  lightIntensity?: number

  createdAt: string
  updatedAt: string
}

export interface EnvironmentData {
  id: string
  plantId: string
  date: string
  temperature: number
  humidity: number
  ph: number
  lightIntensity?: number
  createdAt: string
}

export interface Photo {
  id: string
  plantId: string
  url: string
  filename: string
  uploadDate: string
  description?: string
  pestAnalysis?: {
    detected: boolean
    confidence: number
    issues: string[]
    recommendations: string[]
  }
}

export interface UserProfile {
  id: string
  email: string
  displayName?: string
  timezone: string
  language: "es" | "en"
  createdAt: string
  updatedAt: string
}

export interface Strain {
  id: string
  name: string
  type: "indica" | "sativa" | "hybrid"
  thc: number
  cbd: number
  floweringTime: number
  description: string
}
