"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import {
  Upload,
  Camera,
  Plus,
  Play,
  Leaf,
  TrendingUp,
  Clock,
  BarChart3,
  CheckCircle,
  Save,
  Database,
  Info,
  X,
  CalendarIcon,
  Check,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { ImageEditorModal } from "@/components/image-editor-modal"
import { GrowthChart } from "@/components/growth-chart"
import { DateRangePicker } from "@/components/date-range-picker"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"

interface UploadedImage {
  id: string
  file: File
  url: string
  timestamp: Date
  userId: string
}

interface ObservationCamera {
  id: string
  name: string
  photos: { name: string; date: Date }[]
  userId: string
}

interface AnalysisResult {
  modelId: string // 사용된 모델 ID
  selectedAnalysisItems: string[] // 선택된 분석 항목들
  analysisData: { [key: string]: any } // 동적 분석 데이터
  condition: string
  recommendations: string[]
  date: string
  comparedImages?: string[]
  
  // 기본 항목들 (호환성을 위해 유지)
  plantHealth?: number
  growthRate?: number
  size?: number
  height?: number
  leafCount?: number
  leafSize?: number
}

interface SavedAnalysis {
  id: string
  plantType: string
  date: string
  result: AnalysisResult
  userId: string
}

// 날짜 포맷팅 함수 (date-fns 대신 사용)
const formatDate = (date: Date, format: string) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (format === "PPP") {
    return `${year}년 ${month}월 ${day}일`
  }
  if (format === "yyyy년 M월 d일") {
    return `${year}년 ${month}월 ${day}일`
  }
  if (format === "HH:mm") {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
  }
  return date.toLocaleDateString("ko-KR")
}

// 로컬 스토리지 키
const STORAGE_KEYS = {
  UPLOADED_IMAGES: 'crop-analysis-uploaded-images',
  SAVED_ANALYSES: 'crop-analysis-saved-analyses',
  CAMERAS: 'crop-analysis-cameras'
}

// 이미지를 Base64로 변환하는 함수 (압축 기능 추가)
const fileToBase64 = (file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // 원본 크기
      let { width, height } = img
      
      // 최대 크기로 비율을 유지하면서 리사이즈
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = width * ratio
        height = height * ratio
      }
      
      // 캔버스 크기 설정
      canvas.width = width
      canvas.height = height
      
      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height)
      
      // Base64로 변환 (JPEG 압축 적용)
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedBase64)
    }
    
    img.onerror = () => reject(new Error('이미지 로드 실패'))
    img.src = URL.createObjectURL(file)
  })
}

// Base64를 File로 变换하는 함수
const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

