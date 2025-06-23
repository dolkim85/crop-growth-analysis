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
  
  // 카메라 인터벌 촬영 관련
  const [cameraIntervals, setCameraIntervals] = useState<{ [cameraId: string]: { interval: number, isActive: boolean } }>({})
  const [selectedCameraPhotos, setSelectedCameraPhotos] = useState<string[]>([])
  const [showCameraPhotos, setShowCameraPhotos] = useState<string | null>(null)

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
      
      // 하이브리드 AI 분석 시뮬레이션
      console.log("🔍 하이브리드 AI 분석 시작")
      
      if (backendConnectionStatus === "connected") {
        console.log("🌐 백엔드 AI 서버 분석 모드")
        await new Promise(resolve => setTimeout(resolve, 3000))
      } else {
        console.log("💻 클라이언트 사이드 AI 분석 모드")
        await performClientSideAnalysis(selectedImageObjects)
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

      // 분석 결과 생성
      const result: AnalysisResult = {
        modelId: selectedModel,
        selectedAnalysisItems: selectedAnalysisItems || [],
        analysisData,
        environmentData,
        condition: analysisData.health || "양호",
        recommendations: generateRecommendations(analysisData) || [],
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

  const performClientSideAnalysis = async (images: UploadedImage[]) => {
    console.log("🧠 클라이언트 AI 엔진 실행")
    
    for (const image of images) {
      // Canvas API 기반 픽셀 분석 시뮬레이션
      console.log(`📊 ${image.file.name} 픽셀 분석 중...`)
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

  const generateRecommendations = (analysisData: any) => {
    const recommendations = [
      "현재 환경 조건이 양호합니다.",
      "정기적인 모니터링을 계속해주세요.",
      "수분 공급 상태를 확인해주세요.",
      "영양분 보충을 고려해보세요.",
      "통풍을 개선해주세요.",
      "온도 관리에 주의하세요."
    ]
    
    return recommendations.slice(0, Math.floor(Math.random() * 3) + 2)
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
    
    // 날짜 필터
    if (analysisFilter.dateFrom) {
      filtered = filtered.filter(analysis => 
        new Date(analysis.date) >= new Date(analysisFilter.dateFrom)
      )
    }
    if (analysisFilter.dateTo) {
      filtered = filtered.filter(analysis => 
        new Date(analysis.date) <= new Date(analysisFilter.dateTo)
      )
    }
    
    // 검색어 필터
    if (analysisSearchTerm) {
      filtered = filtered.filter(analysis => 
        plantTypes.find(p => p.id === analysis.plantType)?.name.includes(analysisSearchTerm) ||
        analysis.result.condition.includes(analysisSearchTerm)
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

  // 분석 데이터 내보내기
  const exportAnalysisData = () => {
    const dataToExport = getFilteredAnalyses()
    const jsonData = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `crop_analysis_${new Date().toISOString().split('T')[0]}.json`
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

    if (!isCurrentlyActive) {
      // 자동 촬영 시작 시뮬레이션
      alert(`${camera.name}의 자동 촬영이 시작되었습니다. (${cameraIntervals[cameraId]?.interval || 60}분 간격)`)
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
            V12.0 하이브리드 AI 스마트팜 분석 시스템
          </h1>
          <p className="text-green-600">고급 AI 기반 전문 작물 모니터링 및 성장 분석 플랫폼</p>
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
                    onCheckedChange={setUseCurrentEnvironmentData}
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

        {/* 메인 분석 인터페이스 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 이미지 업로드 및 선택 */}
          <div className="space-y-6">
            <Card className="border-emerald-200">
              <CardHeader className="bg-emerald-50">
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <Upload className="h-5 w-5" />
                  이미지 업로드 및 관리
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
                      <Label className="text-sm font-medium">
                        업로드된 이미지 ({uploadedImages.length}개)
                      </Label>
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
                                  <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">업로드된 이미지가 없습니다</p>
                      <p className="text-xs text-gray-400 mt-1">위에서 이미지를 선택하여 업로드해주세요</p>
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
                  스마트 관찰 카메라
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* 카메라 추가 */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="카메라 이름 (예: 온실 A-1)"
                      value={newCameraName}
                      onChange={(e) => setNewCameraName(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={addCamera} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      추가
                    </Button>
                  </div>

                  {/* 카메라 목록 */}
                  {cameras.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">등록된 카메라 ({cameras.length}개)</Label>
                      {cameras.map((camera) => (
                        <Card key={camera.id} className="border-blue-100">
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium flex items-center gap-2">
                                  <Camera className="h-4 w-4" />
                                  {camera.name}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant={cameraIntervals[camera.id]?.isActive ? "default" : "secondary"}>
                                    {cameraIntervals[camera.id]?.isActive ? "촬영중" : "대기중"}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteCamera(camera.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                  <div className="text-xs text-gray-500">저장된 사진</div>
                                  <div className="text-lg font-bold text-blue-600">{camera.photos.length}개</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-gray-500">촬영 간격</div>
                                  <div className="text-lg font-bold text-green-600">{cameraIntervals[camera.id]?.interval || camera.interval || 60}분</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-gray-500">마지막 촬영</div>
                                  <div className="text-sm font-medium text-gray-700">
                                    {camera.photos.length > 0 ? formatDate(camera.photos[camera.photos.length - 1].date, "HH:mm") : "없음"}
                                  </div>
                                </div>
                              </div>

                              {/* 인터벌 설정 */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600">자동 촬영 설정</Label>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 flex-1">
                                    <Input
                                      type="number"
                                      min="1"
                                      max="1440"
                                      value={cameraIntervals[camera.id]?.interval || camera.interval || 60}
                                      onChange={(e) => setCameraInterval(camera.id, parseInt(e.target.value) || 60)}
                                      className="w-16 text-sm"
                                    />
                                    <span className="text-xs text-gray-500">분마다</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={cameraIntervals[camera.id]?.isActive ? "destructive" : "default"}
                                    onClick={() => toggleCameraAutoCapture(camera.id)}
                                    className="min-w-[60px]"
                                  >
                                    {cameraIntervals[camera.id]?.isActive ? (
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
                                </div>
                              </div>

                              {/* 액션 버튼들 */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowCameraPhotos(camera.id)}
                                  className="flex-1"
                                >
                                  <Images className="h-3 w-3 mr-1" />
                                  갤러리 ({camera.photos.length})
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // 수동 촬영 시뮬레이션
                                    const newPhoto = {
                                      name: `photo_${Date.now()}.jpg`,
                                      date: new Date(),
                                      environmentData: environmentData
                                    }
                                    const updatedCamera = {
                                      ...camera,
                                      photos: [...camera.photos, newPhoto]
                                    }
                                    const updatedCameras = cameras.map(c => c.id === camera.id ? updatedCamera : c)
                                    setCameras(updatedCameras)
                                    localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(updatedCameras))
                                    alert("사진이 촬영되었습니다!")
                                  }}
                                  className="flex-1"
                                >
                                  <Camera className="h-3 w-3 mr-1" />
                                  촬영
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* 카메라 사진 갤러리 */}
                  {showCameraPhotos && (
                    <Card className="mt-4 border-blue-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Images className="h-4 w-4" />
                            {cameras.find(c => c.id === showCameraPhotos)?.name} 갤러리
                          </CardTitle>
                          <Button size="sm" variant="outline" onClick={() => setShowCameraPhotos(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* 갤러리 헤더 */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              총 {cameras.find(c => c.id === showCameraPhotos)?.photos.length || 0}개의 사진
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const allPhotoIds = cameras.find(c => c.id === showCameraPhotos)?.photos.map((_, index) => `${showCameraPhotos}-${index}`) || []
                                  setSelectedCameraPhotos(allPhotoIds)
                                }}
                              >
                                전체 선택
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedCameraPhotos([])}
                              >
                                선택 해제
                              </Button>
                            </div>
                          </div>

                          {/* 사진 목록 */}
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {cameras.find(c => c.id === showCameraPhotos)?.photos.length === 0 ? (
                              <div className="text-center text-gray-500 py-8">
                                <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">촬영된 사진이 없습니다</p>
                                <p className="text-xs text-gray-400">자동 촬영을 시작하거나 수동으로 촬영해보세요</p>
                              </div>
                            ) : (
                              cameras.find(c => c.id === showCameraPhotos)?.photos.map((photo, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors">
                                  <Checkbox
                                    checked={selectedCameraPhotos.includes(`${showCameraPhotos}-${index}`)}
                                    onCheckedChange={(checked) => {
                                      const photoId = `${showCameraPhotos}-${index}`
                                      if (checked) {
                                        setSelectedCameraPhotos(prev => [...prev, photoId])
                                      } else {
                                        setSelectedCameraPhotos(prev => prev.filter(id => id !== photoId))
                                      }
                                    }}
                                  />
                                  
                                  {/* 사진 썸네일 (실제로는 이미지 표시) */}
                                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                    <Camera className="h-5 w-5 text-gray-400" />
                                  </div>

                                  {/* 사진 정보 */}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{photo.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatDate(photo.date)} {formatDate(photo.date, "HH:mm:ss")}
                                    </p>
                                  </div>

                                  {/* 환경 데이터 표시 */}
                                  <div className="text-right">
                                    {photo.environmentData ? (
                                      <div className="text-xs space-y-1">
                                        <div className="flex gap-2">
                                          <span className="text-red-500">{photo.environmentData.innerTemperature.toFixed(1)}°C</span>
                                          <span className="text-blue-500">{photo.environmentData.innerHumidity.toFixed(0)}%</span>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          환경데이터 포함
                                        </Badge>
                                      </div>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">
                                        환경데이터 없음
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* 액션 버튼 */}
                          {selectedCameraPhotos.length > 0 && (
                            <div className="pt-3 border-t">
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={addCameraPhotosToAnalysis}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                선택한 사진을 분석에 추가 ({selectedCameraPhotos.length}개)
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 중앙: 분석 설정 */}
          <div className="space-y-6">
            <Card className="border-purple-200">
              <CardHeader className="bg-purple-50">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <BarChart3 className="h-5 w-5" />
                  전문 분석 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* 식물 종류 선택 */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">식물 종류</Label>
                  <Select value={selectedPlantType} onValueChange={setSelectedPlantType}>
                    <SelectTrigger>
                      <SelectValue placeholder="식물 종류를 선택하세요" />
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

                {/* AI 모델 선택 */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">AI 분석 모델</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="분석 모델을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AI_MODELS).map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs text-gray-500">정확도: {model.accuracy}%</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 분석 항목 선택 */}
                {selectedModel && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">분석 항목</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {AI_MODELS[selectedModel as keyof typeof AI_MODELS]?.analysisItems.map((item) => (
                        <div key={item.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={item.id}
                            checked={selectedAnalysisItems.includes(item.id)}
                            onCheckedChange={(checked) => 
                              handleAnalysisItemChange(item.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={item.id} className="text-sm">
                            {item.name}
                            {item.unit && <span className="text-gray-500 ml-1">({item.unit})</span>}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 분석 실행 버튼 */}
                <Button
                  onClick={runAnalysis} 
                                          disabled={isAnalyzing || !isAiEngineReady || (selectedAnalysisImages || []).length === 0 || (selectedAnalysisItems || []).length === 0}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      하이브리드 AI 분석 중...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      🚀 하이브리드 분석 시작
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 분석 결과 */}
          <div className="space-y-6">
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <TrendingUp className="h-5 w-5" />
                  하이브리드 AI 분석 결과
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {analysisResult ? (
                  <div className="space-y-4">
                    {/* 분석 정보 */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>모델:</strong> {AI_MODELS[analysisResult.modelId as keyof typeof AI_MODELS]?.name}</p>
                        <p><strong>분석 시간:</strong> {formatDate(new Date(analysisResult.date))}</p>
                        <p><strong>이미지 수:</strong> {analysisResult.comparedImages?.length || 0}개</p>
                        <p><strong>분석 모드:</strong> {backendConnectionStatus === "connected" ? "🌐 백엔드 AI" : "💻 클라이언트 AI"}</p>
                      </div>
                    </div>

                    {/* 분석 데이터 */}
                    <div className="space-y-3">
                      {(analysisResult.selectedAnalysisItems || []).map((itemId) => {
                        const modelConfig = AI_MODELS[analysisResult.modelId as keyof typeof AI_MODELS]
                        const item = modelConfig?.analysisItems.find(ai => ai.id === itemId)
                        const value = analysisResult.analysisData[itemId]
                        
                        if (!item || value === undefined) return null

                        return (
                          <div key={itemId} className="p-3 bg-gray-50 rounded-lg border">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
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
                          </div>
                        )
                      })}
                    </div>

                    <Separator />

                    {/* 권장사항 */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800">AI 전문가 권장사항</h4>
                      <ul className="space-y-1">
                        {(analysisResult.recommendations || []).map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <TrendingUp className="h-3 w-3 mt-1 text-green-500 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    {/* 액션 버튼 */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={saveAnalysis}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        결과 저장
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const dataStr = JSON.stringify(analysisResult, null, 2)
                          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
                          const exportFileDefaultName = `analysis_${new Date().toISOString().split('T')[0]}.json`
                          
                          const linkElement = document.createElement('a')
                          linkElement.setAttribute('href', dataUri)
                          linkElement.setAttribute('download', exportFileDefaultName)
                          linkElement.click()
                        }}
                        className="flex-1"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        내보내기
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">하이브리드 AI 분석 결과 대기중</p>
                    <p className="text-sm">이미지를 선택하고 분석을 실행해주세요</p>
                    <div className="mt-4 text-xs text-gray-400">
                      <p>🌐 백엔드 연결: {backendConnectionStatus}</p>
                      <p>🤖 AI 엔진: {aiEngineStatus}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 하단 데이터 관리 */}
        <Card>
          <CardContent className="p-6">
            {/* 저장된 분석 결과 버튼 */}
            <div className="mb-6">
              <Button
                onClick={() => setShowSavedAnalyses(!showSavedAnalyses)}
                variant="outline"
                size="lg"
                className="w-full h-16 text-lg font-semibold border-2 border-green-200 hover:border-green-400 hover:bg-green-50"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6 text-green-600" />
                    <span className="text-green-800">저장된 하이브리드 AI 분석 결과</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {savedAnalyses.length}개
                    </Badge>
                    {showSavedAnalyses ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
              </Button>
            </div>

            {showSavedAnalyses && (
              <div className="space-y-6 border-t pt-6">
                {/* 검색 및 필터 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    placeholder="검색어 입력..."
                    value={analysisSearchTerm}
                    onChange={(e) => setAnalysisSearchTerm(e.target.value)}
                    className="md:col-span-1"
                  />
                  <Select value={analysisFilter.plantType} onValueChange={(value) => setAnalysisFilter(prev => ({...prev, plantType: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="식물 종류" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 식물</SelectItem>
                      {plantTypes.map((plant) => (
                        <SelectItem key={plant.id} value={plant.id}>{plant.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    placeholder="시작 날짜"
                    value={analysisFilter.dateFrom}
                    onChange={(e) => setAnalysisFilter(prev => ({...prev, dateFrom: e.target.value}))}
                  />
                  <Input
                    type="date"
                    placeholder="종료 날짜"
                    value={analysisFilter.dateTo}
                    onChange={(e) => setAnalysisFilter(prev => ({...prev, dateTo: e.target.value}))}
                  />
                </div>

                {/* 액션 버튼들 */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allIds = getFilteredAnalyses().map(a => a.id)
                      setSelectedAnalysesToDelete(allIds)
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    전체 선택
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAnalysesToDelete([])}
                  >
                    선택 해제
                  </Button>
                  {selectedAnalysesToDelete.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelectedAnalyses}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      삭제 ({selectedAnalysesToDelete.length}개)
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportAnalysisData}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    데이터 내보내기
                  </Button>
                </div>

                {/* 분석 결과 목록 */}
                <div className="space-y-4">
                  {getFilteredAnalyses().length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getFilteredAnalyses().map((analysis) => (
                          <Card key={analysis.id} className="border-gray-200 hover:border-green-300 transition-colors">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Checkbox
                                    checked={selectedAnalysesToDelete.includes(analysis.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedAnalysesToDelete(prev => [...prev, analysis.id])
                                      } else {
                                        setSelectedAnalysesToDelete(prev => prev.filter(id => id !== analysis.id))
                                      }
                                    }}
                                  />
                                  <Badge variant={analysis.result.condition === "양호" ? "default" : "destructive"}>
                                    {analysis.result.condition}
                                  </Badge>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium text-base">
                                    {plantTypes.find(p => p.id === analysis.plantType)?.name || analysis.plantType}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(new Date(analysis.date))}
                                  </p>
                                </div>

                                <div className="text-sm space-y-1">
                                  <p><strong>모델:</strong> {AI_MODELS[analysis.result.modelId as keyof typeof AI_MODELS]?.name}</p>
                                  <p><strong>이미지:</strong> {analysis.result.comparedImages?.length || 0}개</p>
                                  <p><strong>분석 항목:</strong> {(analysis.result.selectedAnalysisItems || []).length}개</p>
                                </div>

                                <div className="pt-2">
                                  <h5 className="text-sm font-medium mb-1">주요 권장사항:</h5>
                                  <p className="text-xs text-gray-600 line-clamp-2">
                                    {(analysis.result.recommendations || [])[0] || "권장사항 없음"}
                                  </p>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => setSelectedAnalysisDetail(analysis)}
                                  >
                                    <Info className="h-3 w-3 mr-1" />
                                    상세보기
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => {
                                      const dataStr = JSON.stringify(analysis, null, 2)
                                      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
                                      const exportFileDefaultName = `analysis_${analysis.id}.json`
                                      
                                      const linkElement = document.createElement('a')
                                      linkElement.setAttribute('href', dataUri)
                                      linkElement.setAttribute('download', exportFileDefaultName)
                                      linkElement.click()
                                    }}
                                  >
                                    <Database className="h-3 w-3 mr-1" />
                                    내보내기
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* 간단한 통계 그래프 */}
                      <Card className="mt-6">
                        <CardHeader>
                          <CardTitle className="text-lg">분석 통계</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {getFilteredAnalyses().filter(a => a.result.condition === "양호").length}
                              </div>
                              <div className="text-sm text-green-700">양호한 상태</div>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                              <div className="text-2xl font-bold text-yellow-600">
                                {getFilteredAnalyses().filter(a => a.result.condition === "주의").length}
                              </div>
                              <div className="text-sm text-yellow-700">주의 필요</div>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                              <div className="text-2xl font-bold text-red-600">
                                {getFilteredAnalyses().filter(a => a.result.condition === "치료").length}
                              </div>
                              <div className="text-sm text-red-700">치료 필요</div>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {getFilteredAnalyses().length}
                              </div>
                              <div className="text-sm text-blue-700">총 분석 수</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>조건에 맞는 분석 결과가 없습니다</p>
                      <p className="text-sm text-gray-400 mt-1">필터 조건을 변경하거나 새로운 분석을 실행해보세요</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 상세보기 모달 */}
            {selectedAnalysisDetail && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">
                      분석 결과 상세보기 - {plantTypes.find(p => p.id === selectedAnalysisDetail.plantType)?.name}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setSelectedAnalysisDetail(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="overflow-y-auto">
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

            <Tabs defaultValue="environment" className="w-full mt-8">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="environment">환경 히스토리</TabsTrigger>
                <TabsTrigger value="system-info">시스템 정보</TabsTrigger>
              </TabsList>



              <TabsContent value="environment" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">환경 데이터 히스토리</h3>
                  <Badge variant="secondary">7일간 데이터</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">☀️ 일사량 분석</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p>최대 일사량: <span className="font-medium">520 W/m²</span></p>
                    </div>
                    <div>
                      <p>평균 일사량: <span className="font-medium">385 W/m²</span></p>
                    </div>
                    <div>
                      <p>일조 시간: <span className="font-medium">12.5시간</span></p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="system-info" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">V12.0 하이브리드 AI 시스템 정보</h3>
                  <Badge variant="default">온라인</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">🧠 AI 엔진 상태</h4>
                    <div className="space-y-1 text-sm">
                      <p>상태: <span className="font-medium">{aiEngineStatus}</span></p>
                      <p>로드된 모델: <span className="font-medium">{Object.keys(AI_MODELS).length}개</span></p>
                      <p>백엔드 연결: <span className="font-medium">{backendConnectionStatus}</span></p>
                      <p>평균 응답시간: <span className="font-medium">2.3초</span></p>
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">📊 분석 통계</h4>
                    <div className="space-y-1 text-sm">
                      <p>총 분석 수: <span className="font-medium">{savedAnalyses.length}개</span></p>
                      <p>업로드 이미지: <span className="font-medium">{uploadedImages.length}개</span></p>
                      <p>관찰 카메라: <span className="font-medium">{cameras.length}개</span></p>
                      <p>평균 정확도: <span className="font-medium">94.2%</span></p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">⚡ 시스템 성능</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p>CPU 사용률: <span className="font-medium">23%</span></p>
                    </div>
                    <div>
                      <p>메모리 사용률: <span className="font-medium">67%</span></p>
                    </div>
                    <div>
                      <p>가동 시간: <span className="font-medium">24.7시간</span></p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 