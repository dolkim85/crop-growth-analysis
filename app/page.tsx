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
import { Upload, Camera, Plus, Play, Leaf, TrendingUp, Clock, BarChart3, CheckCircle, Save, Database, Info, X, CalendarIcon, Check, Shield, Users, Zap } from 'lucide-react'
import Image from "next/image"
import { ImageEditorModal } from "@/components/image-editor-modal"
import { GrowthChart } from "@/components/growth-chart"
import { DateRangePicker } from "@/components/date-range-picker"
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
import { Navbar } from '@/components/navbar'

interface UploadedImage {
  id: string
  file: File
  url: string
  timestamp: Date
}

interface ObservationCamera {
  id: string
  name: string
  photos: { name: string; date: Date }[]
}

interface AnalysisResult {
  plantHealth: number
  growthRate: number
  size: number
  height: number
  leafCount: number
  leafSize: number
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

// Base64를 File로 변환하는 함수
const base64ToFile = (base64: string, filename: string): File => {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('Invalid base64 string')
  }
  
  const arr = base64.split(',')
  if (arr.length < 2) {
    throw new Error('Invalid base64 format')
  }
  
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
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cameras, setCameras] = useState<ObservationCamera[]>([
    {
      id: "1",
      name: "온실 A-1",
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
      result: {
        plantHealth: 97,
        growthRate: 12,
        size: 18,
        height: 28,
        leafCount: 12,
        leafSize: 6,
        condition: "양호",
        recommendations: ["수분 공급량을 10% 증가시키세요"],
        date: "2025-04-28",
      },
    },
    {
      id: "2",
      plantType: "tomato",
      date: "2025-05-15T10:00:00",
      result: {
        plantHealth: 92,
        growthRate: 10,
        size: 20,
        height: 32,
        leafCount: 14,
        leafSize: 7,
        condition: "양호",
        recommendations: ["질소 비료를 추가 공급하는 것을 권장합니다"],
        date: "2025-05-15",
      },
    },
    {
      id: "3",
      plantType: "cucumber",
      date: "2025-05-10T10:00:00",
      result: {
        plantHealth: 88,
        growthRate: 15,
        size: 22,
        height: 35,
        leafCount: 8,
        leafSize: 9,
        condition: "양호",
        recommendations: ["잎의 색상 변화를 지속적으로 모니터링하세요"],
        date: "2025-05-10",
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

  // 로컬스토리지에서 데이터 로드하는 함수
  const loadFromStorage = async () => {
    try {
      setIsLoading(true)
      
      // 업로드된 이미지 로드
      const storedImages = localStorage.getItem(STORAGE_KEYS.UPLOADED_IMAGES)
      if (storedImages) {
        try {
          const imageData = JSON.parse(storedImages)
          if (Array.isArray(imageData)) {
            const restoredImages = await Promise.all(
              imageData.map(async (item: any) => {
            try {
              // base64와 fileName이 유효한지 확인
              if (!item.base64 || !item.fileName || !item.id) {
                console.warn('Invalid image data:', item)
                return null
              }
              
              const file = base64ToFile(item.base64, item.fileName)
              return {
                id: item.id,
                file,
                url: item.base64, // base64를 URL로 사용
                timestamp: new Date(item.timestamp || new Date())
              }
            } catch (error) {
              console.error('이미지 복원 실패:', error, item)
              return null
            }
          })
            )
            setUploadedImages(restoredImages.filter(img => img !== null) as UploadedImage[])
          } else {
            console.warn('Invalid image data format in localStorage')
          }
        } catch (parseError) {
          console.error('Failed to parse stored images:', parseError)
        }
      }

      // 분석 결과 로드
      const storedAnalyses = localStorage.getItem(STORAGE_KEYS.SAVED_ANALYSES)
      if (storedAnalyses) {
        try {
          const analysesData = JSON.parse(storedAnalyses)
          if (Array.isArray(analysesData)) {
            setSavedAnalyses(analysesData)
          }
        } catch (parseError) {
          console.error('Failed to parse stored analyses:', parseError)
        }
      }

      // 카메라 정보 로드
      const storedCameras = localStorage.getItem(STORAGE_KEYS.CAMERAS)
      if (storedCameras) {
        try {
          const camerasData = JSON.parse(storedCameras)
          if (Array.isArray(camerasData)) {
            setCameras(camerasData)
          }
        } catch (parseError) {
          console.error('Failed to parse stored cameras:', parseError)
        }
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
              timestamp: img.timestamp.toISOString()
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
    loadFromStorage()
  }, [])

  // 데이터 변경 시 자동 저장
  useEffect(() => {
    if (!isLoading) {
      saveToStorage(uploadedImages, savedAnalyses, cameras)
    }
  }, [uploadedImages, savedAnalyses, cameras, isLoading])

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
    // 해당 식물 종류의 데이터가 있는지 확인
    const hasData = savedAnalyses.some((analysis) => analysis.plantType === plantTypeId)
    if (hasData) {
      if (confirm("이 식물 종류에 저장된 데이터가 있습니다. 정말 삭제하시겠습니까?")) {
        setPlantTypes((prev) => prev.filter((plant) => plant.id !== plantTypeId))
        setSavedAnalyses((prev) => prev.filter((analysis) => analysis.plantType !== plantTypeId))
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

  // 식물 종류별 통계 계산 함수
  const getPlantTypeStats = (plantTypeId: string) => {
    const data = savedAnalyses.filter((analysis) => analysis.plantType === plantTypeId)
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
    }))

    setUploadedImages((prev) => [...prev, ...newImages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()))
  }

  const handleCameraPhotoSelect = (photoName: string) => {
    const mockImage: UploadedImage = {
      id: Math.random().toString(36).substr(2, 9),
      file: new File([], photoName),
      url: `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(photoName)}`,
      timestamp: new Date(photoName.replace(".jpg", "").replace("_", " ")),
    }

    setUploadedImages((prev) => [...prev, mockImage].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()))
  }

  const addNewCamera = () => {
    if (newCameraName.trim()) {
      const newCamera: ObservationCamera = {
        id: Math.random().toString(36).substr(2, 9),
        name: newCameraName,
        photos: [],
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

    const camera = cameras.find((c) => c.id === selectedCamera)
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
      // 선택된 이미지들만 분석에 사용
      const analysisImages = uploadedImages.filter((img) => selectedAnalysisImages.includes(img.id))

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
        condition: "양호",
        recommendations: [
          "수분 공급량을 10% 증가시키세요",
          "질소 비료를 추가 공급하는 것을 권장합니다",
          "잎의 색상 변화를 지속적으로 모니터링하세요",
        ],
        date: new Date().toLocaleDateString("ko-KR"),
        comparedImages: selectedAnalysisImages,
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
    setSelectedImages(uploadedImages.map((img) => img.id))
  }

  const deselectAllImages = () => {
    setSelectedImages([])
  }

  const selectAllAnalysisImages = () => {
    setSelectedAnalysisImages(uploadedImages.map((img) => img.id))
  }

  const deselectAllAnalysisImages = () => {
    setSelectedAnalysisImages([])
  }

  // 선택된 식물 종류의 데이터만 필터링 (날짜 범위 포함)
  const getFilteredData = (plantType: string) => {
    return savedAnalyses
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

  // 날짜 범위와 식물 종류로 필터링된 분석 데이터 가져오기
  const getFilteredAnalyses = () => {
    return savedAnalyses.filter((analysis) => {
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

  // 필터링된 데이터의 통계 계산
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

  // 날짜별 데이터 포인트 생성
  const getDataPoints = () => {
    return savedAnalyses.map((analysis) => ({
      date: analysis.date,
      plantType: analysis.plantType,
    }))
  }

  const selectedModelInfo = models.find((model) => model.id === hoveredModel)

  const exportToExcel = () => {
    const selectedData = savedAnalyses.filter((analysis) => selectedDataRows.includes(analysis.id))

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
    link.setAttribute("download", `작물분석데이터_${new Date().toLocaleDateString("ko-KR").replace(/\./g, "")}.csv`)
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
      <Navbar />
      <main>
        {/* 히어로 섹션 */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Leaf className="h-16 w-16 text-green-600" />
            </div>
            <h1 className="text-5xl font-bold text-green-800 mb-6">
              스마트팜 작물 성장 분석 시스템
            </h1>
            <p className="text-xl text-green-600 mb-8 max-w-3xl mx-auto">
              AI 기반 이미지 분석으로 작물의 성장을 모니터링하고,
              데이터 기반의 정확한 농업 인사이트를 제공합니다.
            </p>

            {isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-lg text-green-700">
                  안녕하세요, <span className="font-semibold">{user?.name}</span>님!
                </p>
                <Link href="/analysis">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    작물 분석 시작하기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
                    무료로 시작하기
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-green-300 text-green-700 hover:bg-green-50">
                    로그인
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* 주요 기능 섹션 */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              주요 기능
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="border-green-200 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Upload className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <CardTitle className="text-green-800">이미지 업로드</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    작물 이미지를 쉽게 업로드하고 시간순으로 정리하여 성장 과정을 추적할 수 있습니다.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Camera className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle className="text-blue-800">관찰 카메라</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    설치된 카메라에서 10분 단위로 촬영된 사진을 자동으로 수집하고 분석합니다.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <CardTitle className="text-purple-800">AI 분석</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    머신러닝 기반 분석 모델로 식물의 건강도, 성장 속도, 크기 변화를 정확하게 측정합니다.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <TrendingUp className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <CardTitle className="text-orange-800">성장 추적</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    시간에 따른 성장 데이터를 차트로 시각화하고 성장 패턴을 분석합니다.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 장점 섹션 */}
        <section className="py-16 px-4 bg-green-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              왜 우리 시스템을 선택해야 할까요?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <Shield className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-4">정확한 분석</h3>
                <p className="text-gray-600">
                  최신 AI 기술을 활용하여 97% 이상의 정확도로 작물 상태를 분석합니다.
                </p>
              </div>
              <div className="text-center">
                <Zap className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-4">실시간 모니터링</h3>
                <p className="text-gray-600">
                  24시간 실시간으로 작물 상태를 모니터링하고 즉시 알림을 제공합니다.
                </p>
              </div>
              <div className="text-center">
                <Users className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-4">사용자 친화적</h3>
                <p className="text-gray-600">
                  직관적인 인터페이스로 누구나 쉽게 사용할 수 있는 시스템입니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        {!isAuthenticated && (
          <section className="py-16 px-4 bg-green-600">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-6">
                지금 바로 시작해보세요
              </h2>
              <p className="text-xl text-green-100 mb-8">
                무료 계정을 만들고 스마트팜 분석의 혁신을 경험해보세요.
              </p>
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                  무료 회원가입
                </Button>
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Leaf className="h-6 w-6 text-green-400" />
            <span className="text-lg font-semibold">스마트팜 분석 시스템</span>
          </div>
          <p className="text-gray-400">
            © 2024 Smart Farm Analysis System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