export default function CropGrowthAnalysis() {
  const { user } = useAuth()
  const router = useRouter()
  const userId = user?.id || ""

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cameras, setCameras] = useState<ObservationCamera[]>([
    {
      id: "1",
      name: "온실 A-1",
      userId: "spinmoll", // 예비 계정용 데이터
      photos: [
        { name: "2024-01-15_10:00.jpg", date: new Date("2024-01-15T10:00:00") },
        { name: "2024-01-15_10:10.jpg", date: new Date("2024-01-15T10:10:00") },
        { name: "2024-01-15_10:20.jpg", date: new Date("2024-01-15T10:20:00") },
        { name: "2024-01-16_09:00.jpg", date: new Date("2024-01-16T09:00:00") },
        { name: "2024-01-16_09:10.jpg", date: new Date("2024-01-16T09:10:00") },
        { name: "2024-01-17_08:30.jpg", date: new Date("2024-01-17T08:30:00") },
      ],
    },
    {
      id: "2",
      name: "온실 A-2",
      userId: "spinmoll", // 예비 계정용 데이터
      photos: [
        { name: "2024-01-15_10:05.jpg", date: new Date("2024-01-15T10:05:00") },
        { name: "2024-01-15_10:15.jpg", date: new Date("2024-01-15T10:15:00") },
        { name: "2024-01-15_10:25.jpg", date: new Date("2024-01-15T10:25:00") },
        { name: "2024-01-16_09:05.jpg", date: new Date("2024-01-16T09:05:00") },
      ],
    },
  ])
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [selectedAnalysisItems, setSelectedAnalysisItems] = useState<string[]>([])
  const [selectedPlantType, setSelectedPlantType] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [newCameraName, setNewCameraName] = useState("")
  const [isAddingCamera, setIsAddingCamera] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [selectedAnalysisImages, setSelectedAnalysisImages] = useState<string[]>([])
  const [editingImage, setEditingImage] = useState<UploadedImage | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([
    {
      id: "1",
      plantType: "tomato",
      date: "2025-04-28T10:00:00",
      userId: "spinmoll", // 예비 계정용 데이터
      result: {
        modelId: "plant-health-basic",
        selectedAnalysisItems: ["plantHealth", "leafColor", "size", "leafCount", "condition"],
        analysisData: {
          plantHealth: 97,
          leafColor: {
            rgb: { r: 70, g: 130, b: 50 },
            hsv: { h: 110, s: 70, v: 80 },
            greenness: 85,
            yellowing: 8,
            browning: 2,
          },
          size: 18,
          leafCount: 12,
          condition: "우수"
        },
        condition: "우수",
        recommendations: ["수분 공급량을 10% 증가시키세요"],
        date: "2025-04-28T10:00:00",
        
        // 호환성을 위한 기본 값들
        plantHealth: 97,
        growthRate: 12,
        size: 18,
        height: 28,
        leafCount: 12,
        leafSize: 6,
      },
    },
    {
      id: "2",
      plantType: "tomato",
      date: "2025-05-15T10:00:00",
      userId: "spinmoll", // 예비 계정용 데이터
      result: {
        modelId: "plantnet-basic",
        selectedAnalysisItems: ["plantSpecies", "plantHealth", "diseaseDetection", "confidence", "leafCondition"],
        analysisData: {
          plantSpecies: "토마토",
          plantHealth: 92,
          diseaseDetection: {
            detected: false,
            confidence: 85,
            type: "없음"
          },
          confidence: 88,
          leafCondition: "양호"
        },
        condition: "양호",
        recommendations: ["질소 비료를 추가 공급하는 것을 권장합니다"],
        date: "2025-05-15T10:00:00",
        
        // 호환성을 위한 기본 값들
        plantHealth: 92,
        growthRate: 10,
        size: 20,
        height: 32,
        leafCount: 14,
        leafSize: 7,
      },
    },
    {
      id: "3",
      plantType: "cucumber",
      date: "2025-05-10T10:00:00",
      userId: "spinmoll", // 예비 계정용 데이터
      result: {
        modelId: "tensorflow-plant-free",
        selectedAnalysisItems: ["plantClassification", "growthStage", "plantHealth", "maturityLevel", "leafDevelopment"],
        analysisData: {
          plantClassification: "오이",
          growthStage: "성장기",
          plantHealth: 88,
          maturityLevel: 75,
          leafDevelopment: "양호한 발달"
        },
        condition: "양호",
        recommendations: ["잎의 색상 변화를 지속적으로 모니터링하세요"],
        date: "2025-05-10T10:00:00",
        
        // 호환성을 위한 기본 값들
        plantHealth: 88,
        growthRate: 15,
        size: 22,
        height: 35,
        leafCount: 8,
        leafSize: 9,
      },
    },
  ])
  const [hoveredModel, setHoveredModel] = useState<string | null>(null)
  const [plantTypes, setPlantTypes] = useState([
    { id: "tomato", name: "토마토" },
    { id: "lettuce", name: "상추" },
    { id: "cucumber", name: "오이" },
    { id: "pepper", name: "고추" },
    { id: "strawberry", name: "딸기" },
    { id: "spinach", name: "시금치" },
  ])
  const [isAddingPlantType, setIsAddingPlantType] = useState(false)
  const [newPlantTypeName, setNewPlantTypeName] = useState("")
  const [selectedDataPlantType, setSelectedDataPlantType] = useState<string>("all")
  const [plantTypeToDelete, setPlantTypeToDelete] = useState<string | null>(null)
  const [cameraToDelete, setCameraToDelete] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDataRows, setSelectedDataRows] = useState<string[]>([])
  const [dataDateRange, setDataDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [advancedFilters, setAdvancedFilters] = useState({
    healthMin: 0,
    healthMax: 100,
    heightMin: 0,
    heightMax: 100,
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const models = [
    // 무료 모델
    {
      id: "plant-health-basic",
      name: "Plant Health Basic (무료)",
      category: "무료",
      description: "기본적인 식물 건강 상태를 분석합니다. 무료로 제공되며 일일 50회 제한이 있습니다.",
      provider: "OpenCV + TensorFlow Lite",
      accuracy: "78%",
      features: ["기본 건강도 측정", "잎 색상 분석", "크기 측정"],
      analysisItems: [
        { id: "plantHealth", name: "식물 건강도 (%)", type: "number", unit: "%" },
        { id: "leafColor", name: "잎 색상 분석", type: "object" },
        { id: "size", name: "전체 크기", type: "number", unit: "cm" },
        { id: "leafCount", name: "잎 개수", type: "number", unit: "개" },
        { id: "condition", name: "전반적 상태", type: "string" }
      ]
    },
    {
      id: "plantnet-basic",
      name: "PlantNet Basic (무료)",
      category: "무료", 
      description: "식물 종 식별 및 기본 건강 분석을 제공하는 무료 모델입니다.",
      provider: "PlantNet API",
      accuracy: "82%",
      features: ["식물 종 식별", "기본 건강 분석", "병해 탐지"],
      analysisItems: [
        { id: "plantSpecies", name: "식물 종 식별", type: "string" },
        { id: "plantHealth", name: "식물 건강도 (%)", type: "number", unit: "%" },
        { id: "diseaseDetection", name: "병해 탐지", type: "object" },
        { id: "confidence", name: "식별 신뢰도", type: "number", unit: "%" },
        { id: "leafCondition", name: "잎 상태", type: "string" }
      ]
    },
    {
      id: "tensorflow-plant-free",
      name: "TensorFlow Plant Classifier (무료)",
      category: "무료",
      description: "Google의 TensorFlow를 기반으로 한 무료 식물 분류 모델입니다.",
      provider: "Google TensorFlow",
      accuracy: "75%",
      features: ["식물 분류", "기본 건강도", "성장 단계 분석"],
      analysisItems: [
        { id: "plantClassification", name: "식물 분류", type: "string" },
        { id: "growthStage", name: "성장 단계", type: "string" },
        { id: "plantHealth", name: "기본 건강도", type: "number", unit: "%" },
        { id: "maturityLevel", name: "성숙도", type: "number", unit: "%" },
        { id: "leafDevelopment", name: "잎 발달 상태", type: "string" }
      ]
    },

    // 유료 모델
    {
      id: "plantix-pro",
      name: "Plantix Professional ($29/월)",
      category: "유료",
      description: "전문가 수준의 식물 질병 진단 및 해결책 제공. 농업 전문가들이 사용하는 고정밀 AI 모델입니다.",
      provider: "PEAT (Progressive Environmental & Agricultural Technologies)",
      accuracy: "94%",
      features: ["정밀 질병 진단", "해결책 제안", "영양 결핍 분석", "해충 식별", "전문가 상담"],
      analysisItems: [
        { id: "diseaseAnalysis", name: "정밀 질병 진단", type: "object" },
        { id: "nutritionDeficiency", name: "영양 결핍 분석", type: "object" },
        { id: "pestIdentification", name: "해충 식별", type: "object" },
        { id: "treatmentRecommendation", name: "치료법 제안", type: "string" },
        { id: "severityLevel", name: "심각도 수준", type: "number", unit: "/10" },
        { id: "expertConsultation", name: "전문가 의견", type: "string" }
      ]
    },
    {
      id: "cropx-premium",
      name: "CropX Premium Analytics ($49/월)",
      category: "유료",
      description: "IoT 센서와 AI를 결합한 프리미엄 작물 분석 솔루션입니다.",
      provider: "CropX Technologies",
      accuracy: "96%",
      features: ["실시간 모니터링", "토양 분석", "관개 최적화", "수확량 예측", "기상 연동"],
      analysisItems: [
        { id: "soilMoisture", name: "토양 수분", type: "number", unit: "%" },
        { id: "soilTemperature", name: "토양 온도", type: "number", unit: "°C" },
        { id: "irrigationNeed", name: "관개 필요량", type: "number", unit: "L/m²" },
        { id: "yieldPrediction", name: "수확량 예측", type: "number", unit: "kg/m²" },
        { id: "weatherImpact", name: "기상 영향", type: "object" },
        { id: "optimalHarvest", name: "최적 수확일", type: "string" }
      ]
    },
    {
      id: "agromonitoring-pro",
      name: "Agro Monitoring Pro ($19/월)",
      category: "유료",
      description: "위성 이미지와 AI를 활용한 정밀 농업 모니터링 서비스입니다.",
      provider: "OpenWeather Agro API",
      accuracy: "91%",
      features: ["위성 이미지 분석", "식생 지수", "기상 예보", "병해충 예측", "수확 시기 예측"],
      analysisItems: [
        { id: "ndvi", name: "정규식생지수 (NDVI)", type: "number", unit: "" },
        { id: "satelliteAnalysis", name: "위성 이미지 분석", type: "object" },
        { id: "weatherForecast", name: "기상 예보", type: "object" },
        { id: "pestRisk", name: "병해충 위험도", type: "number", unit: "/10" },
        { id: "harvestTiming", name: "수확 시기 예측", type: "string" }
      ]
    },
    {
      id: "azure-farmbeats",
      name: "Microsoft Azure FarmBeats ($89/월)",
      category: "유료",
      description: "Microsoft의 클라우드 기반 농업 AI 플랫폼으로 엔터프라이즈급 분석을 제공합니다.",
      provider: "Microsoft Azure",
      accuracy: "97%",
      features: ["드론 이미지 분석", "다중 센서 융합", "예측 분석", "자동화 제어", "대시보드"],
      analysisItems: [
        { id: "droneAnalysis", name: "드론 이미지 분석", type: "object" },
        { id: "sensorFusion", name: "다중 센서 데이터", type: "object" },
        { id: "predictiveAnalytics", name: "예측 분석", type: "object" },
        { id: "automationControl", name: "자동화 제어", type: "string" },
        { id: "aiDashboard", name: "AI 대시보드", type: "object" },
        { id: "yieldOptimization", name: "수확량 최적화", type: "number", unit: "%" }
      ]
    },

    // 학습 AI 모델
    {
      id: "custom-cnn-v1",
      name: "Custom CNN Model v1.0 (학습중)",
      category: "학습AI",
      description: "사용자 데이터로 지속적으로 학습하는 맞춤형 CNN 모델입니다. 사용할수록 정확도가 향상됩니다.",
      provider: "자체 개발 모델",
      accuracy: "학습중 (현재 71%)",
      features: ["개인화 학습", "지속적 개선", "맞춤형 분석", "사용자 피드백 반영"],
      analysisItems: [
        { id: "personalizedHealth", name: "개인화 건강도", type: "number", unit: "%" },
        { id: "learningProgress", name: "학습 진행도", type: "number", unit: "%" },
        { id: "customMetrics", name: "맞춤형 지표", type: "object" },
        { id: "userFeedback", name: "사용자 피드백", type: "string" },
        { id: "adaptiveRecommendation", name: "적응형 권장사항", type: "string" }
      ]
    },
    {
      id: "transfer-learning-plant",
      name: "Transfer Learning Plant Model (학습중)",
      category: "학습AI",
      description: "ImageNet 사전 훈련 모델을 기반으로 농작물 데이터로 전이학습하는 모델입니다.",
      provider: "ResNet50 + Custom Dataset",
      accuracy: "학습중 (현재 68%)",
      features: ["전이학습", "빠른 적응", "다양한 작물 지원", "실시간 학습"],
      analysisItems: [
        { id: "transferAccuracy", name: "전이학습 정확도", type: "number", unit: "%" },
        { id: "adaptationSpeed", name: "적응 속도", type: "number", unit: "epochs" },
        { id: "cropVariety", name: "작물 다양성 지원", type: "object" },
        { id: "realTimeLearning", name: "실시간 학습 상태", type: "string" },
        { id: "modelConfidence", name: "모델 신뢰도", type: "number", unit: "%" }
      ]
    },
    {
      id: "automl-vision-plant",
      name: "AutoML Vision Plant (학습중)",
      category: "학습AI", 
      description: "Google의 AutoML Vision을 사용해 자동으로 최적화되는 식물 분석 모델입니다.",
      provider: "Google AutoML Vision",
      accuracy: "학습중 (현재 73%)",
      features: ["자동 최적화", "하이퍼파라미터 튜닝", "모델 앙상블", "성능 모니터링"],
      analysisItems: [
        { id: "autoOptimization", name: "자동 최적화 점수", type: "number", unit: "%" },
        { id: "hyperparameterTuning", name: "하이퍼파라미터 상태", type: "object" },
        { id: "ensemblePerformance", name: "앙상블 성능", type: "number", unit: "%" },
        { id: "performanceMonitoring", name: "성능 모니터링", type: "object" },
        { id: "optimizationHistory", name: "최적화 이력", type: "object" }
      ]
    },
    {
      id: "ensemble-learning-crop",
      name: "Ensemble Learning Crop Model (학습중)",
      category: "학습AI",
      description: "여러 머신러닝 모델을 결합한 앙상블 학습으로 높은 정확도를 추구하는 모델입니다.",
      provider: "Random Forest + SVM + Neural Network",
      accuracy: "학습중 (현재 76%)",
      features: ["앙상블 학습", "다중 모델 융합", "높은 안정성", "오버피팅 방지"],
      analysisItems: [
        { id: "ensembleAccuracy", name: "앙상블 정확도", type: "number", unit: "%" },
        { id: "modelFusion", name: "모델 융합 결과", type: "object" },
        { id: "stabilityScore", name: "안정성 점수", type: "number", unit: "/10" },
        { id: "overfittingPrevention", name: "오버피팅 방지율", type: "number", unit: "%" },
        { id: "individualModelScores", name: "개별 모델 점수", type: "object" }
      ]
    }
  ]

  // 로컬스토리지에서 데이터 로드하는 함수
  const loadFromStorage = async () => {
    try {
      setIsLoading(true)
      
      // 업로드된 이미지 로드
      const storedImages = localStorage.getItem(STORAGE_KEYS.UPLOADED_IMAGES)
      if (storedImages) {
        const imageData = JSON.parse(storedImages)
        const restoredImages = await Promise.all(
          imageData.map(async (item: any) => {
            try {
              const file = base64ToFile(item.base64, item.fileName)
              return {
                id: item.id,
                file,
                url: item.base64, // base64를 URL로 사용
                timestamp: new Date(item.timestamp),
                userId: item.userId
              }
            } catch (error) {
              console.error('이미지 복원 실패:', error)
              return null
            }
          })
        )
        setUploadedImages(restoredImages.filter(img => img !== null) as UploadedImage[])
      }

      // 분석 결과 로드
      const storedAnalyses = localStorage.getItem(STORAGE_KEYS.SAVED_ANALYSES)
      if (storedAnalyses) {
        setSavedAnalyses(JSON.parse(storedAnalyses))
      }

      // 카메라 정보 로드
      const storedCameras = localStorage.getItem(STORAGE_KEYS.CAMERAS)
      if (storedCameras) {
        setCameras(JSON.parse(storedCameras))
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // LocalStorage 용량 확인 함수
  const getStorageSize = () => {
    let total = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    return total
  }

  // LocalStorage 정리 함수
  const cleanupOldData = () => {
    try {
      const imageData = JSON.parse(localStorage.getItem(STORAGE_KEYS.UPLOADED_IMAGES) || '[]')
      const analysisData = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_ANALYSES) || '[]')
      
      // 30일 이상 된 데이터 삭제
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentImages = imageData.filter((img: any) => 
        new Date(img.timestamp) > thirtyDaysAgo
      )
      const recentAnalyses = analysisData.filter((analysis: any) => 
        new Date(analysis.date) > thirtyDaysAgo
      )
      
      localStorage.setItem(STORAGE_KEYS.UPLOADED_IMAGES, JSON.stringify(recentImages))
      localStorage.setItem(STORAGE_KEYS.SAVED_ANALYSES, JSON.stringify(recentAnalyses))
      
      return recentImages.length !== imageData.length || recentAnalyses.length !== analysisData.length
    } catch (error) {
      console.error('데이터 정리 실패:', error)
      return false
    }
  }

  // 로컬스토리지에 데이터 저장하는 함수
  const saveToStorage = async (images: UploadedImage[], analyses: SavedAnalysis[], cameras: ObservationCamera[]) => {
    try {
      // 현재 저장 용량 확인 (5MB = 5,242,880 바이트)
      const currentSize = getStorageSize()
      const maxSize = 5 * 1024 * 1024 // 5MB
      
      // 용량이 4MB를 초과하면 정리 시도
      if (currentSize > maxSize * 0.8) {
        console.log('저장 공간 부족, 오래된 데이터를 정리합니다...')
        const cleaned = cleanupOldData()
        if (cleaned) {
          console.log('오래된 데이터가 정리되었습니다.')
        }
      }
      
      // 이미지를 압축된 base64로 변환해서 저장
      const imageData = await Promise.all(
        images.map(async (img) => {
          try {
            // 이미지 압축 (최대 800x600, 품질 0.7)
            const base64 = await fileToBase64(img.file, 800, 600, 0.7)
            return {
              id: img.id,
              base64,
              fileName: img.file.name,
              timestamp: img.timestamp.toISOString(),
              userId: img.userId
            }
          } catch (error) {
            console.error('이미지 저장 실패:', error)
            return null
          }
        })
      )
      
      const validImageData = imageData.filter(data => data !== null)
      
      // 청크 단위로 저장 시도
      try {
        localStorage.setItem(STORAGE_KEYS.UPLOADED_IMAGES, JSON.stringify(validImageData))
        localStorage.setItem(STORAGE_KEYS.SAVED_ANALYSES, JSON.stringify(analyses))
        localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(cameras))
      } catch (quotaError) {
        console.warn('저장 공간이 부족합니다. 추가 정리를 시도합니다...')
        
        // 긴급 정리: 가장 오래된 50% 이미지 삭제
        const sortedImages = validImageData.sort((a: any, b: any) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        const keepCount = Math.floor(sortedImages.length * 0.5)
        const reducedImages = sortedImages.slice(-keepCount)
        
        try {
          localStorage.setItem(STORAGE_KEYS.UPLOADED_IMAGES, JSON.stringify(reducedImages))
          localStorage.setItem(STORAGE_KEYS.SAVED_ANALYSES, JSON.stringify(analyses))
          localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(cameras))
          
          alert(`저장 공간 부족으로 오래된 이미지 ${sortedImages.length - keepCount}개가 자동 삭제되었습니다.`)
        } catch (finalError) {
          console.error('최종 저장 실패:', finalError)
          alert('저장 공간이 부족합니다. 일부 이미지를 수동으로 삭제해주세요.')
        }
      }
    } catch (error) {
      console.error('데이터 저장 실패:', error)
      alert('데이터 저장 중 오류가 발생했습니다.')
    }
  }

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (userId) {
      loadFromStorage()
    }
  }, [userId])

  // 데이터 변경 시 자동 저장
  useEffect(() => {
    if (!isLoading && userId) {
      saveToStorage(uploadedImages, savedAnalyses, cameras)
    }
  }, [uploadedImages, savedAnalyses, cameras, isLoading, userId])

  // 사용자별 데이터 필터링 함수들
  const getUserCameras = () => cameras.filter((camera) => camera.userId === userId)
  const getUserAnalyses = () => savedAnalyses.filter((analysis) => analysis.userId === userId)
  const getUserImages = () => uploadedImages.filter((image) => image.userId === userId)

  // 모델 선택 시 분석 항목들 초기화
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId)
    const model = models.find(m => m.id === modelId)
    if (model) {
      // 기본적으로 모든 항목 선택
      setSelectedAnalysisItems(model.analysisItems.map(item => item.id))
    } else {
      setSelectedAnalysisItems([])
    }
  }

  // 분석 항목 체크박스 토글
  const toggleAnalysisItem = (itemId: string) => {
    setSelectedAnalysisItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const addNewPlantType = () => {
    if (newPlantTypeName.trim()) {
      const newPlantType = {
        id: newPlantTypeName.toLowerCase().replace(/\s+/g, "-"),
        name: newPlantTypeName,
      }
      setPlantTypes((prev) => [...prev, newPlantType])
      setNewPlantTypeName("")
      setIsAddingPlantType(false)
    }
  }

  const deletePlantType = (plantTypeId: string) => {
    // 해당 식물 종류의 사용자 데이터가 있는지 확인
    const hasData = getUserAnalyses().some((analysis) => analysis.plantType === plantTypeId)
    if (hasData) {
      if (confirm("이 식물 종류에 저장된 데이터가 있습니다. 정말 삭제하시겠습니까?")) {
        setPlantTypes((prev) => prev.filter((plant) => plant.id !== plantTypeId))
        setSavedAnalyses((prev) =>
          prev.filter((analysis) => !(analysis.plantType === plantTypeId && analysis.userId === userId)),
        )
        if (selectedPlantType === plantTypeId) {
          setSelectedPlantType("")
        }
      }
    } else {
      if (confirm("이 식물 종류를 삭제하시겠습니까?")) {
        setPlantTypes((prev) => prev.filter((plant) => plant.id !== plantTypeId))
        if (selectedPlantType === plantTypeId) {
          setSelectedPlantType("")
        }
      }
    }
    setPlantTypeToDelete(null)
  }

  // 식물 종류별 통계 계산 함수 (사용자별)
  const getPlantTypeStats = (plantTypeId: string) => {
    const data = getUserAnalyses().filter((analysis) => analysis.plantType === plantTypeId)
    if (data.length === 0) return null

    const latest = data[data.length - 1]
    const avgHealth = data.reduce((sum, item) => sum + (item.result.plantHealth || 0), 0) / data.length

    return {
      count: data.length,
      latestDate: new Date(latest.date).toLocaleDateString("ko-KR"),
      avgHealth: Math.round(avgHealth),
      latestHeight: latest.result.height,
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const newImages: UploadedImage[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file),
      timestamp: new Date(file.lastModified),
      userId,
    }))

    setUploadedImages((prev) => [...prev, ...newImages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()))
  }

  const handleCameraPhotoSelect = (photoName: string) => {
    const mockImage: UploadedImage = {
      id: Math.random().toString(36).substr(2, 9),
      file: new File([], photoName),
      url: `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(photoName)}`,
      timestamp: new Date(photoName.replace(".jpg", "").replace("_", " ")),
      userId,
    }

    setUploadedImages((prev) => [...prev, mockImage].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()))
  }

  const addNewCamera = () => {
    if (newCameraName.trim()) {
      const newCamera: ObservationCamera = {
        id: Math.random().toString(36).substr(2, 9),
        name: newCameraName,
        photos: [],
        userId,
      }
      setCameras((prev) => [...prev, newCamera])
      setNewCameraName("")
      setIsAddingCamera(false)
    }
  }

  const deleteCamera = (cameraId: string) => {
    if (confirm("이 카메라를 삭제하시겠습니까?")) {
      setCameras((prev) => prev.filter((camera) => camera.id !== cameraId))
      if (selectedCamera === cameraId) {
        setSelectedCamera("")
      }
    }
    setCameraToDelete(null)
  }

  // 선택된 날짜의 사진들 필터링
  const getFilteredPhotos = () => {
    if (!selectedCamera || !selectedDate) return []

    const camera = getUserCameras().find((c) => c.id === selectedCamera)
    if (!camera) return []

    return camera.photos.filter((photo) => {
      const photoDate = new Date(photo.date)
      return (
        photoDate.getFullYear() === selectedDate.getFullYear() &&
        photoDate.getMonth() === selectedDate.getMonth() &&
        photoDate.getDate() === selectedDate.getDate()
      )
    })
  }

  const verifyImagePlantMatch = async (images: UploadedImage[], plantType: string): Promise<boolean> => {
    // 모의 AI 검증 (실제로는 AI 모델 API 호출)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 랜덤하게 80% 확률로 일치한다고 가정
    return Math.random() > 0.2
  }

  const runAnalysis = async () => {
    if (!selectedModel || selectedAnalysisImages.length === 0 || !selectedPlantType) {
      alert("분석 모델, 식물 종류, 그리고 최소 하나의 이미지를 선택해주세요.")
      return
    }

    if (selectedAnalysisItems.length === 0) {
      alert("분석할 항목을 최소 하나 이상 선택해주세요.")
      return
    }

    setIsAnalyzing(true)

    try {
      // 선택된 이미지들만 분석에 사용 (사용자 이미지만)
      const analysisImages = getUserImages().filter((img) => selectedAnalysisImages.includes(img.id))

      // 1단계: 이미지-식물 매칭 검증
      const isMatching = await verifyImagePlantMatch(analysisImages, selectedPlantType)

      if (!isMatching) {
        const shouldContinue = confirm(
          `선택된 이미지가 선택한 식물(${plantTypes.find((p) => p.id === selectedPlantType)?.name})과 일치하지 않을 수 있습니다.\n\n그래도 분석을 진행하시겠습니까?`,
        )

        if (!shouldContinue) {
          setIsAnalyzing(false)
          return
        }
      }

      // 2단계: 선택된 모델과 분석 항목에 따른 분석 결과 생성
      const selectedModelData = models.find(m => m.id === selectedModel)
      if (!selectedModelData) {
        alert("선택된 모델을 찾을 수 없습니다.")
        setIsAnalyzing(false)
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 3000))

      const analysisData: { [key: string]: any } = {}
      
      // 선택된 분석 항목들에 대해서만 데이터 생성
      selectedAnalysisItems.forEach(itemId => {
        const item = selectedModelData.analysisItems.find(ai => ai.id === itemId)
        if (item) {
          switch (item.type) {
            case "number":
              if (itemId === "plantHealth") {
                analysisData[itemId] = Math.floor(Math.random() * 30 + 70) // 70-100%
              } else if (itemId === "size" || itemId === "height") {
                analysisData[itemId] = Math.floor(Math.random() * 30 + 20) // 20-50cm
              } else if (itemId === "leafCount") {
                analysisData[itemId] = Math.floor(Math.random() * 15 + 5) // 5-20개
              } else if (itemId.includes("Temperature")) {
                analysisData[itemId] = Math.floor(Math.random() * 20 + 15) // 15-35°C
              } else if (itemId.includes("Moisture")) {
                analysisData[itemId] = Math.floor(Math.random() * 40 + 40) // 40-80%
              } else if (itemId.includes("Accuracy") || itemId.includes("confidence")) {
                analysisData[itemId] = Math.floor(Math.random() * 20 + 75) // 75-95%
              } else {
                analysisData[itemId] = Math.floor(Math.random() * 100)
              }
              break
            case "string":
              if (itemId === "condition") {
                analysisData[itemId] = ["우수", "양호", "보통", "주의"][Math.floor(Math.random() * 4)]
              } else if (itemId.includes("Species") || itemId.includes("Classification")) {
                analysisData[itemId] = plantTypes.find(p => p.id === selectedPlantType)?.name || selectedPlantType
              } else if (itemId.includes("Stage")) {
                analysisData[itemId] = ["묘목", "성장기", "개화기", "결실기"][Math.floor(Math.random() * 4)]
              } else {
                analysisData[itemId] = `${item.name} 분석 결과`
              }
              break
            case "object":
              if (itemId === "leafColor") {
                analysisData[itemId] = {
                  rgb: { r: Math.floor(Math.random() * 50) + 50, g: Math.floor(Math.random() * 100) + 100, b: Math.floor(Math.random() * 30) + 30 },
                  hsv: { h: Math.random() * 60 + 80, s: Math.random() * 40 + 40, v: Math.random() * 30 + 50 },
                  greenness: Math.random() * 30 + 60,
                  yellowing: Math.random() * 20 + 5,
                  browning: Math.random() * 15 + 2,
                }
              } else if (itemId.includes("disease") || itemId.includes("Disease")) {
                analysisData[itemId] = {
                  detected: Math.random() > 0.7,
                  confidence: Math.floor(Math.random() * 30 + 70),
                  type: ["잎마름병", "역병", "탄저병", "없음"][Math.floor(Math.random() * 4)]
                }
              } else {
                analysisData[itemId] = {
                  status: "정상",
                  value: Math.floor(Math.random() * 100),
                  details: `${item.name} 상세 분석 결과`
                }
              }
              break
          }
        }
      })

      const mockResult: AnalysisResult = {
        modelId: selectedModel,
        selectedAnalysisItems: selectedAnalysisItems,
        analysisData,
        condition: analysisData.condition || "양호",
        recommendations: [
          "수분 공급량을 10% 증가시키세요",
          "질소 비료를 추가 공급하는 것을 권장합니다",
          "잎의 색상 변화를 지속적으로 모니터링하세요",
          "적절한 광량을 유지해주세요",
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        date: new Date().toISOString(),
        comparedImages: selectedAnalysisImages,
        
        // 호환성을 위한 기본 값들
        plantHealth: analysisData.plantHealth || Math.floor(Math.random() * 30 + 70),
        growthRate: Math.floor(Math.random() * 10 + 5),
        size: analysisData.size || Math.floor(Math.random() * 30 + 20),
        height: analysisData.height || Math.floor(Math.random() * 30 + 20),
        leafCount: analysisData.leafCount || Math.floor(Math.random() * 15 + 5),
        leafSize: Math.floor(Math.random() * 5 + 3),
      }

      setAnalysisResult(mockResult)
    } catch (error) {
      console.error("분석 중 오류 발생:", error)
      alert("분석 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const saveAnalysis = async () => {
    if (!analysisResult || !selectedPlantType) return

    const newAnalysis: SavedAnalysis = {
      id: Math.random().toString(36).substr(2, 9),
      plantType: selectedPlantType,
      date: new Date().toISOString(),
      result: analysisResult,
      userId,
    }

    const updatedAnalyses = [...savedAnalyses, newAnalysis]
    setSavedAnalyses(updatedAnalyses)
    
    // 로컬 스토리지에 저장
    try {
      await saveToStorage(uploadedImages, updatedAnalyses, cameras)
      console.log("분석 결과가 로컬 스토리지에 저장되었습니다:", newAnalysis)
    } catch (error) {
      console.error("저장 중 오류 발생:", error)
      alert("저장 중 오류가 발생했습니다. 다시 시도해주세요.")
      return
    }
    
    // 분석 결과를 화면에서 제거
    setAnalysisResult(null)
    
    // 저장 완료 메시지와 함께 분석 결과 페이지로 이동 안내
    if (confirm("분석 결과가 저장되었습니다!\n저장된 분석 결과를 확인하시겠습니까?")) {
      router.push("/my-data/analyses")
    }
  }

  const deleteImage = (imageId: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId))
    setSelectedImages((prev) => prev.filter((id) => id !== imageId))
    setSelectedAnalysisImages((prev) => prev.filter((id) => id !== imageId))
  }

  const deleteSelectedImages = () => {
    setUploadedImages((prev) => prev.filter((img) => !selectedImages.includes(img.id)))
    setSelectedAnalysisImages((prev) => prev.filter((id) => !selectedImages.includes(id)))
    setSelectedImages([])
  }

  const openImageEditor = (image: UploadedImage) => {
    setEditingImage(image)
    setIsEditorOpen(true)
  }

  const handleImageSave = (editedImageUrl: string, editedFile: File) => {
    if (!editingImage) return

    const updatedImage: UploadedImage = {
      ...editingImage,
      file: editedFile,
      url: editedImageUrl,
    }

    setUploadedImages((prev) => prev.map((img) => (img.id === editingImage.id ? updatedImage : img)))
    setEditingImage(null)
  }

  const closeImageEditor = () => {
    setIsEditorOpen(false)
    setEditingImage(null)
  }

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages((prev) => (prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]))
  }

  const toggleAnalysisImageSelection = (imageId: string) => {
    setSelectedAnalysisImages((prev) =>
      prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId],
    )
  }

  const selectAllImages = () => {
    setSelectedImages(getUserImages().map((img) => img.id))
  }

  const deselectAllImages = () => {
    setSelectedImages([])
  }

  const selectAllAnalysisImages = () => {
    setSelectedAnalysisImages(getUserImages().map((img) => img.id))
  }

  const deselectAllAnalysisImages = () => {
    setSelectedAnalysisImages([])
  }

  // 선택된 식물 종류의 데이터만 필터링 (날짜 범위 포함, 사용자별)
  const getFilteredData = (plantType: string) => {
    return getUserAnalyses()
      .filter((analysis) => {
        const plantTypeMatch = analysis.plantType === plantType
        const analysisDate = new Date(analysis.date)
        const dateMatch =
          (!dataDateRange.from || analysisDate >= dataDateRange.from) &&
          (!dataDateRange.to || analysisDate <= dataDateRange.to)
        const healthMatch =
          (analysis.result.plantHealth || 0) >= advancedFilters.healthMin &&
          (analysis.result.plantHealth || 0) <= advancedFilters.healthMax
        const heightMatch =
          (analysis.result.height || 0) >= advancedFilters.heightMin && (analysis.result.height || 0) <= advancedFilters.heightMax

        return plantTypeMatch && dateMatch && healthMatch && heightMatch
      })
      .map((analysis) => ({
        date: new Date(analysis.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
        height: analysis.result.height,
        leafCount: analysis.result.leafCount,
        health: analysis.result.plantHealth,
        leafSize: analysis.result.leafSize,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // 날짜 범위와 식물 종류로 필터링된 분석 데이터 가져오기 (사용자별)
  const getFilteredAnalyses = () => {
    return getUserAnalyses().filter((analysis) => {
      // 식물 종류 필터
      const plantTypeMatch = selectedDataPlantType === "all" || analysis.plantType === selectedDataPlantType

      // 날짜 범위 필터
      const analysisDate = new Date(analysis.date)
      const dateMatch =
        (!dataDateRange.from || analysisDate >= dataDateRange.from) &&
        (!dataDateRange.to || analysisDate <= dataDateRange.to)

      // 고급 필터
      const healthMatch =
        (analysis.result.plantHealth || 0) >= advancedFilters.healthMin &&
        (analysis.result.plantHealth || 0) <= advancedFilters.healthMax
      const heightMatch =
        (analysis.result.height || 0) >= advancedFilters.heightMin && (analysis.result.height || 0) <= advancedFilters.heightMax

      return plantTypeMatch && dateMatch && healthMatch && heightMatch
    })
  }

  // 필터링된 데이터의 통계 계산 (사용자별)
  const getDataStatistics = () => {
    const filteredData = getFilteredAnalyses()
    if (filteredData.length === 0) return null

    const healthValues = filteredData.map((d) => d.result.plantHealth || 0).filter(h => h > 0)
    const heightValues = filteredData.map((d) => d.result.height || 0).filter(h => h > 0)
    const leafCountValues = filteredData.map((d) => d.result.leafCount || 0).filter(h => h > 0)

    return {
      count: filteredData.length,
      avgHealth: healthValues.length > 0 ? Math.round(healthValues.reduce((a, b) => a + b, 0) / healthValues.length) : 0,
      maxHealth: healthValues.length > 0 ? Math.max(...healthValues) : 0,
      minHealth: healthValues.length > 0 ? Math.min(...healthValues) : 0,
      avgHeight: heightValues.length > 0 ? Math.round(heightValues.reduce((a, b) => a + b, 0) / heightValues.length) : 0,
      maxHeight: heightValues.length > 0 ? Math.max(...heightValues) : 0,
      minHeight: heightValues.length > 0 ? Math.min(...heightValues) : 0,
      avgLeafCount: leafCountValues.length > 0 ? Math.round(leafCountValues.reduce((a, b) => a + b, 0) / leafCountValues.length) : 0,
    }
  }

  // 날짜별 데이터 포인트 생성 (사용자별)
  const getDataPoints = () => {
    return getUserAnalyses().map((analysis) => ({
      date: analysis.date,
      plantType: analysis.plantType,
    }))
  }

  const selectedModelInfo = models.find((model) => model.id === hoveredModel)

  const exportToExcel = () => {
    const selectedData = getUserAnalyses().filter((analysis) => selectedDataRows.includes(analysis.id))

    if (selectedData.length === 0) {
      alert("내보낼 데이터를 선택해주세요.")
      return
    }

    // CSV 형태로 데이터 변환
    const headers = [
      "날짜",
      "식물 종류",
      "건강도 (%)",
      "키 (cm)",
      "잎 개수",
      "잎 크기 (cm)",
      "상태",
      "성장 속도 (%)",
      "전체 크기 (cm)",
    ]
    const csvData = selectedData.map((analysis) => [
      new Date(analysis.date).toLocaleDateString("ko-KR"),
      plantTypes.find((p) => p.id === analysis.plantType)?.name || analysis.plantType,
      analysis.result.plantHealth,
      analysis.result.height,
      analysis.result.leafCount,
      analysis.result.leafSize,
      analysis.result.condition,
      analysis.result.growthRate,
      analysis.result.size,
    ])

    // CSV 문자열 생성
    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    // BOM 추가 (한글 깨짐 방지)
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })

    // 파일 다운로드
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `작물분석데이터_${user?.name}_${new Date().toLocaleDateString("ko-KR").replace(/\./g, "")}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleDataRowSelection = (analysisId: string) => {
    setSelectedDataRows((prev) =>
      prev.includes(analysisId) ? prev.filter((id) => id !== analysisId) : [...prev, analysisId],
    )
  }

  const selectAllDataRows = () => {
    const filteredAnalyses = getFilteredAnalyses()
    setSelectedDataRows(filteredAnalyses.map((analysis) => analysis.id))
  }

  const deselectAllDataRows = () => {
    setSelectedDataRows([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-green-800 flex items-center justify-center gap-3">
            <Leaf className="h-10 w-10" />
            스마트팜 작물 성장 분석 시스템
          </h1>
          <p className="text-green-600">AI 기반 작물 모니터링 및 성장 분석 플랫폼</p>
          {user && (
            <p className="text-sm text-green-700">
              <span className="font-medium">{user.name}</span>님의 분석 데이터
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽 패널 */}
          <div className="space-y-6">
            {/* 이미지 업로드 섹션 */}
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Upload className="h-5 w-5" />
                  이미지 업로드
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="text-green-700">클릭하여 이미지를 업로드하세요</p>
                      <p className="text-sm text-green-500">여러 파일 선택 가능</p>
                      <p className="text-xs text-gray-500 mt-1">
                        ⚡ 이미지는 자동으로 압축되어 저장됩니다 (최대 800x600)
                      </p>
                    </Label>
                  </div>

                  {getUserImages().length > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={selectAllImages}
                            disabled={selectedImages.length === getUserImages().length}
                          >
                            전체 선택
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={deselectAllImages}
                            disabled={selectedImages.length === 0}
                          >
                            선택 해제
                          </Button>
                        </div>
                        {selectedImages.length > 0 && (
                          <Button variant="destructive" size="sm" onClick={deleteSelectedImages}>
                            선택 항목 삭제 ({selectedImages.length})
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                        {getUserImages().map((image) => (
                          <div key={image.id} className="relative group">
                            <div className="relative">
                              <Image
                                src={image.url || "/placeholder.svg"}
                                alt="업로드된 이미지"
                                width={150}
                                height={150}
                                className={`w-full h-32 object-cover rounded-lg border-2 transition-all ${
                                  selectedImages.includes(image.id)
                                    ? "border-blue-500 ring-2 ring-blue-200"
                                    : selectedAnalysisImages.includes(image.id)
                                      ? "border-orange-500 ring-2 ring-orange-200"
                                      : "border-green-200"
                                }`}
                              />

                              {/* 삭제용 체크박스 */}
                              <div className="absolute top-2 left-2">
                                <input
                                  type="checkbox"
                                  checked={selectedImages.includes(image.id)}
                                  onChange={() => toggleImageSelection(image.id)}
                                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                  title="삭제용 선택"
                                />
                              </div>

                              {/* 분석용 체크박스 */}
                              <div className="absolute top-2 left-8">
                                <input
                                  type="checkbox"
                                  checked={selectedAnalysisImages.includes(image.id)}
                                  onChange={() => toggleAnalysisImageSelection(image.id)}
                                  className="w-4 h-4 text-orange-600 bg-white border-gray-300 rounded focus:ring-orange-500"
                                  title="분석용 선택"
                                />
                              </div>

                              {/* 개별 삭제 버튼 */}
                              <button
                                onClick={() => deleteImage(image.id)}
                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>

                              {/* 편집 버튼 */}
                              <button
                                onClick={() => openImageEditor(image)}
                                className="absolute top-2 right-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="편집"
                              >
                                ✎
                              </button>

                              {/* 타임스탬프 */}
                              <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                {image.timestamp.toLocaleTimeString()}
                              </div>

                              {/* 분석 선택 표시 */}
                              {selectedAnalysisImages.includes(image.id) && (
                                <div className="absolute bottom-1 right-1 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                                  분석
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 분석용 이미지 선택 컨트롤 */}
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-sm font-medium text-orange-700">분석용 이미지 선택</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={selectAllAnalysisImages}
                              disabled={selectedAnalysisImages.length === getUserImages().length}
                              className="text-orange-600 border-orange-300"
                            >
                              전체 선택
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={deselectAllAnalysisImages}
                              disabled={selectedAnalysisImages.length === 0}
                              className="text-orange-600 border-orange-300"
                            >
                              선택 해제
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">
                          분석에 사용할 이미지를 선택하세요. 선택된 이미지: {selectedAnalysisImages.length}개
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 관찰 카메라 섹션 */}
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Camera className="h-5 w-5" />
                  관찰 카메라
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-2">
                  <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="카메라를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUserCameras().map((camera) => (
                        <SelectItem key={camera.id} value={camera.id}>
                          {camera.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddingCamera(true)}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    title="카메라 추가"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (selectedCamera) {
                        setCameraToDelete(selectedCamera)
                      } else {
                        alert("삭제할 카메라를 먼저 선택해주세요.")
                      }
                    }}
                    disabled={!selectedCamera}
                    className="border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="선택된 카메라 삭제"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {isAddingCamera && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="새 카메라 이름"
                      value={newCameraName}
                      onChange={(e) => setNewCameraName(e.target.value)}
                    />
                    <Button onClick={addNewCamera} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      추가
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsAddingCamera(false)}>
                      취소
                    </Button>
                  </div>
                )}

                {selectedCamera && (
                  <div className="space-y-4 border-t pt-4">
                    {/* 날짜 선택 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">촬영 날짜 선택</Label>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        onClick={() => setShowCalendar(!showCalendar)}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? formatDate(selectedDate, "PPP") : "날짜를 선택하세요"}
                      </Button>

                      {/* 달력 직접 표시 */}
                      {showCalendar && (
                        <div className="border rounded-lg p-3 bg-white shadow-lg">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date)
                              setShowCalendar(false) // 날짜 선택 후 달력 닫기
                            }}
                            className="rounded-md"
                          />
                        </div>
                      )}
                    </div>

                    {/* 선택된 날짜의 사진 목록 */}
                    {selectedDate && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          {formatDate(selectedDate, "yyyy년 M월 d일")} 촬영된 사진
                        </Label>
                        <Select onValueChange={handleCameraPhotoSelect}>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                getFilteredPhotos().length > 0
                                  ? `사진을 선택하세요 (${getFilteredPhotos().length}개)`
                                  : "해당 날짜에 촬영된 사진이 없습니다"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {getFilteredPhotos().map((photo) => (
                              <SelectItem key={photo.name} value={photo.name}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{photo.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">{formatDate(photo.date, "HH:mm")}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {getFilteredPhotos().length > 0 && (
                          <p className="text-xs text-gray-600">총 {getFilteredPhotos().length}개의 사진이 있습니다.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {/* 카메라별 저장된 데이터 표시 */}
                {selectedCamera && (
                  <div className="space-y-4 border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-blue-800">
                        {getUserCameras().find((c) => c.id === selectedCamera)?.name} 데이터 현황
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        총 {getUserCameras().find((c) => c.id === selectedCamera)?.photos.length || 0}장
                      </Badge>
                    </div>

                    {/* 카메라 통계 정보 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-lg font-bold text-blue-700">
                          {getUserCameras().find((c) => c.id === selectedCamera)?.photos.length || 0}
                        </div>
                        <div className="text-xs text-blue-600">총 촬영 사진</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-lg font-bold text-green-700">
                          {(() => {
                            const camera = getUserCameras().find((c) => c.id === selectedCamera)
                            if (!camera || camera.photos.length === 0) return 0
                            const uniqueDates = new Set(camera.photos.map((p) => new Date(p.date).toDateString()))
                            return uniqueDates.size
                          })()}
                        </div>
                        <div className="text-xs text-green-600">촬영 일수</div>
                      </div>
                    </div>

                    {/* 최근 촬영 사진 목록 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">최근 촬영 사진</Label>
                        <span className="text-xs text-gray-500">최신 5장</span>
                      </div>

                      {(() => {
                        const camera = getUserCameras().find((c) => c.id === selectedCamera)
                        const recentPhotos =
                          camera?.photos
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .slice(0, 5) || []

                        return recentPhotos.length > 0 ? (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {recentPhotos.map((photo, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                    <Camera className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-gray-700">{photo.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {formatDate(photo.date, "yyyy년 M월 d일")} {formatDate(photo.date, "HH:mm")}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCameraPhotoSelect(photo.name)}
                                  className="text-xs px-2 py-1 h-auto"
                                >
                                  추가
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <Camera className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-xs">촬영된 사진이 없습니다</p>
                          </div>
                        )
                      })()}
                    </div>

                    {/* 날짜별 촬영 현황 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">날짜별 촬영 현황</Label>
                      {(() => {
                        const camera = getUserCameras().find((c) => c.id === selectedCamera)
                        const photosByDate =
                          camera?.photos.reduce(
                            (acc, photo) => {
                              const dateKey = new Date(photo.date).toDateString()
                              acc[dateKey] = (acc[dateKey] || 0) + 1
                              return acc
                            },
                            {} as Record<string, number>,
                          ) || {}

                        const sortedDates = Object.entries(photosByDate)
                          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                          .slice(0, 3)

                        return sortedDates.length > 0 ? (
                          <div className="space-y-1">
                            {sortedDates.map(([dateStr, count]) => (
                              <div key={dateStr} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">{new Date(dateStr).toLocaleDateString("ko-KR")}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {count}장
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 text-center py-2">촬영 기록이 없습니다</p>
                        )
                      })()}
                    </div>

                    {/* 카메라 설정 및 관리 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">카메라 관리</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => {
                            const camera = getUserCameras().find((c) => c.id === selectedCamera)
                            if (camera) {
                              alert(
                                `카메라 정보:\n이름: ${camera.name}\n총 사진: ${camera.photos.length}장\n등록일: 최근`,
                              )
                            }
                          }}
                        >
                          <Info className="h-3 w-3 mr-1" />
                          상세 정보
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => {
                            const camera = getUserCameras().find((c) => c.id === selectedCamera)
                            if (camera && camera.photos.length > 0) {
                              // 모든 사진을 이미지 목록에 추가
                              camera.photos.forEach((photo) => handleCameraPhotoSelect(photo.name))
                              alert(`${camera.photos.length}장의 사진을 모두 추가했습니다.`)
                            } else {
                              alert("추가할 사진이 없습니다.")
                            }
                          }}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          전체 추가
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* 사용자 저장 데이터 현황 */}
                <div className="space-y-4 border-t pt-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-blue-800">내 저장 데이터 현황</h4>
                    <Badge variant="outline" className="text-xs">
                      {user?.name}님
                    </Badge>
                  </div>

                  {/* 데이터 요약 통계 */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/my-data/analyses">
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer">
                        <div className="text-lg font-bold text-green-700">{getUserAnalyses().length}</div>
                        <div className="text-xs text-green-600">분석 결과</div>
                      </div>
                    </Link>
                    <Link href="/my-data/images">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                        <div className="text-lg font-bold text-blue-700">{getUserImages().length}</div>
                        <div className="text-xs text-blue-600">업로드 이미지</div>
                      </div>
                    </Link>
                    <Link href="/my-data/cameras">
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer">
                        <div className="text-lg font-bold text-purple-700">{getUserCameras().length}</div>
                        <div className="text-xs text-purple-600">등록 카메라</div>
                      </div>
                    </Link>
                    <Link href="/my-data/plant-types">
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer">
                        <div className="text-lg font-bold text-orange-700">
                          {(() => {
                            const userPlantTypes = new Set(getUserAnalyses().map((a) => a.plantType))
                            return userPlantTypes.size
                          })()}
                        </div>
                        <div className="text-xs text-orange-600">분석 식물 종류</div>
                      </div>
                    </Link>
                  </div>

                  {/* 최근 분석 결과 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">최근 분석 결과</Label>
                      <span className="text-xs text-gray-500">최신 3건</span>
                    </div>

                    {(() => {
                      const recentAnalyses = getUserAnalyses()
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 3)

                      return recentAnalyses.length > 0 ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {recentAnalyses.map((analysis) => (
                            <div
                              key={analysis.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                                  <Leaf className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-gray-700">
                                    {plantTypes.find((p) => p.id === analysis.plantType)?.name || analysis.plantType}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(analysis.date).toLocaleDateString("ko-KR")}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-medium text-green-600">{analysis.result.plantHealth}%</div>
                                <div className="text-xs text-gray-500">건강도</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-xs">저장된 분석 결과가 없습니다</p>
                        </div>
                      )
                    })()}
                  </div>

                  {/* 식물 종류별 분석 현황 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">식물 종류별 분석 현황</Label>
                    {(() => {
                      const plantAnalyses = plantTypes
                        .map((plant) => ({
                          ...plant,
                          count: getUserAnalyses().filter((a) => a.plantType === plant.id).length,
                          avgHealth: (() => {
                            const analyses = getUserAnalyses().filter((a) => a.plantType === plant.id)
                            if (analyses.length === 0) return 0
                            return Math.round(
                                                             analyses.reduce((sum, a) => sum + (a.result.plantHealth || 0), 0) / analyses.length,
                            )
                          })(),
                        }))
                        .filter((plant) => plant.count > 0)
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 4)

                      return plantAnalyses.length > 0 ? (
                        <div className="space-y-1">
                          {plantAnalyses.map((plant) => (
                            <div key={plant.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-gray-600">{plant.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {plant.count}건
                                </Badge>
                                <span className="text-green-600 font-medium">{plant.avgHealth}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 text-center py-2">분석 기록이 없습니다</p>
                      )
                    })()}
                  </div>

                  {/* 최근 업로드 이미지 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">최근 업로드 이미지</Label>
                      <span className="text-xs text-gray-500">최신 4장</span>
                    </div>

                    {(() => {
                      const recentImages = getUserImages()
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                        .slice(0, 4)

                      return recentImages.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {recentImages.map((image) => (
                            <div key={image.id} className="relative group">
                              <Image
                                src={image.url || "/placeholder.svg"}
                                alt="최근 이미지"
                                width={60}
                                height={60}
                                className="w-full h-12 object-cover rounded border border-gray-200"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                                <span className="text-white text-xs opacity-0 group-hover:opacity-100">
                                  {image.timestamp.toLocaleDateString("ko-KR")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-xs">업로드된 이미지가 없습니다</p>
                        </div>
                      )
                    })()}
                  </div>

                  {/* 데이터 관리 버튼 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">데이터 관리</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          const stats = {
                            analyses: getUserAnalyses().length,
                            images: getUserImages().length,
                            cameras: getUserCameras().length,
                            plantTypes: new Set(getUserAnalyses().map((a) => a.plantType)).size,
                            totalHealth:
                              getUserAnalyses().length > 0
                                ? Math.round(
                                                                         getUserAnalyses().reduce((sum, a) => sum + (a.result.plantHealth || 0), 0) /
                                      getUserAnalyses().length,
                                  )
                                : 0,
                          }
                          alert(
                            `${user?.name}님의 데이터 현황:\n\n` +
                              `• 분석 결과: ${stats.analyses}건\n` +
                              `• 업로드 이미지: ${stats.images}장\n` +
                              `• 등록 카메라: ${stats.cameras}대\n` +
                              `• 분석 식물 종류: ${stats.plantTypes}종\n` +
                              `• 평균 건강도: ${stats.totalHealth}%`,
                          )
                        }}
                      >
                        <Info className="h-3 w-3 mr-1" />
                        전체 현황
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          if (getUserAnalyses().length === 0) {
                            alert("내보낼 데이터가 없습니다.")
                            return
                          }
                          // 전체 데이터를 선택하고 내보내기 실행
                          setSelectedDataRows(getUserAnalyses().map((a) => a.id))
                          setTimeout(() => {
                            exportToExcel()
                          }, 100)
                        }}
                      >
                        <Database className="h-3 w-3 mr-1" />
                        데이터 내보내기
                      </Button>
                    </div>
                  </div>

                  {/* 저장 공간 관리 */}
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-xs font-medium text-yellow-800 mb-2">저장 공간 관리</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-yellow-700">사용량:</span>
                        <span className="text-xs font-medium text-yellow-800">
                          {Math.round(getStorageSize() / 1024)} KB / 5MB
                        </span>
                      </div>
                      <div className="w-full bg-yellow-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{width: `${Math.min((getStorageSize() / (5 * 1024 * 1024)) * 100, 100)}%`}}
                        ></div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs h-7 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                          onClick={() => {
                            const cleaned = cleanupOldData()
                            if (cleaned) {
                              alert('30일 이상 된 데이터가 정리되었습니다.')
                              window.location.reload()
                            } else {
                              alert('정리할 오래된 데이터가 없습니다.')
                            }
                          }}
                        >
                          오래된 데이터 정리
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs h-7 border-red-300 text-red-700 hover:bg-red-100"
                          onClick={() => {
                            if (confirm('모든 저장된 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                              localStorage.removeItem(STORAGE_KEYS.UPLOADED_IMAGES)
                              localStorage.removeItem(STORAGE_KEYS.SAVED_ANALYSES)
                              localStorage.removeItem(STORAGE_KEYS.CAMERAS)
                              alert('모든 데이터가 삭제되었습니다.')
                              window.location.reload()
                            }
                          }}
                        >
                          전체 삭제
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 계정 정보 */}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">{user?.name?.charAt(0) || "U"}</span>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-700">{user?.name}</div>
                          <div className="text-xs text-gray-500">{user?.email}</div>
                        </div>
                      </div>
                      {user?.role === "admin" && (
                        <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                          관리자
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽 패널 */}
          <div className="space-y-6">
            {/* 식물 종류 선택 */}
            <Card className="border-emerald-200">
              <CardHeader className="bg-emerald-50">
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <Leaf className="h-5 w-5" />
                  식물 종류 선택
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-2">
                  <Select value={selectedPlantType} onValueChange={setSelectedPlantType}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="식물 종류를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {plantTypes.map((plant) => (
                        <SelectItem key={plant.id} value={plant.id}>
                          <div className="flex items-center gap-2">
                            <span>{plant.name}</span>
                            {getPlantTypeStats(plant.id) && (
                              <span className="text-xs text-gray-500">({getPlantTypeStats(plant.id)?.count}건)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddingPlantType(true)}
                    className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                    title="식물 종류 추가"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (selectedPlantType) {
                        setPlantTypeToDelete(selectedPlantType)
                      } else {
                        alert("삭제할 식물 종류를 먼저 선택해주세요.")
                      }
                    }}
                    disabled={!selectedPlantType}
                    className="border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="선택된 식물 종류 삭제"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {isAddingPlantType && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="새 식물 종류 이름"
                      value={newPlantTypeName}
                      onChange={(e) => setNewPlantTypeName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addNewPlantType()}
                    />
                    <Button onClick={addNewPlantType} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      추가
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsAddingPlantType(false)}>
                      취소
                    </Button>
                  </div>
                )}

                {/* 선택된 식물 종류의 통계 정보 */}
                {selectedPlantType && getPlantTypeStats(selectedPlantType) && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h4 className="text-sm font-medium text-emerald-800 mb-2">
                      {plantTypes.find((p) => p.id === selectedPlantType)?.name} 통계
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-emerald-600">분석 횟수:</span>
                        <span className="ml-1 font-medium">{getPlantTypeStats(selectedPlantType)?.count}회</span>
                      </div>
                      <div>
                        <span className="text-emerald-600">평균 건강도:</span>
                        <span className="ml-1 font-medium">{getPlantTypeStats(selectedPlantType)?.avgHealth}%</span>
                      </div>
                      <div>
                        <span className="text-emerald-600">최근 분석:</span>
                        <span className="ml-1 font-medium">{getPlantTypeStats(selectedPlantType)?.latestDate}</span>
                      </div>
                      <div>
                        <span className="text-emerald-600">최근 키:</span>
                        <span className="ml-1 font-medium">{getPlantTypeStats(selectedPlantType)?.latestHeight}cm</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 분석 모델 선택 */}
            <Card className="border-purple-200">
              <CardHeader className="bg-purple-50">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <BarChart3 className="h-5 w-5" />
                  분석 모델 선택
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Select value={selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={models.length > 0 ? "분석 모델을 선택하세요" : "사용 가능한 모델이 없습니다"}
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px] overflow-y-auto">
                    {models.length > 0 ? (
                      <>
                        {/* 무료 모델 그룹 */}
                        <div className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-50 border-b">
                          🆓 무료 모델 (기본 분석)
                        </div>
                        {models
                          .filter((model) => model.category === "무료")
                          .map((model) => (
                            <SelectItem
                              key={model.id}
                              value={model.id}
                              onMouseEnter={() => setHoveredModel(model.id)}
                              onMouseLeave={() => setHoveredModel(null)}
                              className="pl-4"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm">{model.name}</span>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                    {model.accuracy}
                                  </Badge>
                                  <Info className="h-3 w-3 text-gray-400" />
                                </div>
                              </div>
                            </SelectItem>
                          ))}

                        {/* 유료 모델 그룹 */}
                        <div className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border-b border-t mt-1">
                          💎 유료 모델 (전문 분석)
                        </div>
                        {models
                          .filter((model) => model.category === "유료")
                          .map((model) => (
                            <SelectItem
                              key={model.id}
                              value={model.id}
                              onMouseEnter={() => setHoveredModel(model.id)}
                              onMouseLeave={() => setHoveredModel(null)}
                              className="pl-4"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm">{model.name}</span>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                    {model.accuracy}
                                  </Badge>
                                  <Info className="h-3 w-3 text-gray-400" />
                                </div>
                              </div>
                            </SelectItem>
                          ))}

                        {/* 학습 AI 모델 그룹 */}
                        <div className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-50 border-b border-t mt-1">
                          🧠 학습 AI 모델 (지속 개선)
                        </div>
                        {models
                          .filter((model) => model.category === "학습AI")
                          .map((model) => (
                            <SelectItem
                              key={model.id}
                              value={model.id}
                              onMouseEnter={() => setHoveredModel(model.id)}
                              onMouseLeave={() => setHoveredModel(null)}
                              className="pl-4"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm">{model.name}</span>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                                    {model.accuracy}
                                  </Badge>
                                  <Info className="h-3 w-3 text-gray-400" />
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                      </>
                    ) : (
                      <SelectItem value="no-models" disabled>
                        백엔드에서 모델을 로드 중입니다...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {/* 모델 설명 표시 */}
                {selectedModel && models.length > 0 && (() => {
                  const model = models.find((m) => m.id === selectedModel);
                  if (!model) return null;
                  
                  const categoryColors = {
                    "무료": { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", badge: "bg-green-100 text-green-700" },
                    "유료": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-700" },
                    "학습AI": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", badge: "bg-purple-100 text-purple-700" }
                  };
                  
                  const colors = categoryColors[model.category as keyof typeof categoryColors] || categoryColors["무료"];
                  
                  return (
                    <div className={`p-4 ${colors.bg} rounded-lg border ${colors.border} space-y-3`}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className={`font-medium ${colors.text}`}>선택된 모델</h5>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${colors.badge} border-current`}>
                            {model.category}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${colors.badge} border-current`}>
                            정확도: {model.accuracy}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm ${colors.text} mb-2`}>
                          {model.description}
                        </p>
                        <p className={`text-xs ${colors.text} opacity-75`}>
                          제공: {model.provider}
                        </p>
                      </div>
                      {model.features && (
                        <div>
                          <h5 className={`font-medium ${colors.text} mb-2`}>분석 기능</h5>
                          <div className="flex flex-wrap gap-1">
                            {model.features.map((feature, index) => (
                              <Badge key={index} variant="secondary" className={`text-xs ${colors.badge}`}>
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 분석 항목 선택 (모델이 선택된 경우) */}
                {selectedModel && models.length > 0 && (() => {
                  const model = models.find((m) => m.id === selectedModel);
                  if (!model || !model.analysisItems) return null;
                  
                  return (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-yellow-800">분석 항목 선택</h5>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAnalysisItems(model.analysisItems.map(item => item.id))}
                            className="text-xs"
                          >
                            전체 선택
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAnalysisItems([])}
                            className="text-xs"
                          >
                            전체 해제
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-yellow-700">
                        분석하고 싶은 항목들을 선택하세요. 선택한 항목들만 분석 결과에 포함됩니다.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                        {model.analysisItems.map((item) => (
                          <div key={item.id} className="flex items-start space-x-3 p-2 bg-white rounded border">
                            <Checkbox
                              id={`analysis-${item.id}`}
                              checked={selectedAnalysisItems.includes(item.id)}
                              onCheckedChange={() => toggleAnalysisItem(item.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={`analysis-${item.id}`}
                                className="block text-sm font-medium text-gray-700 cursor-pointer"
                              >
                                {item.name}
                              </label>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.type}
                                </Badge>
                                {item.unit && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.unit}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">
                        선택된 항목: {selectedAnalysisItems.length}개 / 전체 {model.analysisItems.length}개
                      </div>
                    </div>
                  );
                })()}

                {/* 모델이 없을 때 안내 메시지 */}
                {models.length === 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <p className="text-sm text-gray-600">분석 모델을 백엔드에서 로드하고 있습니다.</p>
                    <p className="text-xs text-gray-500 mt-1">잠시 후 다시 시도해주세요.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 자동 분석 실행 */}
            <Card className="border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Play className="h-5 w-5" />
                  자동 분석 실행
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* 분석 준비 상태 체크 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {selectedAnalysisImages.length > 0 ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm ${selectedAnalysisImages.length > 0 ? "text-green-700" : "text-red-600"}`}
                    >
                      분석용 이미지: {selectedAnalysisImages.length}개 선택됨
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedPlantType ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${selectedPlantType ? "text-green-700" : "text-red-600"}`}>
                      식물 종류:{" "}
                      {selectedPlantType ? plantTypes.find((p) => p.id === selectedPlantType)?.name : "선택되지 않음"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedModel ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${selectedModel ? "text-green-700" : "text-red-600"}`}>
                      분석 모델: {selectedModel ? models.find((m) => m.id === selectedModel)?.name : "선택되지 않음"}
                    </span>
                  </div>
                </div>

                {/* 분석 준비 완료 상태 표시 */}
                {selectedAnalysisImages.length > 0 && selectedPlantType && selectedModel && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 font-medium">✅ 분석 준비 완료! 모든 조건이 충족되었습니다.</p>
                  </div>
                )}

                {/* 분석 시작 버튼 */}
                <Button
                  onClick={runAnalysis}
                  disabled={!selectedModel || selectedAnalysisImages.length === 0 || !selectedPlantType || isAnalyzing}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      분석 시작 ({selectedAnalysisImages.length}개 이미지)
                    </>
                  )}
                </Button>

                {/* 분석 불가 이유 안내 */}
                {(!selectedModel || selectedAnalysisImages.length === 0 || !selectedPlantType) && !isAnalyzing && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800 font-medium mb-2">
                      분석을 시작하려면 다음 조건을 모두 충족해야 합니다:
                    </p>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {selectedAnalysisImages.length === 0 && <li>• 분석할 이미지를 최소 1개 이상 선택해주세요</li>}
                      {!selectedPlantType && <li>• 식물 종류를 선택해주세요</li>}
                      {!selectedModel && <li>• 분석 모델을 선택해주세요</li>}
                    </ul>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="mt-4 space-y-2">
                    <Progress value={33} className="w-full" />
                    <p className="text-sm text-gray-600 text-center">
                      선택된 {selectedAnalysisImages.length}개 이미지 분석 중...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 분석 결과 */}
            {analysisResult && (
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center justify-between text-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      분석 결과
                    </div>
                    <Button
                      onClick={saveAnalysis}
                      disabled={!selectedPlantType}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      저장
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* 분석 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        🤖 모델: {models.find(m => m.id === analysisResult.modelId)?.name || "알 수 없음"}
                      </p>
                    </div>
                    {analysisResult.comparedImages && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          📊 {analysisResult.comparedImages.length}개 이미지 분석
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 분석 항목별 결과 표시 */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      분석 결과 ({analysisResult.selectedAnalysisItems.length}개 항목)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysisResult.selectedAnalysisItems.map((itemId) => {
                        const selectedModel = models.find(m => m.id === analysisResult.modelId)
                        const item = selectedModel?.analysisItems.find(ai => ai.id === itemId)
                        const value = analysisResult.analysisData[itemId]
                        
                        if (!item || value === undefined) return null

                        return (
                          <div key={itemId} className="p-4 bg-gray-50 rounded-lg border">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-gray-700">{item.name}</h5>
                                <Badge variant="outline" className="text-xs">
                                  {item.type}
                                </Badge>
                              </div>
                              
                              <div className="text-lg font-bold text-gray-900">
                                {item.type === "number" ? (
                                  <>
                                    {typeof value === 'number' ? value.toFixed(1) : value}
                                    {item.unit && <span className="text-sm text-gray-500 ml-1">{item.unit}</span>}
                                  </>
                                ) : item.type === "string" ? (
                                  <span className="text-base">{value}</span>
                                ) : item.type === "object" ? (
                                  <div className="text-sm space-y-1">
                                    {typeof value === 'object' && value !== null ? (
                                      Object.entries(value).map(([key, val]) => (
                                        <div key={key} className="flex justify-between">
                                          <span className="text-gray-600">{key}:</span>
                                          <span className="font-medium">{String(val)}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <span>{String(value)}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span>{String(value)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800">권장사항</h4>
                    <ul className="space-y-1">
                      {analysisResult.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <TrendingUp className="h-3 w-3 mt-1 text-green-500 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>


      </div>

      {/* 이미지 편집 모달 */}
      <ImageEditorModal
        isOpen={isEditorOpen}
        onClose={closeImageEditor}
        imageUrl={editingImage?.url || ""}
        onSave={handleImageSave}
      />

      {/* 식물 종류 삭제 확인 */}
      {plantTypeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">식물 종류 삭제</h3>
            <p className="text-gray-600 mb-6">
              선택된 "{plantTypes.find((p) => p.id === plantTypeToDelete)?.name}" 식물 종류를 삭제하시겠습니까?
              {getUserAnalyses().some((analysis) => analysis.plantType === plantTypeToDelete) && (
                <span className="block mt-2 text-red-600 text-sm">
                  ⚠️ 이 식물 종류에 저장된 분석 데이터도 함께 삭제됩니다.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setPlantTypeToDelete(null)}>
                취소
              </Button>
              <Button variant="destructive" onClick={() => deletePlantType(plantTypeToDelete)}>
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 카메라 삭제 확인 */}
      {cameraToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">카메라 삭제</h3>
            <p className="text-gray-600 mb-6">
              선택된 "{getUserCameras().find((c) => c.id === cameraToDelete)?.name}" 카메라를 삭제하시겠습니까?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCameraToDelete(null)}>
                취소
              </Button>
              <Button variant="destructive" onClick={() => deleteCamera(cameraToDelete)}>
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
