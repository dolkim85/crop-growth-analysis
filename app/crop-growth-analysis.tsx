'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Check,
  Thermometer,
  Droplets,
  Sun,
  Zap,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Download,
  ChevronUp,
  ChevronDown,
  Square,
  Images
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/components/auth-provider"

// 인터페이스 정의
interface UploadedImage {
  id: string
  file: File
  url: string
  timestamp: Date
  userId: string
}

interface EnvironmentData {
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

interface AnalysisResult {
  modelId: string
  selectedAnalysisItems: string[]
  analysisData: { [key: string]: any }
  environmentData?: EnvironmentData
  condition: string
  recommendations: string[]
  date: string
  comparedImages?: string[]
}

interface SavedAnalysis {
  id: string
  plantType: string
  date: string
  result: AnalysisResult
  userId: string
}

interface ObservationCamera {
  id: string
  name: string
  photos: { name: string; date: Date; environmentData?: EnvironmentData }[]
  userId: string
  interval?: number
  isActive?: boolean
}

// AI 모델 정의
const AI_MODELS = {
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
const STORAGE_KEYS = {
  UPLOADED_IMAGES: 'crop-analysis-uploaded-images',
  SAVED_ANALYSES: 'crop-analysis-saved-analyses',
  CAMERAS: 'crop-analysis-cameras',
  ENVIRONMENT_DATA: 'crop-analysis-environment-data'
}

// 날짜 포맷팅 함수
const formatDate = (date: Date | string | null, format?: string) => {
  if (!date) return "날짜 없음"
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return "잘못된 날짜"
  
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()
  
  if (format === "HH:mm") {
    return `${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`
  }
  return `${year}년 ${month}월 ${day}일`
}

export default function CropGrowthAnalysis() {
  const { user } = useAuth()
  const userId = user?.id || "anonymous"

  // 상태 변수들
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string>("plant-health-basic")
  const [selectedAnalysisItems, setSelectedAnalysisItems] = useState<string[]>([])
  const [selectedPlantType, setSelectedPlantType] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [selectedAnalysisImages, setSelectedAnalysisImages] = useState<string[]>([])
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([])
  const [cameras, setCameras] = useState<ObservationCamera[]>([])
  const [newCameraName, setNewCameraName] = useState("")

  const [selectedCamera, setSelectedCamera] = useState<string>("")

  // 환경 데이터 상태
  const [environmentData, setEnvironmentData] = useState<EnvironmentData>({
    innerTemperature: 25.5,
    outerTemperature: 22.3,
    innerHumidity: 68,
    rootZoneTemperature: 24.2,
    solarRadiation: 420,
    ph: 6.5,
    ec: 1.8,
    dissolvedOxygen: 7.2,
    timestamp: new Date()
  })

  // 환경 데이터 날짜 선택
  const [useCurrentEnvironmentData, setUseCurrentEnvironmentData] = useState(true)
  const [selectedEnvironmentDate, setSelectedEnvironmentDate] = useState<Date>(new Date())
  const [selectedEnvironmentTime, setSelectedEnvironmentTime] = useState<string>("12:00")
  const [historicalEnvironmentData, setHistoricalEnvironmentData] = useState<EnvironmentData[]>([])

  // AI 엔진 상태
  const [isAiEngineReady, setIsAiEngineReady] = useState(true)
  const [aiEngineStatus, setAiEngineStatus] = useState("online")
  const [backendConnectionStatus, setBackendConnectionStatus] = useState("checking")

  // 새로운 UI 상태
  const [showSavedAnalyses, setShowSavedAnalyses] = useState(false)
  const [selectedAnalysisDetail, setSelectedAnalysisDetail] = useState<SavedAnalysis | null>(null)
  const [analysisFilter, setAnalysisFilter] = useState({ plantType: "all", dateFrom: "", dateTo: "" })
  const [analysisSearchTerm, setAnalysisSearchTerm] = useState("")
  const [selectedAnalysesToDelete, setSelectedAnalysesToDelete] = useState<string[]>([])
  
  // V11.0 탭 시스템용 필터링 상태
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPlantType, setFilterPlantType] = useState("all")
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const [selectedDataRows, setSelectedDataRows] = useState<string[]>([])
  
  // 카메라 인터벌 촬영 관련
  const [cameraIntervals, setCameraIntervals] = useState<{ [cameraId: string]: { interval: number, isActive: boolean } }>({})
  const [selectedCameraPhotos, setSelectedCameraPhotos] = useState<string[]>([])
  const [showCameraPhotos, setShowCameraPhotos] = useState<string | null>(null)
  
  // 성장 그래프 상태
  const [showGrowthChart, setShowGrowthChart] = useState(false)
  const [selectedPlantForChart, setSelectedPlantForChart] = useState<string>("")

  // 식물 종류 데이터
  const plantTypes = [
    { id: "tomato", name: "토마토" },
    { id: "cucumber", name: "오이" },
    { id: "pepper", name: "고추" },
    { id: "lettuce", name: "상추" },
    { id: "strawberry", name: "딸기" },
    { id: "spinach", name: "시금치" }
  ]

  // 컴포넌트 초기화
  useEffect(() => {
    initializeComponent()
  }, [userId])

  // AI 엔진 상태 모니터링
  useEffect(() => {
    const interval = setInterval(() => {
      checkAiEngineStatus()
    }, 5000) // 5초마다 체크

    return () => clearInterval(interval)
  }, [])

  const initializeComponent = async () => {
    try {
      setIsLoading(true)
      
      // 로컬 스토리지에서 데이터 로드
      loadFromStorage()
      
      // AI 엔진 초기화
      await initializeAiEngine()
      
      // 백엔드 연결 확인
      await checkBackendConnection()
      
      // 환경 데이터 시뮬레이션 시작
      startEnvironmentDataSimulation()
      
      setIsLoading(false)
    } catch (error) {
      console.error("초기화 오류:", error)
      setIsLoading(false)
    }
  }

  const loadFromStorage = () => {
    try {
      // 업로드된 이미지 로드
      const savedImages = localStorage.getItem(STORAGE_KEYS.UPLOADED_IMAGES)
      if (savedImages) {
        const images = JSON.parse(savedImages)
        setUploadedImages(images.filter((img: any) => img.userId === userId))
      }

      // 저장된 분석 결과 로드
      const savedAnalysesData = localStorage.getItem(STORAGE_KEYS.SAVED_ANALYSES)
      if (savedAnalysesData) {
        const analyses = JSON.parse(savedAnalysesData)
        setSavedAnalyses(analyses.filter((analysis: any) => analysis.userId === userId))
      }

      // 카메라 데이터 로드
      const savedCameras = localStorage.getItem(STORAGE_KEYS.CAMERAS)
      if (savedCameras) {
        const camerasData = JSON.parse(savedCameras)
        setCameras(camerasData.filter((camera: any) => camera.userId === userId))
      }

      // 환경 데이터 히스토리 생성
      generateEnvironmentHistory()
    } catch (error) {
      console.error("스토리지 로드 오류:", error)
    }
  }

  const generateEnvironmentHistory = () => {
    // 지난 7일간의 환경 데이터 히스토리 생성
    const history: EnvironmentData[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      for (let hour = 0; hour < 24; hour += 2) {
        const timestamp = new Date(date)
        timestamp.setHours(hour, 0, 0, 0)
        
        history.push({
          innerTemperature: 25.5 + (Math.random() - 0.5) * 4,
          outerTemperature: 22.3 + (Math.random() - 0.5) * 6,
          innerHumidity: 68 + (Math.random() - 0.5) * 20,
          rootZoneTemperature: 24.2 + (Math.random() - 0.5) * 3,
          solarRadiation: hour >= 6 && hour <= 18 ? 420 + (Math.random() - 0.5) * 200 : Math.random() * 50,
          ph: 6.5 + (Math.random() - 0.5) * 1,
          ec: 1.8 + (Math.random() - 0.5) * 0.8,
          dissolvedOxygen: 7.2 + (Math.random() - 0.5) * 2,
          timestamp
        })
      }
    }
    setHistoricalEnvironmentData(history)
  }

  const initializeAiEngine = async () => {
    try {
      console.log("🚀 AI 엔진 초기화 시작")
      
      // 다중 모델 초기화 시뮬레이션
      for (const modelId of Object.keys(AI_MODELS)) {
        console.log(`📦 ${AI_MODELS[modelId as keyof typeof AI_MODELS].name} 로딩...`)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      setIsAiEngineReady(true)
      setAiEngineStatus("online")
      console.log("✅ AI 엔진 초기화 완료")
    } catch (error) {
      console.error("AI 엔진 초기화 실패:", error)
      setIsAiEngineReady(false)
      setAiEngineStatus("offline")
    }
  }

  const checkBackendConnection = async () => {
    try {
      setBackendConnectionStatus("checking")
      
      // 다중 포트 체크 시뮬레이션
      const ports = [5000, 5001, 5002, 8000, 8080, 3001]
      let connected = false
      
      for (const port of ports) {
        try {
          console.log(`🔍 포트 ${port} 연결 확인 중...`)
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // 랜덤하게 연결 성공/실패 시뮬레이션
          if (Math.random() > 0.7) {
            console.log(`✅ 포트 ${port}에서 백엔드 연결 성공`)
            connected = true
            break
          }
        } catch (error) {
          console.log(`❌ 포트 ${port} 연결 실패`)
        }
      }
      
      setBackendConnectionStatus(connected ? "connected" : "disconnected")
    } catch (error) {
      console.error("백엔드 연결 확인 실패:", error)
      setBackendConnectionStatus("error")
    }
  }

  const checkAiEngineStatus = () => {
    // 실시간 AI 엔진 상태 체크
    if (Math.random() > 0.95) { // 5% 확률로 일시적 오프라인
      setAiEngineStatus("maintenance")
      setTimeout(() => {
        setAiEngineStatus("online")
      }, 3000)
    }
  }

  const startEnvironmentDataSimulation = () => {
    const interval = setInterval(() => {
      setEnvironmentData(prev => ({
        ...prev,
        innerTemperature: 25.5 + (Math.random() - 0.5) * 2,
        outerTemperature: 22.3 + (Math.random() - 0.5) * 3,
        innerHumidity: 68 + (Math.random() - 0.5) * 10,
        rootZoneTemperature: 24.2 + (Math.random() - 0.5) * 1.5,
        solarRadiation: 420 + (Math.random() - 0.5) * 100,
        ph: 6.5 + (Math.random() - 0.5) * 0.5,
        ec: 1.8 + (Math.random() - 0.5) * 0.4,
        dissolvedOxygen: 7.2 + (Math.random() - 0.5) * 1,
        timestamp: new Date()
      }))
    }, 30000) // 30초마다 업데이트

    return () => clearInterval(interval)
  }

  // 이미지 업로드 처리
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const newImages: UploadedImage[] = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file),
      timestamp: new Date(),
      userId
    }))
    
    const updatedImages = [...uploadedImages, ...newImages]
    setUploadedImages(updatedImages)
    
    // 로컬 스토리지에 저장
    try {
      localStorage.setItem(STORAGE_KEYS.UPLOADED_IMAGES, JSON.stringify(updatedImages))
    } catch (error) {
      console.error("이미지 저장 오류:", error)
    }
  }

  // 이미지 선택 토글
  const toggleAnalysisImageSelection = (imageId: string) => {
    setSelectedAnalysisImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  // 분석 항목 선택 처리
  const handleAnalysisItemChange = (itemId: string, checked: boolean) => {
    setSelectedAnalysisItems(prev => 
      checked 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    )
  }

  // 분석 실행
  const runAnalysis = async () => {
    if (!isAiEngineReady) {
      alert("AI 엔진이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.")
      return
    }

    if ((selectedAnalysisImages || []).length === 0) {
      alert("분석할 이미지를 선택해주세요.")
      return
    }

    if ((selectedAnalysisItems || []).length === 0) {
      alert("분석 항목을 선택해주세요.")
      return
    }

    if (!selectedPlantType) {
      alert("식물 종류를 선택해주세요.")
      return
    }

    setIsAnalyzing(true)
    
    try {
      const selectedImageObjects = (uploadedImages || []).filter(img => (selectedAnalysisImages || []).includes(img.id))
      const analysisData: { [key: string]: any } = {}
      
      // 분석 시점 환경 데이터 결정
      const analysisEnvironmentData = useCurrentEnvironmentData 
        ? environmentData 
        : getEnvironmentDataForDateTime(selectedEnvironmentDate, selectedEnvironmentTime)
      
      console.log("🔍 하이브리드 AI 분석 시작")
      console.log("🌡️ 분석에 사용할 환경 데이터:", analysisEnvironmentData)
      
      if (backendConnectionStatus === "connected") {
        console.log("🌐 백엔드 AI 서버 분석 모드")
        await new Promise(resolve => setTimeout(resolve, 3000))
      } else {
        console.log("💻 클라이언트 사이드 AI 분석 모드")
        await performClientSideAnalysis(selectedImageObjects, analysisEnvironmentData)
      }
      
      // 선택된 분석 항목에 따른 결과 생성
      const selectedModelConfig = AI_MODELS[selectedModel as keyof typeof AI_MODELS] || AI_MODELS["plant-health-basic"]
      
      for (const itemId of (selectedAnalysisItems || [])) {
        const item = selectedModelConfig.analysisItems.find(ai => ai.id === itemId)
        if (item) {
          if (item.type === "string") {
            analysisData[itemId] = generateMockStringResult(itemId)
          } else if (item.type === "number") {
            analysisData[itemId] = Math.floor(Math.random() * 100) + 1
          } else if (item.type === "object") {
            analysisData[itemId] = generateMockObjectResult(itemId)
          }
        }
      }

      // 분석 결과 생성 (환경 데이터 포함)
      const result: AnalysisResult = {
        modelId: selectedModel,
        selectedAnalysisItems: selectedAnalysisItems || [],
        analysisData,
        environmentData: analysisEnvironmentData, // 분석 시점의 정확한 환경 데이터 저장
        condition: analysisData.health || "양호",
        recommendations: generateRecommendations(analysisData, analysisEnvironmentData) || [],
        date: new Date().toISOString(),
        comparedImages: (selectedImageObjects || []).map(img => img.id)
      }

      setAnalysisResult(result)
      alert("🎉 하이브리드 AI 분석이 완료되었습니다!")

    } catch (error) {
      console.error("분석 오류:", error)
      alert("분석 중 오류가 발생했습니다.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const performClientSideAnalysis = async (images: UploadedImage[], environmentContext?: EnvironmentData) => {
    console.log("🧠 클라이언트 AI 엔진 실행")
    console.log("🌡️ 환경 데이터 연동:", environmentContext)
    
    for (const image of images) {
      // Canvas API 기반 픽셀 분석 시뮬레이션
      console.log(`📊 ${image.file.name} 픽셀 분석 중...`)
      
      // 환경 데이터 기반 분석 조건 적용
      if (environmentContext) {
        console.log(`🌡️ 분석 시점 환경 조건:`)
        console.log(`   - 내부온도: ${environmentContext.innerTemperature}°C`)
        console.log(`   - 습도: ${environmentContext.innerHumidity}%`)
        console.log(`   - pH: ${environmentContext.ph}`)
        console.log(`   - EC: ${environmentContext.ec}dS/m`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const generateMockStringResult = (itemId: string) => {
    const results: { [key: string]: string[] } = {
      health: ["건강함", "양호", "주의 필요", "치료 필요"],
      classification: ["토마토", "상추", "고추", "오이", "딸기"],
      diagnosis: ["정상", "잎반점병 의심", "영양 결핍", "과습 상태"],
      growth_stage: ["발아기", "생장기", "개화기", "결실기"],
      treatment: ["물 공급 조절", "영양분 보충", "환기 개선", "병충해 방제"]
    }
    
    const options = results[itemId] || ["정상"]
    return options[Math.floor(Math.random() * options.length)]
  }

  const generateMockObjectResult = (itemId: string) => {
    const objectResults: { [key: string]: any } = {
      disease: {
        detected: Math.random() > 0.7,
        type: ["잎반점병", "노균병", "바이러스"][Math.floor(Math.random() * 3)],
        severity: Math.floor(Math.random() * 5) + 1
      },
      growth: {
        stage: ["발아기", "생장기", "개화기", "결실기"][Math.floor(Math.random() * 4)],
        progress: Math.floor(Math.random() * 100),
        leaf_count: Math.floor(Math.random() * 20) + 5
      },
      nutrition: {
        nitrogen: Math.floor(Math.random() * 100),
        phosphorus: Math.floor(Math.random() * 100),
        potassium: Math.floor(Math.random() * 100)
      },
      leaf_analysis: {
        color: ["진녹색", "연녹색", "황녹색"][Math.floor(Math.random() * 3)],
        size: Math.floor(Math.random() * 10) + 3,
        condition: ["건강", "양호", "주의"][Math.floor(Math.random() * 3)]
      },
      expert_analysis: {
        overall_score: Math.floor(Math.random() * 30) + 70,
        growth_potential: ["높음", "보통", "낮음"][Math.floor(Math.random() * 3)],
        care_level: ["쉬움", "보통", "어려움"][Math.floor(Math.random() * 3)]
      }
    }
    
    return objectResults[itemId] || { status: "정상" }
  }

  const generateRecommendations = (analysisData: any, environmentData?: EnvironmentData) => {
    const baseRecommendations = [
      "현재 환경 조건이 양호합니다.",
      "정기적인 모니터링을 계속해주세요.",
      "수분 공급 상태를 확인해주세요.",
      "영양분 보충을 고려해보세요.",
      "통풍을 개선해주세요.",
      "온도 관리에 주의하세요."
    ]
    
    // 환경 데이터 기반 권장사항 추가
    const environmentRecommendations = []
    
    if (environmentData) {
      if (environmentData.innerTemperature > 30) {
        environmentRecommendations.push("온도가 높습니다. 냉각 시스템을 가동하세요.")
      } else if (environmentData.innerTemperature < 18) {
        environmentRecommendations.push("온도가 낮습니다. 난방을 강화하세요.")
      }
      
      if (environmentData.innerHumidity > 80) {
        environmentRecommendations.push("습도가 높습니다. 제습 및 환기를 강화하세요.")
      } else if (environmentData.innerHumidity < 40) {
        environmentRecommendations.push("습도가 낮습니다. 가습을 고려하세요.")
      }
      
      if (environmentData.ph < 5.5) {
        environmentRecommendations.push("pH가 낮습니다. 알칼리성 용액을 추가하세요.")
      } else if (environmentData.ph > 7.5) {
        environmentRecommendations.push("pH가 높습니다. 산성 용액을 추가하세요.")
      }
      
      if (environmentData.ec < 1.0) {
        environmentRecommendations.push("영양분 농도가 낮습니다. 양액을 보충하세요.")
      } else if (environmentData.ec > 3.0) {
        environmentRecommendations.push("영양분 농도가 높습니다. 물로 희석하세요.")
      }
    }
    
    // 기본 권장사항과 환경 기반 권장사항 결합
    const allRecommendations = [...environmentRecommendations, ...baseRecommendations]
    return allRecommendations.slice(0, Math.floor(Math.random() * 3) + 2)
  }

  // 분석 결과 저장
  const saveAnalysis = () => {
    if (!analysisResult || !selectedPlantType) return

    const newAnalysis: SavedAnalysis = {
      id: Date.now().toString(),
      plantType: selectedPlantType,
      date: new Date().toISOString(),
      result: analysisResult,
      userId
    }

    const updatedAnalyses = [newAnalysis, ...(savedAnalyses || [])]
    setSavedAnalyses(updatedAnalyses)

    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_ANALYSES, JSON.stringify(updatedAnalyses))
      alert("분석 결과가 저장되었습니다!")
    } catch (error) {
      console.error("저장 오류:", error)
      alert("저장 중 오류가 발생했습니다.")
    }
  }

  // AI 엔진 복구
  const recoverAiEngine = async () => {
    try {
      setAiEngineStatus("recovering")
      await initializeAiEngine()
      await checkBackendConnection()
      alert("🛠️ AI 엔진이 복구되었습니다!")
    } catch (error) {
      alert("❌ AI 엔진 복구에 실패했습니다")
    }
  }

  // 카메라 추가
  const addCamera = () => {
    if (!newCameraName.trim()) return

    const newCamera: ObservationCamera = {
      id: Date.now().toString(),
      name: newCameraName,
      photos: [],
      userId,
      interval: 60, // 기본 60분 간격
      isActive: false
    }

    const updatedCameras = [...(cameras || []), newCamera]
    setCameras(updatedCameras)
    setNewCameraName("")

    try {
      localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(updatedCameras))
    } catch (error) {
      console.error("카메라 저장 오류:", error)
    }
  }

  // 분석 데이터 필터링
  const getFilteredAnalyses = () => {
    let filtered = savedAnalyses || []
    
    // 식물 종류 필터
    if (analysisFilter.plantType !== "all") {
      filtered = filtered.filter(analysis => analysis.plantType === analysisFilter.plantType)
    }
    
    // 날짜 필터 개선
    if (analysisFilter.dateFrom) {
      const startDate = new Date(analysisFilter.dateFrom + 'T00:00:00')
      filtered = filtered.filter(analysis => 
        new Date(analysis.date) >= startDate
      )
    }
    if (analysisFilter.dateTo) {
      const endDate = new Date(analysisFilter.dateTo + 'T23:59:59')
      filtered = filtered.filter(analysis => 
        new Date(analysis.date) <= endDate
      )
    }
    
    // 검색어 필터 개선
    if (analysisSearchTerm) {
      const searchLower = analysisSearchTerm.toLowerCase()
      filtered = filtered.filter(analysis => 
        plantTypes.find(p => p.id === analysis.plantType)?.name.toLowerCase().includes(searchLower) ||
        analysis.result.condition.toLowerCase().includes(searchLower) ||
        analysis.result.recommendations.some(rec => rec.toLowerCase().includes(searchLower))
      )
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // 분석 삭제
  const deleteSelectedAnalyses = () => {
    if (selectedAnalysesToDelete.length === 0) return
    
    if (confirm(`선택된 ${selectedAnalysesToDelete.length}개의 분석 결과를 삭제하시겠습니까?`)) {
      const updatedAnalyses = savedAnalyses.filter(analysis => 
        !selectedAnalysesToDelete.includes(analysis.id)
      )
      setSavedAnalyses(updatedAnalyses)
      setSelectedAnalysesToDelete([])
      
      try {
        localStorage.setItem(STORAGE_KEYS.SAVED_ANALYSES, JSON.stringify(updatedAnalyses))
        alert("분석 결과가 삭제되었습니다.")
      } catch (error) {
        console.error("삭제 오류:", error)
      }
    }
  }

  // 분석 데이터 엑셀 내보내기
  const exportAnalysisData = () => {
    const dataToExport = getFilteredAnalyses()
    
    // 엑셀 형식에 맞게 데이터 변환
    const excelData = dataToExport.map((analysis, index) => ({
      '번호': index + 1,
      '식물 종류': plantTypes.find(p => p.id === analysis.plantType)?.name || analysis.plantType,
      '분석 날짜': formatDate(new Date(analysis.date)),
      '상태': analysis.result.condition,
      'AI 모델': AI_MODELS[analysis.result.modelId as keyof typeof AI_MODELS]?.name || analysis.result.modelId,
      '권장사항': analysis.result.recommendations.join('; '),
      '환경 온도': analysis.result.environmentData?.innerTemperature?.toFixed(1) + '°C' || 'N/A',
      '환경 습도': analysis.result.environmentData?.innerHumidity?.toFixed(0) + '%' || 'N/A',
      'pH': analysis.result.environmentData?.ph?.toFixed(1) || 'N/A',
      'EC': analysis.result.environmentData?.ec?.toFixed(1) + 'dS/m' || 'N/A'
    }))

    // CSV 형식으로 변환 (엑셀에서 열 수 있음)
    const headers = Object.keys(excelData[0] || {})
    const csvContent = [
      headers.join(','),
      ...excelData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n')

    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `작물분석데이터_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  // 카메라 인터벌 설정
  const setCameraInterval = (cameraId: string, interval: number) => {
    setCameraIntervals(prev => ({
      ...prev,
      [cameraId]: { ...prev[cameraId], interval }
    }))
  }

  // 카메라 자동 촬영 시작/중지
  const toggleCameraAutoCapture = (cameraId: string) => {
    const camera = cameras.find(c => c.id === cameraId)
    if (!camera) return

    const isCurrentlyActive = cameraIntervals[cameraId]?.isActive || false
    
    setCameraIntervals(prev => ({
      ...prev,
      [cameraId]: { 
        interval: prev[cameraId]?.interval || 60,
        isActive: !isCurrentlyActive 
      }
    }))

    // 카메라 상태도 업데이트
    setCameras(prev => prev.map(cam => 
      cam.id === cameraId 
        ? { ...cam, isActive: !isCurrentlyActive }
        : cam
    ))

    if (!isCurrentlyActive) {
      // 자동 촬영 시작 - 실제 환경에서는 실제 인터벌 설정
      const intervalMs = (cameraIntervals[cameraId]?.interval || 60) * 60 * 1000
      
      // 시뮬레이션: 5초마다 사진 촬영 (실제로는 설정된 간격)
      const simulationInterval = setInterval(() => {
        setCameras(prevCameras => prevCameras.map(cam => {
          if (cam.id === cameraId && cam.isActive) {
            const newPhoto = {
              name: `auto_${Date.now()}.jpg`,
              date: new Date(),
              environmentData: { ...environmentData } // 현재 환경 데이터 포함
            }
            return { ...cam, photos: [...cam.photos, newPhoto] }
          }
          return cam
        }))
      }, 5000) // 시뮬레이션용 5초 간격
      
      alert(`${camera.name}의 자동 촬영이 시작되었습니다.\n간격: ${cameraIntervals[cameraId]?.interval || 60}분마다\n환경 데이터도 함께 저장됩니다.`)
    } else {
      alert(`${camera.name}의 자동 촬영이 중지되었습니다.`)
    }
  }

  // 카메라 사진을 분석용 이미지로 추가
  const addCameraPhotosToAnalysis = () => {
    if (selectedCameraPhotos.length === 0) return
    
    // 실제로는 카메라 사진 파일들을 업로드된 이미지로 변환하는 로직이 필요
    alert(`${selectedCameraPhotos.length}개의 카메라 사진이 분석용 이미지에 추가되었습니다.`)
    setSelectedCameraPhotos([])
  }

  // 카메라 삭제
  const deleteCamera = (cameraId: string) => {
    const camera = cameras.find(c => c.id === cameraId)
    if (!camera) return

    if (confirm(`"${camera.name}" 카메라를 삭제하시겠습니까? 저장된 사진도 함께 삭제됩니다.`)) {
      const updatedCameras = cameras.filter(c => c.id !== cameraId)
      setCameras(updatedCameras)
      
      // 카메라 인터벌 상태도 제거
      setCameraIntervals(prev => {
        const newIntervals = { ...prev }
        delete newIntervals[cameraId]
        return newIntervals
      })

      // 갤러리가 열려있다면 닫기
      if (showCameraPhotos === cameraId) {
        setShowCameraPhotos(null)
      }

      try {
        localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(updatedCameras))
        alert("카메라가 삭제되었습니다.")
      } catch (error) {
        console.error("카메라 삭제 오류:", error)
      }
    }
  }

  // 선택된 시간의 환경 데이터 가져오기
  const getEnvironmentDataForDateTime = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const targetDateTime = new Date(date)
    targetDateTime.setHours(hours, minutes, 0, 0)

    // 가장 가까운 시간의 데이터 찾기
    const closest = (historicalEnvironmentData || []).length > 0 
      ? (historicalEnvironmentData || []).reduce((prev, curr) => {
          const prevDiff = Math.abs(prev.timestamp.getTime() - targetDateTime.getTime())
          const currDiff = Math.abs(curr.timestamp.getTime() - targetDateTime.getTime())
          return currDiff < prevDiff ? curr : prev
        })
      : null

    return closest || environmentData
  }

  // 성장 그래프 데이터 생성
  const generateGrowthChartData = (plantType: string) => {
    const plantAnalyses = savedAnalyses
      .filter(analysis => analysis.plantType === plantType)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (plantAnalyses.length === 0) return null

    return {
      plantName: plantTypes.find(p => p.id === plantType)?.name || plantType,
      totalAnalyses: plantAnalyses.length,
      dateRange: {
        start: formatDate(new Date(plantAnalyses[0].date)),
        end: formatDate(new Date(plantAnalyses[plantAnalyses.length - 1].date))
      },
      healthTrend: plantAnalyses.map((analysis, index) => ({
        date: formatDate(new Date(analysis.date)),
        condition: analysis.result.condition,
        score: analysis.result.condition === "양호" ? 90 + Math.random() * 10 : 
               analysis.result.condition === "보통" ? 60 + Math.random() * 20 : 
               30 + Math.random() * 20,
        temperature: analysis.result.environmentData?.innerTemperature || 25,
        humidity: analysis.result.environmentData?.innerHumidity || 65,
        ph: analysis.result.environmentData?.ph || 6.5
      })),
      recommendations: plantAnalyses.reduce((acc, analysis) => {
        analysis.result.recommendations.forEach(rec => {
          if (!acc.includes(rec)) acc.push(rec)
        })
        return acc
      }, [] as string[]).slice(0, 5)
    }
  }

  // 성장 그래프 표시
  const showPlantGrowthChart = (plantType: string) => {
    setSelectedPlantForChart(plantType)
    setShowGrowthChart(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">V12.0 하이브리드 AI 시스템을 초기화하고 있습니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-green-800 flex items-center justify-center gap-3">
            <Leaf className="h-10 w-10" />
            V11.0 전문가용 스마트팜 분석 시스템
          </h1>
          <p className="text-green-600">전문가급 AI 기반 작물 모니터링 및 성장 분석 플랫폼</p>
          {user && (
            <p className="text-sm text-green-700">
              <span className="font-medium">{user.name}</span>님의 전문 분석 대시보드
            </p>
          )}
          <div className="flex justify-center gap-2 mt-2">
            <Badge variant={aiEngineStatus === "online" ? "default" : "destructive"}>
              AI 엔진: {aiEngineStatus === "online" ? "온라인" : aiEngineStatus === "maintenance" ? "점검중" : "오프라인"}
            </Badge>
            <Badge variant={backendConnectionStatus === "connected" ? "default" : "secondary"}>
              백엔드: {backendConnectionStatus === "connected" ? "연결됨" : backendConnectionStatus === "checking" ? "확인중" : "클라이언트 모드"}
            </Badge>
            {aiEngineStatus !== "online" && (
              <Button size="sm" variant="outline" onClick={recoverAiEngine}>
                <RefreshCw className="h-3 w-3 mr-1" />
                🛠️ 복구
              </Button>
            )}
          </div>
        </div>

        {/* V11.0 스타일 전문가용 탭 시스템 */}
        <Card className="border-gray-300 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
            <CardTitle className="flex items-center gap-2 text-xl">
              <BarChart3 className="h-6 w-6" />
              전문가용 분석 대시보드
              <Badge variant="secondary" className="ml-2 text-blue-900">
                Professional v11.0 UI
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-none border-b">
                <TabsTrigger value="analysis" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    실시간 분석
                  </div>
                </TabsTrigger>
                <TabsTrigger value="data-management" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    작물 데이터
                  </div>
                </TabsTrigger>
                <TabsTrigger value="observation-camera" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    실시간 모니터링
                  </div>
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    시스템 설정
                  </div>
                </TabsTrigger>
              </TabsList>

              {/* 실시간 분석 탭 */}
              <TabsContent value="analysis" className="space-y-6 p-6">
                {/* 환경 데이터 대시보드 */}
                <Card className="border-blue-200">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <TrendingUp className="h-5 w-5" />
                      실시간 스마트팜 환경 데이터
                      <Badge variant="secondary" className="ml-2">
                        {aiEngineStatus === "online" ? "AI 엔진 온라인" : "AI 엔진 오프라인"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* 환경 데이터 선택 옵션 */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="current-data"
                            checked={useCurrentEnvironmentData}
                            onCheckedChange={(checked) => setUseCurrentEnvironmentData(checked === true)}
                          />
                          <Label htmlFor="current-data">현재 환경 데이터 사용</Label>
                        </div>
                        {!useCurrentEnvironmentData && (
                          <div className="flex items-center gap-4">
                            <div>
                              <Label className="text-sm">날짜 선택</Label>
                              <Input
                                type="date"
                                value={selectedEnvironmentDate.toISOString().split('T')[0]}
                                onChange={(e) => setSelectedEnvironmentDate(new Date(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">시간 선택</Label>
                              <Input
                                type="time"
                                value={selectedEnvironmentTime}
                                onChange={(e) => setSelectedEnvironmentTime(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {!useCurrentEnvironmentData && (
                        <div className="text-sm text-gray-600">
                          <p>📅 선택된 시간: {formatDate(selectedEnvironmentDate)} {selectedEnvironmentTime}</p>
                          <p>🌡️ 환경 상태: <span className="font-medium text-green-600">적정</span></p>
                        </div>
                      )}
                    </div>

                    {/* 환경 데이터 표시 */}
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                      {(() => {
                        const displayData = useCurrentEnvironmentData 
                          ? environmentData 
                          : getEnvironmentDataForDateTime(selectedEnvironmentDate, selectedEnvironmentTime)
                        
                        return (
                          <>
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Thermometer className="h-4 w-4 text-red-500 mr-1" />
                                <Label className="text-sm text-gray-600">내부온도</Label>
                              </div>
                              <div className="text-lg font-bold text-red-600">
                                {displayData.innerTemperature.toFixed(1)}°C
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Thermometer className="h-4 w-4 text-red-400 mr-1" />
                                <Label className="text-sm text-gray-600">외부온도</Label>
                              </div>
                              <div className="text-lg font-bold text-red-500">
                                {displayData.outerTemperature.toFixed(1)}°C
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Thermometer className="h-4 w-4 text-orange-500 mr-1" />
                                <Label className="text-sm text-gray-600">근권온도</Label>
                              </div>
                              <div className="text-lg font-bold text-orange-600">
                                {displayData.rootZoneTemperature.toFixed(1)}°C
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Droplets className="h-4 w-4 text-blue-500 mr-1" />
                                <Label className="text-sm text-gray-600">내부습도</Label>
                              </div>
                              <div className="text-lg font-bold text-blue-600">
                                {displayData.innerHumidity.toFixed(0)}%
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Sun className="h-4 w-4 text-yellow-500 mr-1" />
                                <Label className="text-sm text-gray-600">일사량</Label>
                              </div>
                              <div className="text-lg font-bold text-yellow-600">
                                {displayData.solarRadiation.toFixed(0)}W/m²
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                                <Label className="text-sm text-gray-600">PH</Label>
                              </div>
                              <div className="text-lg font-bold text-green-600">
                                {displayData.ph.toFixed(1)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Zap className="h-4 w-4 text-purple-500 mr-1" />
                                <Label className="text-sm text-gray-600">EC</Label>
                              </div>
                              <div className="text-lg font-bold text-purple-600">
                                {displayData.ec.toFixed(1)}dS/m
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <div className="w-3 h-3 bg-teal-500 rounded-full mr-1"></div>
                                <Label className="text-sm text-gray-600">DO</Label>
                              </div>
                              <div className="text-lg font-bold text-teal-600">
                                {displayData.dissolvedOxygen.toFixed(1)}mg/L
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500">
                        {useCurrentEnvironmentData 
                          ? `마지막 업데이트: ${formatDate(environmentData.timestamp)} ${formatDate(environmentData.timestamp, "HH:mm")}`
                          : `선택된 시간 데이터: ${formatDate(selectedEnvironmentDate)} ${selectedEnvironmentTime}`
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 분석 인터페이스 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 이미지 업로드 */}
                  <Card className="border-emerald-200">
                    <CardHeader className="bg-emerald-50">
                      <CardTitle className="flex items-center gap-2 text-emerald-800">
                        <Upload className="h-5 w-5" />
                        이미지 업로드
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="image-upload" className="block text-sm font-medium mb-2">
                            이미지 파일 선택
                          </Label>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="cursor-pointer"
                          />
                        </div>

                        {uploadedImages.length > 0 ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">
                                업로드된 이미지 ({uploadedImages.length}개)
                              </Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setUploadedImages([])
                                  setSelectedAnalysisImages([])
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                전체 삭제
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                              {uploadedImages.map((image) => (
                                <div key={image.id} className="relative group">
                                  <div
                                    className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                                      selectedAnalysisImages.includes(image.id)
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-200 hover:border-emerald-400"
                                    }`}
                                    onClick={() => toggleAnalysisImageSelection(image.id)}
                                  >
                                    <img
                                      src={image.url}
                                      alt="업로드된 이미지"
                                      className="w-full h-24 object-cover"
                                    />
                                    {selectedAnalysisImages.includes(image.id) && (
                                      <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-green-700" />
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setUploadedImages(prev => prev.filter(img => img.id !== image.id))
                                      setSelectedAnalysisImages(prev => prev.filter(id => id !== image.id))
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">아직 업로드된 이미지가 없습니다.</p>
                            <p className="text-xs">위의 파일 선택 버튼을 사용해서 이미지를 업로드해주세요.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 분석 설정 */}
                  <Card className="border-purple-200">
                    <CardHeader className="bg-purple-50">
                      <CardTitle className="flex items-center gap-2 text-purple-800">
                        <Leaf className="h-5 w-5" />
                        분석 설정
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">식물 종류</Label>
                          <Select value={selectedPlantType} onValueChange={setSelectedPlantType}>
                            <SelectTrigger>
                              <SelectValue placeholder="식물 종류 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {plantTypes.map((plant) => (
                                <SelectItem key={plant.id} value={plant.id}>
                                  {plant.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">AI 모델 선택</Label>
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger>
                              <SelectValue placeholder="AI 모델 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(AI_MODELS).map(([id, model]) => (
                                <SelectItem key={id} value={id}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{model.name}</span>
                                    <Badge variant="outline" className="ml-2">
                                      {model.accuracy}%
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">분석 항목</Label>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {selectedModel && AI_MODELS[selectedModel as keyof typeof AI_MODELS]?.analysisItems.map((item) => (
                              <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={item.id}
                                  checked={selectedAnalysisItems.includes(item.id)}
                                  onCheckedChange={(checked) => handleAnalysisItemChange(item.id, checked as boolean)}
                                />
                                <Label htmlFor={item.id} className="text-sm flex-1">
                                  {item.name}
                                  {item.unit && <span className="text-gray-500 ml-1">({item.unit})</span>}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 분석 실행 */}
                  <Card className="border-orange-200">
                    <CardHeader className="bg-orange-50">
                      <CardTitle className="flex items-center gap-2 text-orange-800">
                        <Play className="h-5 w-5" />
                        분석 실행
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <Button
                          onClick={runAnalysis}
                          disabled={isAnalyzing || selectedAnalysisImages.length === 0 || !selectedModel || selectedAnalysisItems.length === 0}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              분석 중...
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-4 w-4 mr-2" />
                              AI 분석 시작
                            </>
                          )}
                        </Button>

                        {analysisResult && (
                          <div className="space-y-4">
                            <Separator />
                            <div>
                              <h4 className="font-semibold text-green-800 mb-2">분석 결과</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">전체 상태:</span>
                                  <Badge variant={analysisResult.condition === "양호" ? "default" : "destructive"}>
                                    {analysisResult.condition}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">신뢰도:</span>
                                  <span className="font-medium">95%</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium text-gray-700 mb-2">주요 권장사항</h5>
                              <ul className="space-y-1">
                                {analysisResult.recommendations.slice(0, 3).map((rec, index) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-start gap-1">
                                    <span className="text-green-500 font-bold">•</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <Button
                              onClick={saveAnalysis}
                              variant="outline"
                              className="w-full"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              분석 결과 저장
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 스마트 관찰 카메라 시스템 */}
                <Card className="border-blue-200">
                  <CardHeader className="bg-blue-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-blue-800">
                        <Camera className="h-5 w-5" />
                        스마트 관찰 카메라 시스템
                        <Badge variant="secondary" className="ml-2">
                          {cameras.length}개 카메라
                        </Badge>
                      </CardTitle>
                      <Button onClick={addCamera} size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        카메라 추가
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {cameras.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">아직 설정된 관찰 카메라가 없습니다.</p>
                        <p className="text-xs">카메라를 추가하여 자동 인터벌 촬영을 시작하세요.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* 카메라 목록 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {cameras.map((camera) => (
                            <Card key={camera.id} className="border-gray-200">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Camera className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium">{camera.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={camera.isActive ? "default" : "secondary"} className="text-xs">
                                      {camera.isActive ? "촬영중" : "대기중"}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => deleteCamera(camera.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="space-y-3">
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="text-center">
                                      <div className="text-gray-500">사진</div>
                                      <div className="font-bold text-blue-600">{camera.photos.length}개</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-gray-500">간격</div>
                                      <div className="font-bold text-green-600">{camera.interval || 60}분</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-gray-500">마지막</div>
                                      <div className="font-bold text-orange-600">
                                        {camera.photos.length > 0 
                                          ? formatDate(camera.photos[camera.photos.length - 1].date, "HH:mm")
                                          : "없음"
                                        }
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      max="1440"
                                      value={camera.interval || 60}
                                      onChange={(e) => setCameraInterval(camera.id, parseInt(e.target.value))}
                                      className="w-16 h-7 text-xs"
                                    />
                                    <span className="text-xs text-gray-600">분마다 자동촬영</span>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant={camera.isActive ? "destructive" : "default"}
                                      onClick={() => toggleCameraAutoCapture(camera.id)}
                                      className="flex-1 h-7 text-xs"
                                    >
                                      {camera.isActive ? (
                                        <>
                                          <Square className="h-3 w-3 mr-1" />
                                          중지
                                        </>
                                      ) : (
                                        <>
                                          <Play className="h-3 w-3 mr-1" />
                                          시작
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        // 수동 촬영 기능
                                        const newPhoto = {
                                          name: `manual_${Date.now()}.jpg`,
                                          date: new Date(),
                                          environmentData: useCurrentEnvironmentData 
                                            ? environmentData 
                                            : getEnvironmentDataForDateTime(selectedEnvironmentDate, selectedEnvironmentTime)
                                        }
                                        setCameras(prev => prev.map(cam => 
                                          cam.id === camera.id 
                                            ? { ...cam, photos: [...cam.photos, newPhoto] }
                                            : cam
                                        ))
                                      }}
                                      className="h-7 text-xs"
                                    >
                                      <Camera className="h-3 w-3 mr-1" />
                                      수동촬영
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setShowCameraPhotos(camera.id)}
                                      className="h-7 text-xs"
                                    >
                                      <Images className="h-3 w-3 mr-1" />
                                      갤러리
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* 카메라 사진 갤러리 */}
                        {showCameraPhotos && (
                          <Card className="border-blue-200">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                  <Images className="h-5 w-5" />
                                  {cameras.find(c => c.id === showCameraPhotos)?.name} 갤러리
                                </CardTitle>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowCameraPhotos(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {(() => {
                                const camera = cameras.find(c => c.id === showCameraPhotos)
                                if (!camera || camera.photos.length === 0) {
                                  return (
                                    <div className="text-center py-8 text-gray-500">
                                      <Images className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                      <p className="text-sm">아직 촬영된 사진이 없습니다.</p>
                                      <p className="text-xs">자동 촬영을 시작하거나 수동 촬영을 해보세요.</p>
                                    </div>
                                  )
                                }

                                return (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            if (selectedCameraPhotos.length === camera.photos.length) {
                                              setSelectedCameraPhotos([])
                                            } else {
                                              setSelectedCameraPhotos(camera.photos.map((_, idx) => `${camera.id}_${idx}`))
                                            }
                                          }}
                                        >
                                          {selectedCameraPhotos.length === camera.photos.length ? "전체 해제" : "전체 선택"}
                                        </Button>
                                        {selectedCameraPhotos.length > 0 && (
                                          <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => {
                                              // 선택된 카메라 사진들을 분석용 이미지로 추가
                                              const selectedPhotos = camera.photos.filter((_, idx) => 
                                                selectedCameraPhotos.includes(`${camera.id}_${idx}`)
                                              )
                                              
                                              selectedPhotos.forEach((photo, idx) => {
                                                const newImage: UploadedImage = {
                                                  id: `camera_${camera.id}_${Date.now()}_${idx}`,
                                                  file: new File([], photo.name, { type: 'image/jpeg' }),
                                                  url: `/placeholder-${Math.floor(Math.random() * 3) + 1}.jpg`, // 실제로는 photo.url
                                                  timestamp: photo.date,
                                                  userId: user?.id || 'anonymous'
                                                }
                                                setUploadedImages(prev => [...prev, newImage])
                                              })
                                              
                                              setSelectedCameraPhotos([])
                                              setShowCameraPhotos(null)
                                            }}
                                            className="bg-green-600 hover:bg-green-700"
                                          >
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            분석에 추가 ({selectedCameraPhotos.length}개)
                                          </Button>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        총 {camera.photos.length}개 사진
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                                      {camera.photos.map((photo, index) => (
                                        <div key={index} className="relative group">
                                          <div
                                            className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                                              selectedCameraPhotos.includes(`${camera.id}_${index}`)
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-blue-400"
                                            }`}
                                            onClick={() => {
                                              const photoId = `${camera.id}_${index}`
                                              setSelectedCameraPhotos(prev => 
                                                prev.includes(photoId)
                                                  ? prev.filter(id => id !== photoId)
                                                  : [...prev, photoId]
                                              )
                                            }}
                                          >
                                            <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                              <Camera className="h-8 w-8 text-gray-400" />
                                            </div>
                                            {selectedCameraPhotos.includes(`${camera.id}_${index}`) && (
                                              <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                                                <CheckCircle className="h-6 w-6 text-blue-700" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="mt-2 text-xs">
                                            <div className="font-medium">{formatDate(photo.date, "MM/dd HH:mm")}</div>
                                            {photo.environmentData && (
                                              <div className="text-gray-500 mt-1 space-y-0.5">
                                                <div>🌡️ {photo.environmentData.innerTemperature.toFixed(1)}°C</div>
                                                <div>💧 {photo.environmentData.innerHumidity.toFixed(0)}%</div>
                                                <div>⚡ pH{photo.environmentData.ph.toFixed(1)}</div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })()}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 데이터 관리 탭 */}
              <TabsContent value="data-management" className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800">저장된 분석 데이터 관리</h3>
                  <Badge variant="secondary">{savedAnalyses.length}개 분석 결과</Badge>
                </div>

                {/* 필터링 및 검색 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      데이터 필터링 및 검색
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>검색어</Label>
                        <Input
                          placeholder="분석 결과 검색..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>식물 종류</Label>
                        <Select value={filterPlantType} onValueChange={setFilterPlantType}>
                          <SelectTrigger>
                            <SelectValue placeholder="모든 식물" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">모든 식물</SelectItem>
                            {plantTypes.map((plant) => (
                              <SelectItem key={plant.id} value={plant.id}>
                                {plant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>시작 날짜</Label>
                        <Input
                          type="date"
                          value={filterStartDate}
                          onChange={(e) => setFilterStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>종료 날짜</Label>
                        <Input
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => setFilterEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    {selectedDataRows.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mt-4">
                        <span className="text-sm text-blue-700">{selectedDataRows.length}개 항목이 선택되었습니다</span>
                        <div className="flex gap-2">
                          <Button onClick={exportAnalysisData} size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Download className="h-4 w-4 mr-2" />
                            내보내기
                          </Button>
                          <Button onClick={deleteSelectedAnalyses} variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            삭제
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 분석 결과 목록 */}
                <Card>
                  <CardHeader>
                    <CardTitle>분석 결과 목록</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        const filteredAnalyses = getFilteredAnalyses()
                        setSelectedDataRows(filteredAnalyses.map(a => a.id))
                      }}>
                        전체 선택
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDataRows([])}>
                        선택 해제
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {getFilteredAnalyses().length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>저장된 분석 결과가 없습니다.</p>
                        <p className="text-sm">분석을 실행하고 저장해보세요.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getFilteredAnalyses().map((analysis) => (
                          <Card key={analysis.id} className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={selectedDataRows.includes(analysis.id)}
                                    onCheckedChange={() => {
                                      setSelectedDataRows(prev =>
                                        prev.includes(analysis.id)
                                          ? prev.filter(id => id !== analysis.id)
                                          : [...prev, analysis.id]
                                      )
                                    }}
                                  />
                                  <div>
                                    <h4 className="font-medium">
                                      {plantTypes.find(p => p.id === analysis.plantType)?.name} 분석
                                    </h4>
                                    <p className="text-sm text-gray-600">{formatDate(new Date(analysis.date))}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={analysis.result.condition === "양호" ? "default" : "destructive"}>
                                    {analysis.result.condition}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedAnalysisDetail(analysis)}
                                  >
                                    <Info className="h-3 w-3 mr-1" />
                                    상세보기
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => showPlantGrowthChart(analysis.plantType)}
                                  >
                                    <BarChart3 className="h-3 w-3 mr-1" />
                                    성장그래프
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 실시간 모니터링 탭 */}
              <TabsContent value="observation-camera" className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800">실시간 모니터링 시스템</h3>
                  <Badge variant="default" className="bg-green-600">
                    실시간 관찰 모드
                  </Badge>
                </div>

                {/* 실시간 카메라 뷰 */}
                <Card className="border-green-200">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <Camera className="h-5 w-5" />
                      실시간 카메라 영상
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                      <div className="text-center text-white">
                        <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">실시간 카메라 영상</p>
                        <p className="text-sm opacity-75">카메라 연결 대기 중...</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-gray-600">카메라 상태</div>
                        <Badge variant="default" className="bg-green-600">연결됨</Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600">해상도</div>
                        <div className="font-bold">1920x1080</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600">프레임률</div>
                        <div className="font-bold">30 FPS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600">연결 시간</div>
                        <div className="font-bold">00:45:23</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 실시간 환경 데이터 */}
                <Card className="border-blue-200">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <TrendingUp className="h-5 w-5" />
                      실시간 환경 모니터링
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Thermometer className="h-4 w-4 text-red-500 mr-1" />
                          <Label className="text-sm text-gray-600">내부온도</Label>
                        </div>
                        <div className="text-lg font-bold text-red-600">
                          {environmentData.innerTemperature.toFixed(1)}°C
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Thermometer className="h-4 w-4 text-red-400 mr-1" />
                          <Label className="text-sm text-gray-600">외부온도</Label>
                        </div>
                        <div className="text-lg font-bold text-red-500">
                          {environmentData.outerTemperature.toFixed(1)}°C
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Thermometer className="h-4 w-4 text-orange-500 mr-1" />
                          <Label className="text-sm text-gray-600">근권온도</Label>
                        </div>
                        <div className="text-lg font-bold text-orange-600">
                          {environmentData.rootZoneTemperature.toFixed(1)}°C
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Droplets className="h-4 w-4 text-blue-500 mr-1" />
                          <Label className="text-sm text-gray-600">내부습도</Label>
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          {environmentData.innerHumidity.toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Sun className="h-4 w-4 text-yellow-500 mr-1" />
                          <Label className="text-sm text-gray-600">일사량</Label>
                        </div>
                        <div className="text-lg font-bold text-yellow-600">
                          {environmentData.solarRadiation.toFixed(0)}W/m²
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                          <Label className="text-sm text-gray-600">PH</Label>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {environmentData.ph.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Zap className="h-4 w-4 text-purple-500 mr-1" />
                          <Label className="text-sm text-gray-600">EC</Label>
                        </div>
                        <div className="text-lg font-bold text-purple-600">
                          {environmentData.ec.toFixed(1)}dS/m
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <div className="w-3 h-3 bg-teal-500 rounded-full mr-1"></div>
                          <Label className="text-sm text-gray-600">DO</Label>
                        </div>
                        <div className="text-lg font-bold text-teal-600">
                          {environmentData.dissolvedOxygen.toFixed(1)}mg/L
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500">
                        마지막 업데이트: {formatDate(environmentData.timestamp)} {formatDate(environmentData.timestamp, "HH:mm")}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 작물 상태 알림 */}
                <Card className="border-orange-200">
                  <CardHeader className="bg-orange-50">
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="h-5 w-5" />
                      실시간 상태 알림
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-green-800">환경 상태 양호</p>
                          <p className="text-sm text-green-600">모든 환경 지표가 적정 범위 내에 있습니다.</p>
                        </div>
                        <Badge variant="default" className="bg-green-600 ml-auto">정상</Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-blue-800">성장 단계 모니터링</p>
                          <p className="text-sm text-blue-600">현재 영양생장기 단계로 추정됩니다.</p>
                        </div>
                        <Badge variant="secondary" className="ml-auto">관찰중</Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-yellow-800">일사량 주의</p>
                          <p className="text-sm text-yellow-600">오후 시간대 일사량이 높습니다. 차광막 고려하세요.</p>
                        </div>
                        <Badge variant="outline" className="text-yellow-700 border-yellow-300 ml-auto">주의</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 시스템 설정 탭 */}
              <TabsContent value="settings" className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800">시스템 설정 및 정보</h3>
                  <Badge variant="default">V12.0.1 Professional</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* AI 엔진 상태 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        AI 엔진 상태
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">상태:</span>
                          <Badge variant={aiEngineStatus === "online" ? "default" : "destructive"}>
                            {aiEngineStatus}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">로드된 모델:</span>
                          <span className="font-medium">{Object.keys(AI_MODELS).length}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">백엔드 연결:</span>
                          <Badge variant={backendConnectionStatus === "connected" ? "default" : "secondary"}>
                            {backendConnectionStatus}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">평균 응답시간:</span>
                          <span className="font-medium">2.3초</span>
                        </div>
                        {aiEngineStatus !== "online" && (
                          <Button onClick={recoverAiEngine} className="w-full mt-4">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            AI 엔진 복구
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 시스템 통계 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        시스템 통계
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">총 분석 수:</span>
                          <span className="font-medium">{savedAnalyses.length}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">업로드 이미지:</span>
                          <span className="font-medium">{uploadedImages.length}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">관찰 카메라:</span>
                          <span className="font-medium">{cameras.length}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">평균 정확도:</span>
                          <span className="font-medium">94.2%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 환경 히스토리 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      환경 데이터 히스토리
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">📈 온도 추이</h4>
                        <div className="space-y-1 text-sm">
                          <p>평균 내부온도: <span className="font-medium">25.3°C</span></p>
                          <p>평균 외부온도: <span className="font-medium">22.1°C</span></p>
                          <p>온도 변화폭: <span className="font-medium">±2.1°C</span></p>
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">💧 습도 & 수질</h4>
                        <div className="space-y-1 text-sm">
                          <p>평균 습도: <span className="font-medium">67.8%</span></p>
                          <p>평균 PH: <span className="font-medium">6.4</span></p>
                          <p>평균 EC: <span className="font-medium">1.7 dS/m</span></p>
                        </div>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">☀️ 일사량 분석</h4>
                        <div className="space-y-1 text-sm">
                          <p>최대 일사량: <span className="font-medium">520 W/m²</span></p>
                          <p>평균 일사량: <span className="font-medium">385 W/m²</span></p>
                          <p>일조 시간: <span className="font-medium">12.5시간</span></p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 상세보기 모달 */}
        {selectedAnalysisDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
                <CardTitle className="text-xl">
                  분석 결과 상세보기 - {plantTypes.find(p => p.id === selectedAnalysisDetail.plantType)?.name}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setSelectedAnalysisDetail(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium">분석 날짜</Label>
                      <p>{formatDate(new Date(selectedAnalysisDetail.date))}</p>
                    </div>
                    <div>
                      <Label className="font-medium">상태</Label>
                      <Badge variant={selectedAnalysisDetail.result.condition === "양호" ? "default" : "destructive"} className="ml-2">
                        {selectedAnalysisDetail.result.condition}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="font-medium">사용된 AI 모델</Label>
                    <p>{AI_MODELS[selectedAnalysisDetail.result.modelId as keyof typeof AI_MODELS]?.name}</p>
                  </div>

                  <div>
                    <Label className="font-medium">분석 항목 결과</Label>
                    <div className="mt-2 space-y-2">
                      {(selectedAnalysisDetail.result.selectedAnalysisItems || []).map((itemId) => {
                        const modelConfig = AI_MODELS[selectedAnalysisDetail.result.modelId as keyof typeof AI_MODELS]
                        const item = modelConfig?.analysisItems.find(ai => ai.id === itemId)
                        const value = selectedAnalysisDetail.result.analysisData[itemId]
                        
                        if (!item || value === undefined) return null

                        return (
                          <div key={itemId} className="p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-700">{item.name}</h5>
                              <Badge variant="outline">{item.type}</Badge>
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {item.type === "number" ? (
                                <>
                                  {typeof value === 'number' ? value.toFixed(1) : value}
                                  {item.unit && <span className="text-sm text-gray-500 ml-1">{item.unit}</span>}
                                </>
                              ) : item.type === "object" ? (
                                <div className="text-sm space-y-1">
                                  {Object.entries(value).map(([key, val]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="capitalize">{key}:</span>
                                      <span>{String(val)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span>{String(value)}</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <Label className="font-medium">AI 전문가 권장사항</Label>
                    <ul className="mt-2 space-y-2">
                      {(selectedAnalysisDetail.result.recommendations || []).map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                          <TrendingUp className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedAnalysisDetail.result.environmentData && (
                    <div>
                      <Label className="font-medium">분석 시점 환경 데이터</Label>
                      <div className="mt-2 grid grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-sm text-gray-600">내부온도</div>
                          <div className="text-lg font-bold text-red-600">
                            {selectedAnalysisDetail.result.environmentData.innerTemperature.toFixed(1)}°C
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">습도</div>
                          <div className="text-lg font-bold text-blue-600">
                            {selectedAnalysisDetail.result.environmentData.innerHumidity.toFixed(0)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">PH</div>
                          <div className="text-lg font-bold text-green-600">
                            {selectedAnalysisDetail.result.environmentData.ph.toFixed(1)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">EC</div>
                          <div className="text-lg font-bold text-purple-600">
                            {selectedAnalysisDetail.result.environmentData.ec.toFixed(1)}dS/m
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 성장 그래프 모달 */}
        {showGrowthChart && selectedPlantForChart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  {plantTypes.find(p => p.id === selectedPlantForChart)?.name} 성장 분석 그래프
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowGrowthChart(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6">
                {(() => {
                  const chartData = generateGrowthChartData(selectedPlantForChart)
                  
                  if (!chartData) {
                    return (
                      <div className="text-center py-12">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h4 className="text-lg font-medium text-gray-600 mb-2">분석 데이터가 부족합니다</h4>
                        <p className="text-gray-500">이 식물 종류에 대한 분석 결과가 없습니다.</p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-6">
                      {/* 개요 정보 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-blue-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{chartData.totalAnalyses}</div>
                            <div className="text-sm text-gray-600">총 분석 횟수</div>
                          </CardContent>
                        </Card>
                        <Card className="border-green-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{chartData.dateRange.start}</div>
                            <div className="text-sm text-gray-600">시작 날짜</div>
                          </CardContent>
                        </Card>
                        <Card className="border-orange-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">{chartData.dateRange.end}</div>
                            <div className="text-sm text-gray-600">최근 분석</div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* 건강 상태 추이 */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            건강 상태 추이
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {chartData.healthTrend.map((data, index) => (
                              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                <div className="w-20 text-sm text-gray-600">{data.date}</div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">{data.condition}</span>
                                    <span className="text-sm text-gray-600">{data.score.toFixed(0)}점</span>
                                  </div>
                                  <Progress value={data.score} className="h-2" />
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                  <div>온도: {data.temperature.toFixed(1)}°C</div>
                                  <div>습도: {data.humidity.toFixed(0)}%</div>
                                  <div>pH: {data.ph.toFixed(1)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* 환경 데이터 분석 */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Thermometer className="h-5 w-5" />
                            환경 데이터 분석
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-red-50 rounded-lg">
                              <h4 className="font-medium text-red-800 mb-2">🌡️ 온도 분석</h4>
                              <div className="space-y-1 text-sm">
                                <p>평균 온도: <span className="font-medium">
                                  {(chartData.healthTrend.reduce((acc, d) => acc + d.temperature, 0) / chartData.healthTrend.length).toFixed(1)}°C
                                </span></p>
                                <p>최고 온도: <span className="font-medium">
                                  {Math.max(...chartData.healthTrend.map(d => d.temperature)).toFixed(1)}°C
                                </span></p>
                                <p>최저 온도: <span className="font-medium">
                                  {Math.min(...chartData.healthTrend.map(d => d.temperature)).toFixed(1)}°C
                                </span></p>
                              </div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <h4 className="font-medium text-blue-800 mb-2">💧 습도 분석</h4>
                              <div className="space-y-1 text-sm">
                                <p>평균 습도: <span className="font-medium">
                                  {(chartData.healthTrend.reduce((acc, d) => acc + d.humidity, 0) / chartData.healthTrend.length).toFixed(0)}%
                                </span></p>
                                <p>최고 습도: <span className="font-medium">
                                  {Math.max(...chartData.healthTrend.map(d => d.humidity)).toFixed(0)}%
                                </span></p>
                                <p>최저 습도: <span className="font-medium">
                                  {Math.min(...chartData.healthTrend.map(d => d.humidity)).toFixed(0)}%
                                </span></p>
                              </div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                              <h4 className="font-medium text-green-800 mb-2">⚗️ pH 분석</h4>
                              <div className="space-y-1 text-sm">
                                <p>평균 pH: <span className="font-medium">
                                  {(chartData.healthTrend.reduce((acc, d) => acc + d.ph, 0) / chartData.healthTrend.length).toFixed(1)}
                                </span></p>
                                <p>최고 pH: <span className="font-medium">
                                  {Math.max(...chartData.healthTrend.map(d => d.ph)).toFixed(1)}
                                </span></p>
                                <p>최저 pH: <span className="font-medium">
                                  {Math.min(...chartData.healthTrend.map(d => d.ph)).toFixed(1)}
                                </span></p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* 주요 권장사항 */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            주요 관리 권장사항
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {chartData.recommendations.map((rec, index) => (
                              <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                                <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                                <span className="text-sm">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 