// 스마트팜 시스템 타입 정의
export interface UploadedImage {
  id: string
  file: File
  url: string
  timestamp: Date
  userId: string
}

export interface EnvironmentData {
  innerTemperature: number
  outerTemperature: number
  innerHumidity: number
  rootZoneTemperature: number
  solarRadiation: number
  ph: number
  ec: number
  dissolvedOxygen: number
  timestamp: Date
}

export interface AnalysisResult {
  modelId: string
  selectedAnalysisItems: string[]
  analysisData: { [key: string]: any }
  environmentData?: EnvironmentData
  condition: string
  recommendations: string[]
  date: string
  comparedImages?: string[]
}

export interface SavedAnalysis {
  id: string
  plantType: string
  date: string
  result: AnalysisResult
  userId: string
}

export interface ObservationCamera {
  id: string
  name: string
  photos: { name: string; date: Date; environmentData?: EnvironmentData }[]
  userId: string
  interval?: number
  isActive?: boolean
}

export interface AIModel {
  id: string
  name: string
  accuracy: number
  status: "online" | "offline" | "maintenance"
  analysisItems: AnalysisItem[]
}

export interface AnalysisItem {
  id: string
  name: string
  type: "string" | "number" | "object"
  unit: string
}

export interface PlantType {
  id: string
  name: string
  icon: string
}

export interface FarmInfo {
  facility_type: string
  location: string
  crop_type: string
  experience_years: number
  cluster_type?: string
}

export interface FarmAnalytics {
  total_farms: number
  active_farms: number
  clusters: { [key: string]: number }
  performance: {
    accuracy_improvement: number
    yield_increase: number
    resource_efficiency: number
  }
} 