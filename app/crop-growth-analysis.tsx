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
  plantHealth: number
  growthRate: number
  size: number
  height: number
  leafCount: number
  leafSize: number
  leafArea: number // 새로 추가
  leafColor: {
    rgb: { r: number; g: number; b: number }
    hsv: { h: number; s: number; v: number }
    greenness: number
    yellowing: number
    browning: number
  } // 새로 추가
  leafTexture: string // 새로 추가
  leafShape: string // 새로 추가
  condition: string
  recommendations: string[]
  date: string
  comparedImages?: string[]
  detailedMeasurements?: {
    leafPerimeter: number
    leafThickness: number
    stemDiameter: number
    nodeCount: number
  } // 새로 추가
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

// 이미지를 Base64로 변환하는 함수
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
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
        plantHealth: 97,
        growthRate: 12,
        size: 18,
        height: 28,
        leafCount: 12,
        leafSize: 6,
        plantArea: 0,
        leafColor: {
          rgb: { r: 0, g: 0, b: 0 },
          hsv: { h: 0, s: 0, v: 0 },
          greenness: 0,
          yellowing: 0,
          browning: 0,
        },
        leafTexture: "",
        leafShape: "",
        condition: "양호",
        recommendations: ["수분 공급량을 10% 증가시키세요"],
        date: "2025-04-28",
        detailedMeasurements: {
          leafPerimeter: 0,
          leafThickness: 0,
          stemDiameter: 0,
          nodeCount: 0,
        },
      },
    },
    {
      id: "2",
      plantType: "tomato",
      date: "2025-05-15T10:00:00",
      userId: "spinmoll", // 예비 계정용 데이터
      result: {
        plantHealth: 92,
        growthRate: 10,
        size: 20,
        height: 32,
        leafCount: 14,
        leafSize: 7,
        plantArea: 0,
        leafColor: {
          rgb: { r: 0, g: 0, b: 0 },
          hsv: { h: 0, s: 0, v: 0 },
          greenness: 0,
          yellowing: 0,
          browning: 0,
        },
        leafTexture: "",
        leafShape: "",
        condition: "양호",
        recommendations: ["질소 비료를 추가 공급하는 것을 권장합니다"],
        date: "2025-05-15",
        detailedMeasurements: {
          leafPerimeter: 0,
          leafThickness: 0,
          stemDiameter: 0,
          nodeCount: 0,
        },
      },
    },
    {
      id: "3",
      plantType: "cucumber",
      date: "2025-05-10T10:00:00",
      userId: "spinmoll", // 예비 계정용 데이터
      result: {
        plantHealth: 88,
        growthRate: 15,
        size: 22,
        height: 35,
        leafCount: 8,
        leafSize: 9,
        plantArea: 0,
        leafColor: {
          rgb: { r: 0, g: 0, b: 0 },
          hsv: { h: 0, s: 0, v: 0 },
          greenness: 0,
          yellowing: 0,
          browning: 0,
        },
        leafTexture: "",
        leafShape: "",
        condition: "양호",
        recommendations: ["잎의 색상 변화를 지속적으로 모니터링하세요"],
        date: "2025-05-10",
        detailedMeasurements: {
          leafPerimeter: 0,
          leafThickness: 0,
          stemDiameter: 0,
          nodeCount: 0,
        },
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
      features: ["기본 건강도 측정", "잎 색상 분석", "크기 측정"]
    },
    {
      id: "plantnet-basic",
      name: "PlantNet Basic (무료)",
      category: "무료", 
      description: "식물 종 식별 및 기본 건강 분석을 제공하는 무료 모델입니다.",
      provider: "PlantNet API",
      accuracy: "82%",
      features: ["식물 종 식별", "기본 건강 분석", "병해 탐지"]
    },
    {
      id: "tensorflow-plant-free",
      name: "TensorFlow Plant Classifier (무료)",
      category: "무료",
      description: "Google의 TensorFlow를 기반으로 한 무료 식물 분류 모델입니다.",
      provider: "Google TensorFlow",
      accuracy: "75%",
      features: ["식물 분류", "기본 건강도", "성장 단계 분석"]
    },

    // 유료 모델
    {
      id: "plantix-pro",
      name: "Plantix Professional ($29/월)",
      category: "유료",
      description: "전문가 수준의 식물 질병 진단 및 해결책 제공. 농업 전문가들이 사용하는 고정밀 AI 모델입니다.",
      provider: "PEAT (Progressive Environmental & Agricultural Technologies)",
      accuracy: "94%",
      features: ["정밀 질병 진단", "해결책 제안", "영양 결핍 분석", "해충 식별", "전문가 상담"]
    },
    {
      id: "cropx-premium",
      name: "CropX Premium Analytics ($49/월)",
      category: "유료",
      description: "IoT 센서와 AI를 결합한 프리미엄 작물 분석 솔루션입니다.",
      provider: "CropX Technologies",
      accuracy: "96%",
      features: ["실시간 모니터링", "토양 분석", "관개 최적화", "수확량 예측", "기상 연동"]
    },
    {
      id: "agromonitoring-pro",
      name: "Agro Monitoring Pro ($19/월)",
      category: "유료",
      description: "위성 이미지와 AI를 활용한 정밀 농업 모니터링 서비스입니다.",
      provider: "OpenWeather Agro API",
      accuracy: "91%",
      features: ["위성 이미지 분석", "식생 지수", "기상 예보", "병해충 예측", "수확 시기 예측"]
    },
    {
      id: "azure-farmbeats",
      name: "Microsoft Azure FarmBeats ($89/월)",
      category: "유료",
      description: "Microsoft의 클라우드 기반 농업 AI 플랫폼으로 엔터프라이즈급 분석을 제공합니다.",
      provider: "Microsoft Azure",
      accuracy: "97%",
      features: ["드론 이미지 분석", "다중 센서 융합", "예측 분석", "자동화 제어", "대시보드"]
    },

    // 학습 AI 모델
    {
      id: "custom-cnn-v1",
      name: "Custom CNN Model v1.0 (학습중)",
      category: "학습AI",
      description: "사용자 데이터로 지속적으로 학습하는 맞춤형 CNN 모델입니다. 사용할수록 정확도가 향상됩니다.",
      provider: "자체 개발 모델",
      accuracy: "학습중 (현재 71%)",
      features: ["개인화 학습", "지속적 개선", "맞춤형 분석", "사용자 피드백 반영"]
    },
    {
      id: "transfer-learning-plant",
      name: "Transfer Learning Plant Model (학습중)",
      category: "학습AI",
      description: "ImageNet 사전 훈련 모델을 기반으로 농작물 데이터로 전이학습하는 모델입니다.",
      provider: "ResNet50 + Custom Dataset",
      accuracy: "학습중 (현재 68%)",
      features: ["전이학습", "빠른 적응", "다양한 작물 지원", "실시간 학습"]
    },
    {
      id: "automl-vision-plant",
      name: "AutoML Vision Plant (학습중)",
      category: "학습AI", 
      description: "Google의 AutoML Vision을 사용해 자동으로 최적화되는 식물 분석 모델입니다.",
      provider: "Google AutoML Vision",
      accuracy: "학습중 (현재 73%)",
      features: ["자동 최적화", "하이퍼파라미터 튜닝", "모델 앙상블", "성능 모니터링"]
    },
    {
      id: "ensemble-learning-crop",
      name: "Ensemble Learning Crop Model (학습중)",
      category: "학습AI",
      description: "여러 머신러닝 모델을 결합한 앙상블 학습으로 높은 정확도를 추구하는 모델입니다.",
      provider: "Random Forest + SVM + Neural Network",
      accuracy: "학습중 (현재 76%)",
      features: ["앙상블 학습", "다중 모델 융합", "높은 안정성", "오버피팅 방지"]
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

  // 로컬스토리지에 데이터 저장하는 함수
  const saveToStorage = async (images: UploadedImage[], analyses: SavedAnalysis[], cameras: ObservationCamera[]) => {
    try {
      // 이미지를 base64로 변환해서 저장
      const imageData = await Promise.all(
        images.map(async (img) => {
          try {
            const base64 = await fileToBase64(img.file)
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
      localStorage.setItem(STORAGE_KEYS.UPLOADED_IMAGES, JSON.stringify(validImageData))
      localStorage.setItem(STORAGE_KEYS.SAVED_ANALYSES, JSON.stringify(analyses))
      localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(cameras))
    } catch (error) {
      console.error('데이터 저장 실패:', error)
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
    const avgHealth = data.reduce((sum, item) => sum + item.result.plantHealth, 0) / data.length

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
    if (!selectedModel || selectedAnalysisImages.length === 0 || !selectedPlantType) return

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

      // 2단계: 실제 분석 수행
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const mockResult: AnalysisResult = {
        plantHealth: Math.floor(Math.random() * 20) + 80,
        growthRate: Math.floor(Math.random() * 10) + 10,
        size: Math.floor(Math.random() * 5) + 15,
        height: Math.floor(Math.random() * 10) + 20,
        leafCount: Math.floor(Math.random() * 5) + 8,
        leafSize: Math.floor(Math.random() * 3) + 4,
        leafArea: Math.floor(Math.random() * 50) + 100, // cm²
        leafColor: {
          rgb: {
            r: Math.floor(Math.random() * 50) + 50,
            g: Math.floor(Math.random() * 100) + 100,
            b: Math.floor(Math.random() * 50) + 30,
          },
          hsv: {
            h: Math.floor(Math.random() * 60) + 90, // 녹색 계열
            s: Math.floor(Math.random() * 30) + 60,
            v: Math.floor(Math.random() * 30) + 60,
          },
          greenness: Math.floor(Math.random() * 20) + 75,
          yellowing: Math.floor(Math.random() * 15) + 5,
          browning: Math.floor(Math.random() * 10) + 2,
        },
        leafTexture: ["매끄러움", "약간 거침", "거침", "매우 거침"][Math.floor(Math.random() * 4)],
        leafShape: ["타원형", "심장형", "손바닥형", "침형", "원형"][Math.floor(Math.random() * 5)],
        condition: "양호",
        recommendations: [
          "수분 공급량을 10% 증가시키세요",
          "질소 비료를 추가 공급하는 것을 권장합니다",
          "잎의 색상 변화를 지속적으로 모니터링하세요",
          "적절한 광량을 유지해주세요",
        ],
        date: new Date().toLocaleDateString("ko-KR"),
        comparedImages: selectedAnalysisImages,
        detailedMeasurements: {
          leafPerimeter: Math.floor(Math.random() * 20) + 30, // cm
          leafThickness: Math.round((Math.random() * 0.5 + 0.2) * 100) / 100, // mm
          stemDiameter: Math.round((Math.random() * 2 + 1) * 100) / 100, // cm
          nodeCount: Math.floor(Math.random() * 5) + 3,
        },
      }

      setAnalysisResult(mockResult)
    } catch (error) {
      console.error("분석 중 오류 발생:", error)
      alert("분석 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const saveAnalysis = () => {
    if (!analysisResult || !selectedPlantType) return

    const newAnalysis: SavedAnalysis = {
      id: Math.random().toString(36).substr(2, 9),
      plantType: selectedPlantType,
      date: new Date().toISOString(),
      result: analysisResult,
      userId,
    }

    setSavedAnalyses((prev) => [...prev, newAnalysis])
    
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
          analysis.result.plantHealth >= advancedFilters.healthMin &&
          analysis.result.plantHealth <= advancedFilters.healthMax
        const heightMatch =
          analysis.result.height >= advancedFilters.heightMin && analysis.result.height <= advancedFilters.heightMax

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
        analysis.result.plantHealth >= advancedFilters.healthMin &&
        analysis.result.plantHealth <= advancedFilters.healthMax
      const heightMatch =
        analysis.result.height >= advancedFilters.heightMin && analysis.result.height <= advancedFilters.heightMax

      return plantTypeMatch && dateMatch && healthMatch && heightMatch
    })
  }

  // 필터링된 데이터의 통계 계산 (사용자별)
  const getDataStatistics = () => {
    const filteredData = getFilteredAnalyses()
    if (filteredData.length === 0) return null

    const healthValues = filteredData.map((d) => d.result.plantHealth)
    const heightValues = filteredData.map((d) => d.result.height)
    const leafCountValues = filteredData.map((d) => d.result.leafCount)

    return {
      count: filteredData.length,
      avgHealth: Math.round(healthValues.reduce((a, b) => a + b, 0) / healthValues.length),
      maxHealth: Math.max(...healthValues),
      minHealth: Math.min(...healthValues),
      avgHeight: Math.round(heightValues.reduce((a, b) => a + b, 0) / heightValues.length),
      maxHeight: Math.max(...heightValues),
      minHeight: Math.min(...heightValues),
      avgLeafCount: Math.round(leafCountValues.reduce((a, b) => a + b, 0) / leafCountValues.length),
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
                              analyses.reduce((sum, a) => sum + a.result.plantHealth, 0) / analyses.length,
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
                                    getUserAnalyses().reduce((sum, a) => sum + a.result.plantHealth, 0) /
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
                <Select value={selectedModel} onValueChange={setSelectedModel}>
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
                  {analysisResult.comparedImages && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        📊 {analysisResult.comparedImages.length}개 이미지를 비교 분석했습니다
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">{analysisResult.plantHealth}%</div>
                      <div className="text-sm text-green-600">식물 건강도</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">{analysisResult.growthRate}%</div>
                      <div className="text-sm text-blue-600">성장 속도</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-bold text-gray-700">{analysisResult.height}cm</div>
                      <div className="text-gray-500">키</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-bold text-gray-700">{analysisResult.leafCount}개</div>
                      <div className="text-gray-500">잎 개수</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-bold text-gray-700">{analysisResult.leafSize}cm</div>
                      <div className="text-gray-500">잎 크기</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">전체 크기:</span>
                      <span className="text-sm">{analysisResult.size}cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">상태:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {analysisResult.condition}
                      </Badge>
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

        {/* 저장된 데이터 및 분석 영역 */}
        {getUserAnalyses().length > 0 && (
          <Card className="border-indigo-200">
            <CardHeader className="bg-indigo-50">
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <Database className="h-5 w-5" />
                성장 데이터 분석
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="table" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="table">데이터 표</TabsTrigger>
                  <TabsTrigger value="charts">성장 차트</TabsTrigger>
                </TabsList>

                <TabsContent value="table" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex gap-4 items-center">
                        <Select value={selectedDataPlantType} onValueChange={setSelectedDataPlantType}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="식물 종류별 필터" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">전체 ({getUserAnalyses().length}건)</SelectItem>
                            {plantTypes
                              .filter((plant) => getUserAnalyses().some((analysis) => analysis.plantType === plant.id))
                              .map((plant) => {
                                const count = getUserAnalyses().filter(
                                  (analysis) => analysis.plantType === plant.id,
                                ).length
                                return (
                                  <SelectItem key={plant.id} value={plant.id}>
                                    {plant.name} ({count}건)
                                  </SelectItem>
                                )
                              })}
                          </SelectContent>
                        </Select>

                        {/* 날짜 범위 선택 */}
                        <div className="w-full max-w-sm">
                          <Label className="text-sm font-medium mb-2 block">날짜 범위 필터</Label>
                          <DateRangePicker
                            dateRange={dataDateRange}
                            onDateRangeChange={setDataDateRange}
                            dataPoints={getDataPoints()}
                            plantTypes={plantTypes}
                          />
                        </div>

                        {/* 고급 필터 */}
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="flex items-center gap-2"
                          >
                            <BarChart3 className="h-4 w-4" />
                            고급 필터 {showAdvancedFilters ? "숨기기" : "보기"}
                          </Button>

                          {showAdvancedFilters && (
                            <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">건강도 범위 (%)</Label>
                                  <div className="flex gap-2 items-center">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={advancedFilters.healthMin}
                                      onChange={(e) =>
                                        setAdvancedFilters((prev) => ({
                                          ...prev,
                                          healthMin: Number.parseInt(e.target.value) || 0,
                                        }))
                                      }
                                      className="w-20"
                                    />
                                    <span className="text-sm text-gray-500">~</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={advancedFilters.healthMax}
                                      onChange={(e) =>
                                        setAdvancedFilters((prev) => ({
                                          ...prev,
                                          healthMax: Number.parseInt(e.target.value) || 100,
                                        }))
                                      }
                                      className="w-20"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">키 범위 (cm)</Label>
                                  <div className="flex gap-2 items-center">
                                    <Input
                                      type="number"
                                      min="0"
                                      value={advancedFilters.heightMin}
                                      onChange={(e) =>
                                        setAdvancedFilters((prev) => ({
                                          ...prev,
                                          heightMin: Number.parseInt(e.target.value) || 0,
                                        }))
                                      }
                                      className="w-20"
                                    />
                                    <span className="text-sm text-gray-500">~</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={advancedFilters.heightMax}
                                      onChange={(e) =>
                                        setAdvancedFilters((prev) => ({
                                          ...prev,
                                          heightMax: Number.parseInt(e.target.value) || 100,
                                        }))
                                      }
                                      className="w-20"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setAdvancedFilters({
                                      healthMin: 0,
                                      healthMax: 100,
                                      heightMin: 0,
                                      heightMax: 100,
                                    })
                                  }
                                >
                                  필터 초기화
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 데이터 요약 정보 */}
                      <div className="text-sm text-gray-600">총 {getFilteredAnalyses().length}건의 분석 데이터</div>
                    </div>

                    {/* 데이터 통계 정보 */}
                    {(() => {
                      const stats = getDataStatistics()
                      return (
                        stats && (
                          <div className="border rounded-lg p-4 bg-blue-50 space-y-3">
                            <h4 className="text-sm font-medium text-blue-800">데이터 통계</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="space-y-1">
                                <div className="text-blue-600 font-medium">건강도</div>
                                <div>평균: {stats.avgHealth}%</div>
                                <div>
                                  범위: {stats.minHealth}% ~ {stats.maxHealth}%
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-blue-600 font-medium">키</div>
                                <div>평균: {stats.avgHeight}cm</div>
                                <div>
                                  범위: {stats.minHeight}cm ~ {stats.maxHeight}cm
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-blue-600 font-medium">기타</div>
                                <div>데이터 수: {stats.count}건</div>
                                <div>평균 잎 개수: {stats.avgLeafCount}개</div>
                              </div>
                            </div>
                          </div>
                        )
                      )
                    })()}

                    {/* 선택 및 내보내기 컨트롤 */}
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllDataRows}
                          disabled={getFilteredAnalyses().length === 0}
                        >
                          전체 선택
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={deselectAllDataRows}
                          disabled={selectedDataRows.length === 0}
                        >
                          선택 해제
                        </Button>
                      </div>

                      {selectedDataRows.length > 0 && (
                        <div className="flex gap-2 items-center">
                          <span className="text-sm text-gray-600">{selectedDataRows.length}개 선택됨</span>
                          <Button onClick={exportToExcel} size="sm" className="bg-green-600 hover:bg-green-700">
                            <Database className="h-4 w-4 mr-2" />
                            엑셀로 내보내기
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <input
                                type="checkbox"
                                checked={
                                  getFilteredAnalyses().length > 0 &&
                                  selectedDataRows.length === getFilteredAnalyses().length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    selectAllDataRows()
                                  } else {
                                    deselectAllDataRows()
                                  }
                                }}
                                className="w-4 h-4"
                              />
                            </TableHead>
                            <TableHead>날짜</TableHead>
                            <TableHead>식물 종류</TableHead>
                            <TableHead>건강도</TableHead>
                            <TableHead>키 (cm)</TableHead>
                            <TableHead>잎 개수</TableHead>
                            <TableHead>잎 크기 (cm)</TableHead>
                            <TableHead>상태</TableHead>
                            <TableHead>액션</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredAnalyses().map((analysis) => (
                            <TableRow key={analysis.id}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedDataRows.includes(analysis.id)}
                                  onChange={() => toggleDataRowSelection(analysis.id)}
                                  className="w-4 h-4"
                                />
                              </TableCell>
                              <TableCell>{new Date(analysis.date).toLocaleDateString("ko-KR")}</TableCell>
                              <TableCell>
                                {plantTypes.find((p) => p.id === analysis.plantType)?.name || analysis.plantType}
                              </TableCell>
                              <TableCell>{analysis.result.plantHealth}%</TableCell>
                              <TableCell>{analysis.result.height}</TableCell>
                              <TableCell>{analysis.result.leafCount}</TableCell>
                              <TableCell>{analysis.result.leafSize}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  {analysis.result.condition}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("이 분석 데이터를 삭제하시겠습니까?")) {
                                      setSavedAnalyses((prev) => prev.filter((item) => item.id !== analysis.id))
                                      setSelectedDataRows((prev) => prev.filter((id) => id !== analysis.id))
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  삭제
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {getFilteredAnalyses().length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>선택한 조건에 맞는 데이터가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="charts" className="space-y-4">
                  <div className="space-y-4">
                    <Select value={selectedDataPlantType} onValueChange={setSelectedDataPlantType}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="식물 종류 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {plantTypes
                          .filter((plant) => getUserAnalyses().some((analysis) => analysis.plantType === plant.id))
                          .map((plant) => {
                            const count = getUserAnalyses().filter((analysis) => analysis.plantType === plant.id).length
                            return (
                              <SelectItem key={plant.id} value={plant.id}>
                                {plant.name} ({count}건)
                              </SelectItem>
                            )
                          })}
                      </SelectContent>
                    </Select>

                    {/* 차트용 날짜 범위 선택 */}
                    <div className="w-full max-w-sm">
                      <Label className="text-sm font-medium mb-2 block">날짜 범위 필터</Label>
                      <DateRangePicker
                        dateRange={dataDateRange}
                        onDateRangeChange={setDataDateRange}
                        dataPoints={getDataPoints()}
                        plantTypes={plantTypes}
                      />
                    </div>

                    {selectedDataPlantType && selectedDataPlantType !== "all" && (
                      <div className="space-y-4">
                        {(() => {
                          const plant = plantTypes.find((p) => p.id === selectedDataPlantType)
                          const data = getFilteredData(selectedDataPlantType)
                          return (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">{plant?.name} 성장 분석</h3>
                                <div className="text-sm text-gray-600">
                                  총 {data.length}회 분석 •
                                  {data.length > 1 && ` 기간: ${data[0]?.date} ~ ${data[data.length - 1]?.date}`}
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GrowthChart
                                  data={data}
                                  type="line"
                                  dataKey="height"
                                  title="키 성장 추이"
                                  color="#10b981"
                                  yAxisLabel="키 (cm)"
                                />
                                <GrowthChart
                                  data={data}
                                  type="bar"
                                  dataKey="leafCount"
                                  title="잎 개수 변화"
                                  color="#3b82f6"
                                  yAxisLabel="잎 개수"
                                />
                                <GrowthChart
                                  data={data}
                                  type="line"
                                  dataKey="leafSize"
                                  title="잎 크기 변화"
                                  color="#f59e0b"
                                  yAxisLabel="잎 크기 (cm)"
                                />
                                <GrowthChart
                                  data={data}
                                  type="line"
                                  dataKey="health"
                                  title="건강도 추이"
                                  color="#ef4444"
                                  yAxisLabel="건강도 (%)"
                                />
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
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
