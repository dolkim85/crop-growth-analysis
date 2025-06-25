"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, BarChart3, Download, Search, Filter, Calendar, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"

// 로컬 스토리지 키
const STORAGE_KEYS = {
  UPLOADED_IMAGES: 'crop-analysis-uploaded-images',
  SAVED_ANALYSES: 'crop-analysis-saved-analyses',
  CAMERAS: 'crop-analysis-cameras'
}

// 인터페이스 정의
interface EnvironmentData {
  innerTemperature: number // 내부온도 (°C)
  outerTemperature: number // 외부온도 (°C)
  innerHumidity: number // 내부습도 (%)
  rootZoneTemperature: number // 근권온도 (°C)
  solarRadiation: number // 일사량 (W/m²)
  ph: number // PH
  ec: number // EC (dS/m)
  dissolvedOxygen: number // DO (mg/L)
}

interface AnalysisResult {
  modelId: string
  selectedAnalysisItems: string[]
  analysisData: { [key: string]: any }
  environmentData?: EnvironmentData // 환경 데이터 (선택적)
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

// 임시 데이터 (실제로는 전역 상태나 API에서 가져와야 함)
const mockAnalyses = [
  {
    id: "1",
    plantType: "tomato",
    date: "2025-04-28T10:00:00",
    userId: "spinmoll",
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
    userId: "spinmoll",
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
    userId: "spinmoll",
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
]

const plantTypes = [
  { id: "tomato", name: "토마토" },
  { id: "lettuce", name: "상추" },
  { id: "cucumber", name: "오이" },
  { id: "pepper", name: "고추" },
  { id: "strawberry", name: "딸기" },
  { id: "spinach", name: "시금치" },
]

// AI 모델 정보 매핑
const modelInfo = {
  "plant-health-basic": { name: "기본 식물 건강도 분석", type: "무료" },
  "plantnet-basic": { name: "식물 분류 기본", type: "무료" },
  "tensorflow-plant-free": { name: "딥러닝 식물 분류기", type: "무료" },
  "plantix-professional": { name: "전문 작물 진단", type: "유료", price: "$29/월" },
  "cropx-premium": { name: "고급 농작물 분석", type: "유료", price: "$49/월" },
  "agro-monitoring-pro": { name: "농업 모니터링 전문", type: "유료", price: "$19/월" },
  "azure-farmbeats": { name: "클라우드 농장 분석", type: "유료", price: "$89/월" },
  "custom-cnn": { name: "맞춤형 딥러닝", type: "학습AI" },
  "transfer-learning": { name: "전이 학습 모델", type: "학습AI" },
  "automl-vision": { name: "자동 시각 학습", type: "학습AI" },
  "ensemble-learning": { name: "앙상블 학습", type: "학습AI" },
} as const

// 분석 항목 정보 매핑
const analysisItemsInfo = {
  plantHealth: "식물 건강도",
  leafColor: "잎 색상 분석",
  size: "크기",
  leafCount: "잎 개수",
  condition: "상태",
  plantSpecies: "식물 종류",
  diseaseDetection: "병해 감지",
  confidence: "신뢰도",
  leafCondition: "잎 상태",
  plantClassification: "식물 분류",
  growthStage: "성장 단계",
  maturityLevel: "성숙도",
  leafDevelopment: "잎 발달도",
  soilMoisture: "토양 수분",
  airTemperature: "기온",
  leafTemperature: "잎 온도",
  lightIntensity: "광도",
  diseaseClassification: "병해 분류",
  pestDetection: "해충 감지",
  nutritionDeficiency: "영양 결핍",
  stressLevel: "스트레스 수준",
  yieldPrediction: "수확량 예측",
  plantGrowthRate: "성장률",
  leafArea: "잎 면적",
  stemThickness: "줄기 두께",
  rootHealth: "뿌리 건강",
  floweringStage: "개화 단계",
  fruitDevelopment: "과실 발달",
  overallHealthScore: "종합 건강 점수",
  plantHeight: "식물 키",
  leafLength: "잎 길이",
  leafWidth: "잎 너비",
} as const

export default function AnalysesPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPlantType, setSelectedPlantType] = useState("all")
  const [sortBy, setSortBy] = useState("date-desc")
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    const loadAnalyses = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.SAVED_ANALYSES)
        if (stored) {
          const parsedAnalyses: SavedAnalysis[] = JSON.parse(stored)
          setSavedAnalyses(parsedAnalyses)
          console.log("분석 결과 로드됨:", parsedAnalyses)
        } else {
          // 기존 mockAnalyses를 fallback으로 사용
          setSavedAnalyses(mockAnalyses)
          console.log("기본 데이터 사용")
        }
      } catch (error) {
        console.error("분석 결과 로드 중 오류:", error)
        setSavedAnalyses(mockAnalyses) // 오류 시 기본 데이터 사용
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalyses()
  }, [])

  // 사용자별 데이터 필터링
  const userAnalyses = savedAnalyses.filter((analysis) => analysis.userId === user?.id)

  // 필터링 및 정렬
  const filteredAnalyses = userAnalyses
    .filter((analysis) => {
      const plantTypeMatch = selectedPlantType === "all" || analysis.plantType === selectedPlantType
      const searchMatch =
        plantTypes
          .find((p) => p.id === analysis.plantType)
          ?.name.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        analysis.result.condition.toLowerCase().includes(searchTerm.toLowerCase())
      return plantTypeMatch && searchMatch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "health-desc":
          return b.result.plantHealth - a.result.plantHealth
        case "health-asc":
          return a.result.plantHealth - b.result.plantHealth
        default:
          return 0
      }
    })

  const toggleRowSelection = (id: string) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  const selectAll = () => {
    setSelectedRows(filteredAnalyses.map((analysis) => analysis.id))
  }

  const deselectAll = () => {
    setSelectedRows([])
  }

  const exportSelected = () => {
    const selectedData = filteredAnalyses.filter((analysis) => selectedRows.includes(analysis.id))
    if (selectedData.length === 0) {
      alert("내보낼 데이터를 선택해주세요.")
      return
    }

    // CSV 내보내기 로직
    const headers = ["날짜", "식물 종류", "건강도 (%)", "키 (cm)", "잎 개수", "상태"]
    const csvData = selectedData.map((analysis) => [
      new Date(analysis.date).toLocaleDateString("ko-KR"),
      plantTypes.find((p) => p.id === analysis.plantType)?.name || analysis.plantType,
      analysis.result.plantHealth,
      analysis.result.height,
      analysis.result.leafCount,
      analysis.result.condition,
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })

    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `분석결과_${user?.name}_${new Date().toLocaleDateString("ko-KR").replace(/\./g, "")}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 선택된 분석 결과 삭제 함수
  const deleteSelected = async () => {
    if (selectedRows.length === 0) {
      alert("삭제할 분석 결과를 선택해주세요.")
      return
    }

    if (confirm(`선택된 ${selectedRows.length}개의 분석 결과를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`)) {
      try {
        // 현재 저장된 분석 결과 불러오기
        const currentAnalyses = await loadAnalyses()
        
        // 선택된 항목들 제외한 새로운 배열 생성
        const updatedAnalyses = currentAnalyses.filter(analysis => !selectedRows.includes(analysis.id))
        
        // 로컬 스토리지에 저장
        localStorage.setItem(STORAGE_KEYS.SAVED_ANALYSES, JSON.stringify(updatedAnalyses))
        
        // 상태 업데이트
        setAnalyses(updatedAnalyses)
        setSelectedRows([])
        
        alert(`${selectedRows.length}개의 분석 결과가 삭제되었습니다.`)
      } catch (error) {
        console.error("삭제 중 오류 발생:", error)
        alert("삭제 중 오류가 발생했습니다. 다시 시도해주세요.")
      }
    }
  }

  // 환경 데이터 표시 컴포넌트
  const EnvironmentDataDisplay = ({ environmentData }: { environmentData?: EnvironmentData }) => {
    if (!environmentData) {
      return (
        <div className="text-sm text-gray-500 italic">
          환경 데이터 없음
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 mb-2">환경 데이터</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">내부온도:</span>
            <span className="font-medium">{environmentData.innerTemperature}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">외부온도:</span>
            <span className="font-medium">{environmentData.outerTemperature}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">습도:</span>
            <span className="font-medium">{environmentData.innerHumidity}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">근권온도:</span>
            <span className="font-medium">{environmentData.rootZoneTemperature}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">일사량:</span>
            <span className="font-medium">{environmentData.solarRadiation}W/m²</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">PH:</span>
            <span className="font-medium">{environmentData.ph}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">EC:</span>
            <span className="font-medium">{environmentData.ec}dS/m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">DO:</span>
            <span className="font-medium">{environmentData.dissolvedOxygen}mg/L</span>
          </div>
        </div>
      </div>
    )
  }

  // 식물 종류별 통계 개선 함수
  const getPlantTypeStatistics = () => {
    const plantStats: { [key: string]: any } = {}

    plantTypes.forEach(plantType => {
      const plantAnalyses = userAnalyses.filter(analysis => analysis.plantType === plantType.id)
      
      if (plantAnalyses.length > 0) {
        const healthValues = plantAnalyses.map(a => {
          return a.result.plantHealth || a.result.analysisData?.plantHealth || 0
        }).filter(h => h > 0)
        
        const heightValues = plantAnalyses.map(a => {
          return a.result.height || a.result.analysisData?.height || 0
        }).filter(h => h > 0)
        
        plantStats[plantType.id] = {
          name: plantType.name,
          count: plantAnalyses.length,
          avgHealth: healthValues.length > 0 ? Math.round(healthValues.reduce((a, b) => a + b, 0) / healthValues.length) : 0,
          avgHeight: heightValues.length > 0 ? Math.round(heightValues.reduce((a, b) => a + b, 0) / heightValues.length) : 0,
          maxHealth: healthValues.length > 0 ? Math.max(...healthValues) : 0,
          minHealth: healthValues.length > 0 ? Math.min(...healthValues) : 0,
          maxHeight: heightValues.length > 0 ? Math.max(...heightValues) : 0,
          minHeight: heightValues.length > 0 ? Math.min(...heightValues) : 0,
          latestDate: plantAnalyses.length > 0 ? plantAnalyses[plantAnalyses.length - 1].date : null
        }
      }
    })

    return plantStats
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Link href="/analysis">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-green-800 flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              분석 결과 목록
            </h1>
            <p className="text-green-600">{user?.name}님의 모든 분석 결과를 확인하세요</p>
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-700">{userAnalyses.length}</div>
              <div className="text-sm text-green-600">총 분석 결과</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-700">
                {userAnalyses.length > 0
                  ? Math.round(userAnalyses.reduce((sum, a) => {
                      // plantHealth 필드가 있으면 사용, 없으면 analysisData에서 찾기
                      const health = a.result.plantHealth || 
                                   (a.result.analysisData?.plantHealth) || 
                                   80 // 기본값
                      return sum + health
                    }, 0) / userAnalyses.length)
                  : 0}
                %
              </div>
              <div className="text-sm text-blue-600">전체 평균 건강도</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-700">
                {new Set(userAnalyses.map((a) => a.plantType)).size}
              </div>
              <div className="text-sm text-purple-600">분석 식물 종류</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-700">
                {userAnalyses.length > 0
                  ? Math.round(userAnalyses.reduce((sum, a) => {
                      // height 필드가 있으면 사용, 없으면 analysisData에서 찾기
                      const height = a.result.height || 
                                   (a.result.analysisData?.height) || 
                                   25 // 기본값
                      return sum + height
                    }, 0) / userAnalyses.length)
                  : 0}
                cm
              </div>
              <div className="text-sm text-orange-600">전체 평균 키</div>
            </CardContent>
          </Card>
        </div>

        {/* 식물 종류별 상세 통계 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              식물 종류별 상세 통계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(() => {
                const plantStats = getPlantTypeStatistics()
                return Object.entries(plantStats).map(([plantId, stats]) => (
                  <div key={plantId} className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-green-800">{stats.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {stats.count}건
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">평균 건강도:</span>
                        <span className="font-medium text-blue-600">{stats.avgHealth}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">평균 키:</span>
                        <span className="font-medium text-orange-600">{stats.avgHeight}cm</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">건강도 범위:</span>
                        <span className="font-medium text-gray-700">{stats.minHealth}~{stats.maxHealth}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">키 범위:</span>
                        <span className="font-medium text-gray-700">{stats.minHeight}~{stats.maxHeight}cm</span>
                      </div>
                      {stats.latestDate && (
                        <div className="text-xs text-gray-500 mt-2">
                          최근 분석: {new Date(stats.latestDate).toLocaleDateString("ko-KR")}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </CardContent>
        </Card>

        {/* 필터 및 검색 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              필터 및 검색
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>검색</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="식물 종류, 상태 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>식물 종류</Label>
                <Select value={selectedPlantType} onValueChange={setSelectedPlantType}>
                  <SelectTrigger>
                    <SelectValue placeholder="식물 종류 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {plantTypes.map((plant) => (
                      <SelectItem key={plant.id} value={plant.id}>
                        {plant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>정렬</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="정렬 방식" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">최신순</SelectItem>
                    <SelectItem value="date-asc">오래된순</SelectItem>
                    <SelectItem value="health-desc">건강도 높은순</SelectItem>
                    <SelectItem value="health-asc">건강도 낮은순</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>선택 관리</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    전체 선택
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    선택 해제
                  </Button>
                </div>
              </div>
            </div>

            {selectedRows.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">{selectedRows.length}개 항목이 선택되었습니다</span>
                <div className="flex gap-2">
                  <Button onClick={exportSelected} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Download className="h-4 w-4 mr-2" />
                    내보내기
                  </Button>
                  <Button onClick={deleteSelected} variant="destructive" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    삭제
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 분석 결과 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle>분석 결과 ({filteredAnalyses.length}건)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-600">분석 결과를 불러오는 중...</p>
                </div>
              </div>
            ) : filteredAnalyses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">📊</div>
                <p className="text-gray-600 mb-2">분석 결과가 없습니다</p>
                <p className="text-sm text-gray-500">
                  {searchTerm || selectedPlantType !== "all" 
                    ? "필터 조건을 변경해보세요" 
                    : "새로운 분석을 시작해보세요"}
                </p>
                <Link href="/analysis" className="inline-block mt-4">
                  <Button variant="outline">
                    분석하기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={filteredAnalyses.length > 0 && selectedRows.length === filteredAnalyses.length}
                        onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
                        className="w-4 h-4"
                      />
                    </TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>식물 종류</TableHead>
                    <TableHead>분석 모델</TableHead>
                    <TableHead>분석 항목</TableHead>
                    <TableHead>건강도</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>환경 데이터</TableHead>
                    <TableHead>권장사항</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnalyses.map((analysis) => (
                    <TableRow key={analysis.id} className="hover:bg-gray-50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(analysis.id)}
                          onChange={() => toggleRowSelection(analysis.id)}
                          className="w-4 h-4"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{new Date(analysis.date).toLocaleDateString("ko-KR")}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(analysis.date).toLocaleTimeString("ko-KR")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {plantTypes.find((p) => p.id === analysis.plantType)?.name || analysis.plantType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {analysis.result.modelId && modelInfo[analysis.result.modelId as keyof typeof modelInfo] 
                              ? modelInfo[analysis.result.modelId as keyof typeof modelInfo].name
                              : "레거시 모델"}
                          </Badge>
                          {analysis.result.modelId && modelInfo[analysis.result.modelId as keyof typeof modelInfo] && (
                            <div className="text-xs text-gray-500">
                              {modelInfo[analysis.result.modelId as keyof typeof modelInfo].type}
                              {modelInfo[analysis.result.modelId as keyof typeof modelInfo].price && 
                                ` (${modelInfo[analysis.result.modelId as keyof typeof modelInfo].price})`}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-48">
                          {analysis.result.selectedAnalysisItems?.slice(0, 3).map((item, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {analysisItemsInfo[item as keyof typeof analysisItemsInfo] || 
                               item.replace(/([A-Z])/g, ' $1').trim()}
                            </Badge>
                          ))}
                          {(analysis.result.selectedAnalysisItems?.length || 0) > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(analysis.result.selectedAnalysisItems?.length || 0) - 3}개 더
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const health = analysis.result.plantHealth || 
                                         (analysis.result.analysisData?.plantHealth) || 
                                         80
                            return (
                              <>
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    health >= 90
                                      ? "bg-green-500"
                                      : health >= 70
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                  }`}
                                ></div>
                                <span className="font-medium">{health}%</span>
                              </>
                            )
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {analysis.result.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <EnvironmentDataDisplay environmentData={analysis.result.environmentData} />
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-xs text-gray-600 truncate">{analysis.result.recommendations[0]}</p>
                          {analysis.result.recommendations.length > 1 && (
                            <p className="text-xs text-gray-400">+{analysis.result.recommendations.length - 1}개 더</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 식물종류별 평가 시스템 */}
        {userAnalyses.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                식물종류별 성장 평가
              </CardTitle>
              <p className="text-sm text-gray-600">
                각 식물 종류별로 평균 건강도, 성장 추이, 분석 횟수를 종합하여 평가합니다.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plantTypes
                  .filter(plant => userAnalyses.some(a => a.plantType === plant.id))
                  .map(plant => {
                    const plantAnalyses = userAnalyses.filter(a => a.plantType === plant.id)
                    const avgHealth = plantAnalyses.reduce((sum, a) => {
                      const health = a.result.plantHealth || 
                                   (a.result.analysisData?.plantHealth) || 
                                   80
                      return sum + health
                    }, 0) / plantAnalyses.length
                    
                    const avgHeight = plantAnalyses.reduce((sum, a) => {
                      const height = a.result.height || 
                                   (a.result.analysisData?.height) || 
                                   25
                      return sum + height
                    }, 0) / plantAnalyses.length

                    const recentAnalyses = plantAnalyses
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 3)
                    
                    const healthTrend = recentAnalyses.length > 1 ? 
                      (recentAnalyses[0].result.plantHealth || 80) - (recentAnalyses[recentAnalyses.length - 1].result.plantHealth || 80) : 0

                    const getGrade = (health: number, trend: number, count: number) => {
                      let score = 0
                      // 건강도 점수 (40%)
                      if (health >= 90) score += 40
                      else if (health >= 80) score += 32
                      else if (health >= 70) score += 24
                      else score += 16
                      
                      // 추이 점수 (30%)
                      if (trend > 5) score += 30
                      else if (trend > 0) score += 24
                      else if (trend > -5) score += 18
                      else score += 12
                      
                      // 분석 횟수 점수 (30%)
                      if (count >= 10) score += 30
                      else if (count >= 5) score += 24
                      else if (count >= 3) score += 18
                      else score += 12
                      
                      if (score >= 85) return { grade: "A+", color: "text-green-600 bg-green-50", description: "매우 우수" }
                      else if (score >= 75) return { grade: "A", color: "text-green-600 bg-green-50", description: "우수" }
                      else if (score >= 65) return { grade: "B+", color: "text-blue-600 bg-blue-50", description: "양호" }
                      else if (score >= 55) return { grade: "B", color: "text-blue-600 bg-blue-50", description: "보통" }
                      else if (score >= 45) return { grade: "C+", color: "text-yellow-600 bg-yellow-50", description: "주의" }
                      else return { grade: "C", color: "text-red-600 bg-red-50", description: "개선 필요" }
                    }

                    const evaluation = getGrade(avgHealth, healthTrend, plantAnalyses.length)

                    return (
                      <div key={plant.id} className={`p-4 rounded-lg border-2 ${evaluation.color.includes('green') ? 'border-green-200' : 
                                                                                    evaluation.color.includes('blue') ? 'border-blue-200' :
                                                                                    evaluation.color.includes('yellow') ? 'border-yellow-200' : 'border-red-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-lg">{plant.name}</h4>
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${evaluation.color}`}>
                            {evaluation.grade}
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">평균 건강도:</span>
                            <span className="font-medium">{avgHealth.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">평균 키:</span>
                            <span className="font-medium">{avgHeight.toFixed(1)}cm</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">분석 횟수:</span>
                            <span className="font-medium">{plantAnalyses.length}회</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">건강도 추이:</span>
                            <span className={`font-medium flex items-center gap-1 ${
                              healthTrend > 0 ? 'text-green-600' : healthTrend < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {healthTrend > 0 ? '↗️' : healthTrend < 0 ? '↘️' : '→'}
                              {healthTrend > 0 ? '+' : ''}{healthTrend.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t">
                          <p className={`text-sm font-medium ${evaluation.color.split(' ')[0]}`}>
                            {evaluation.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {evaluation.grade === 'A+' || evaluation.grade === 'A' ? 
                              '지속적으로 좋은 상태를 유지하고 있습니다.' :
                             evaluation.grade === 'B+' || evaluation.grade === 'B' ?
                              '현재 상태가 양호하며 조금 더 세심한 관리가 필요합니다.' :
                              '관리 방법을 개선하여 식물 건강도를 높일 필요가 있습니다.'
                            }
                          </p>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
