import { AIModel, PlantType } from './types'

// AI 모델 정의
export const AI_MODELS: { [key: string]: AIModel } = {
  "plant-health-basic": {
    id: "plant-health-basic",
    name: "TensorFlow 고급 로컬 모델 v2.0",
    accuracy: 92,
    status: "online",
    analysisItems: [
      { id: "health", name: "건강 상태", type: "string", unit: "" },
      { id: "disease", name: "질병 감지", type: "object", unit: "" },
      { id: "growth", name: "성장 분석", type: "object", unit: "" },
      { id: "nutrition", name: "영양 상태", type: "object", unit: "" }
    ]
  },
  "federated-hybrid": {
    id: "federated-hybrid",
    name: "연합학습 하이브리드 AI v1.0",
    accuracy: 85,
    status: "online",
    analysisItems: [
      { id: "hybrid_health_score", name: "하이브리드 건강도", type: "number", unit: "%" },
      { id: "personalized_prediction", name: "개인화 예측", type: "object", unit: "" },
      { id: "cluster_analysis", name: "클러스터 분석", type: "object", unit: "" },
      { id: "learning_progress", name: "학습 진행도", type: "object", unit: "" },
      { id: "farm_recommendations", name: "농가별 맞춤 권장사항", type: "string", unit: "" }
    ]
  },
  "mobilenet-plant": {
    id: "mobilenet-plant",
    name: "MobileNet 식물 분석 모델",
    accuracy: 95,
    status: "online",
    analysisItems: [
      { id: "classification", name: "식물 분류", type: "string", unit: "" },
      { id: "confidence", name: "신뢰도", type: "number", unit: "%" },
      { id: "leaf_analysis", name: "잎 분석", type: "object", unit: "" }
    ]
  },
  "resnet-diagnosis": {
    id: "resnet-diagnosis",
    name: "ResNet 식물 진단 모델",
    accuracy: 94,
    status: "online",
    analysisItems: [
      { id: "diagnosis", name: "진단 결과", type: "string", unit: "" },
      { id: "severity", name: "심각도", type: "number", unit: "점" },
      { id: "treatment", name: "치료 방안", type: "string", unit: "" }
    ]
  },
  "efficientnet-expert": {
    id: "efficientnet-expert",
    name: "EfficientNet 식물 전문가 모델",
    accuracy: 96,
    status: "online",
    analysisItems: [
      { id: "expert_analysis", name: "전문가 분석", type: "object", unit: "" },
      { id: "growth_stage", name: "성장 단계", type: "string", unit: "" },
      { id: "care_recommendations", name: "관리 권장사항", type: "string", unit: "" }
    ]
  }
}

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  UPLOADED_IMAGES: 'crop-analysis-uploaded-images',
  SAVED_ANALYSES: 'crop-analysis-saved-analyses',
  CAMERAS: 'crop-analysis-cameras',
  ENVIRONMENT_DATA: 'crop-analysis-environment-data'
}

// 식물 종류 정의
export const PLANT_TYPES: PlantType[] = [
  { id: "tomato", name: "토마토", icon: "🍅" },
  { id: "cucumber", name: "오이", icon: "🥒" },
  { id: "pepper", name: "고추", icon: "🌶️" },
  { id: "lettuce", name: "상추", icon: "🥬" },
  { id: "strawberry", name: "딸기", icon: "🍓" },
  { id: "spinach", name: "시금치", icon: "🥬" },
  { id: "cabbage", name: "배추", icon: "🥬" },
  { id: "carrot", name: "당근", icon: "🥕" },
  { id: "potato", name: "감자", icon: "🥔" },
  { id: "onion", name: "양파", icon: "🧅" },
  { id: "garlic", name: "마늘", icon: "🧄" },
  { id: "corn", name: "옥수수", icon: "🌽" }
]

// API 설정
export const API_CONFIG = {
  RAILWAY_URL: "https://dolkim85-smartfarm-backend-production.up.railway.app",
  TIMEOUT: 15000,
  RETRY_INTERVAL: 10000
}

// 환경 데이터 기본값
export const DEFAULT_ENVIRONMENT_DATA = {
  innerTemperature: 25.5,
  outerTemperature: 22.3,
  innerHumidity: 68,
  rootZoneTemperature: 24.2,
  solarRadiation: 420,
  ph: 6.5,
  ec: 1.8,
  dissolvedOxygen: 7.2
} 