"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ImageIcon, Download, Search, Calendar, Clock, Grid, List, Eye, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"

// 로컬 스토리지 키
const STORAGE_KEYS = {
  UPLOADED_IMAGES: 'crop-analysis-uploaded-images',
  SAVED_ANALYSES: 'crop-analysis-saved-analyses',
  CAMERAS: 'crop-analysis-cameras'
}

// 인터페이스 정의
interface UploadedImage {
  id: string
  file: File
  url: string
  timestamp: Date
  userId: string
}

// 임시 이미지 데이터
const mockImages = [
  {
    id: "1",
    fileName: "tomato_plant_001.jpg",
    url: "/placeholder.svg?height=200&width=200&text=토마토1",
    uploadDate: new Date("2025-01-15T10:30:00"),
    size: "2.4 MB",
    dimensions: "1920x1080",
    userId: "spinmoll",
    tags: ["토마토", "성장초기"],
  },
  {
    id: "2",
    fileName: "tomato_plant_002.jpg",
    url: "/placeholder.svg?height=200&width=200&text=토마토2",
    uploadDate: new Date("2025-01-15T14:20:00"),
    size: "2.1 MB",
    dimensions: "1920x1080",
    userId: "spinmoll",
    tags: ["토마토", "성장중기"],
  },
  {
    id: "3",
    fileName: "cucumber_plant_001.jpg",
    url: "/placeholder.svg?height=200&width=200&text=오이1",
    uploadDate: new Date("2025-01-16T09:15:00"),
    size: "1.8 MB",
    dimensions: "1920x1080",
    userId: "spinmoll",
    tags: ["오이", "성장초기"],
  },
  {
    id: "4",
    fileName: "lettuce_plant_001.jpg",
    url: "/placeholder.svg?height=200&width=200&text=상추1",
    uploadDate: new Date("2025-01-16T16:45:00"),
    size: "2.0 MB",
    dimensions: "1920x1080",
    userId: "spinmoll",
    tags: ["상추", "수확기"],
  },
]

export default function ImagesPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date-desc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [imageToView, setImageToView] = useState<UploadedImage | null>(null)

  // 로컬 스토리지에서 이미지 데이터 로드
  useEffect(() => {
    const loadImages = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.UPLOADED_IMAGES)
        if (stored) {
          const parsedImages: UploadedImage[] = JSON.parse(stored)
          setUploadedImages(parsedImages)
          console.log("업로드된 이미지 로드됨:", parsedImages)
        } else {
          console.log("저장된 이미지가 없습니다")
        }
      } catch (error) {
        console.error("이미지 로드 중 오류:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadImages()
  }, [])

  // 사용자별 이미지 필터링 (실제 업로드된 이미지 + 더미 데이터)
  const userImages = [
    ...uploadedImages.filter((image) => image.userId === user?.id),
    ...mockImages.filter((image) => image.userId === user?.id)
  ]

  // 필터링 및 정렬
  const filteredImages = userImages
    .filter((image) => {
      const fileName = image.fileName || image.file?.name || "unnamed"
      const searchMatch = fileName.toLowerCase().includes(searchTerm.toLowerCase())
      return searchMatch
    })
          .sort((a, b) => {
        switch (sortBy) {
          case "date-desc":
            const dateA = a.uploadDate || a.timestamp || new Date()
            const dateB = b.uploadDate || b.timestamp || new Date()
            return new Date(dateB).getTime() - new Date(dateA).getTime()
          case "date-asc":
            const dateA2 = a.uploadDate || a.timestamp || new Date()
            const dateB2 = b.uploadDate || b.timestamp || new Date()
            return new Date(dateA2).getTime() - new Date(dateB2).getTime()
          case "name-asc":
            const nameA = a.fileName || a.file?.name || "unnamed"
            const nameB = b.fileName || b.file?.name || "unnamed"
            return nameA.localeCompare(nameB)
          case "name-desc":
            const nameA2 = a.fileName || a.file?.name || "unnamed"
            const nameB2 = b.fileName || b.file?.name || "unnamed"
            return nameB2.localeCompare(nameA2)
          default:
            return 0
        }
      })

  const toggleImageSelection = (id: string) => {
    setSelectedImages((prev) => (prev.includes(id) ? prev.filter((imgId) => imgId !== id) : [...prev, id]))
  }

  const selectAll = () => {
    setSelectedImages(filteredImages.map((image) => image.id))
  }

  const deselectAll = () => {
    setSelectedImages([])
  }

  const downloadSelected = () => {
    if (selectedImages.length === 0) {
      alert("다운로드할 이미지를 선택해주세요.")
      return
    }

    // 실제로는 ZIP 파일로 다운로드하는 로직이 필요
    alert(`${selectedImages.length}개 이미지 다운로드를 시작합니다.`)
  }

  const formatFileSize = (size: string) => {
    return size
  }

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) {
      return {
        date: "-",
        time: "-"
      }
    }
    
    const dateObj = date instanceof Date ? date : new Date(date)
    
    if (isNaN(dateObj.getTime())) {
      return {
        date: "-",
        time: "-"
      }
    }
    
    return {
      date: dateObj.toLocaleDateString("ko-KR"),
      time: dateObj.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
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
            <h1 className="text-3xl font-bold text-blue-800 flex items-center gap-2">
              <ImageIcon className="h-8 w-8" />
              업로드 이미지 목록
            </h1>
            <p className="text-blue-600">{user?.name}님이 업로드한 모든 이미지를 확인하세요</p>
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-700">{userImages.length}</div>
              <div className="text-sm text-blue-600">총 이미지</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-700">
                {userImages.reduce((sum, img) => {
                  if (img.size) {
                    return sum + Number.parseFloat(img.size)
                  } else if (img.file?.size) {
                    return sum + (img.file.size / 1024 / 1024)
                  }
                  return sum
                }, 0).toFixed(1)} MB
              </div>
              <div className="text-sm text-green-600">총 용량</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-700">
                {userImages.length > 0 
                  ? formatDate(userImages[0].uploadDate || userImages[0].timestamp || new Date()).date 
                  : "-"}
              </div>
              <div className="text-sm text-purple-600">최근 업로드</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-700">
                {isLoading ? "..." : userImages.length}
              </div>
              <div className="text-sm text-orange-600">실제 이미지</div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              검색 및 정렬
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>검색</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="파일명, 태그 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
                    <SelectItem value="name-asc">이름순 (A-Z)</SelectItem>
                    <SelectItem value="name-desc">이름순 (Z-A)</SelectItem>
                    <SelectItem value="size-desc">크기 큰순</SelectItem>
                    <SelectItem value="size-asc">크기 작은순</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>보기 방식</Label>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
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

            {selectedImages.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">{selectedImages.length}개 이미지가 선택되었습니다</span>
                <Button onClick={downloadSelected} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  선택 이미지 다운로드
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 이미지 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>이미지 목록 ({filteredImages.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-600">이미지를 불러오는 중...</p>
                </div>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredImages.map((image) => {
                  const dateInfo = formatDate(image.uploadDate)
                  return (
                    <div key={image.id} className="relative group">
                      <div className="relative">
                        <Image
                          src={image.url || "/placeholder.svg"}
                          alt={image.fileName || image.file?.name || "이미지"}
                          width={200}
                          height={200}
                          className={`w-full h-32 object-cover rounded-lg border-2 transition-all cursor-pointer ${
                            selectedImages.includes(image.id)
                              ? "border-blue-500 ring-2 ring-blue-200"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                          onClick={() => setImageToView(image)}
                        />

                        {/* 선택 체크박스 */}
                        <div className="absolute top-2 left-2">
                          <input
                            type="checkbox"
                            checked={selectedImages.includes(image.id)}
                            onChange={() => toggleImageSelection(image.id)}
                            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* 보기 버튼 */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              setImageToView(image)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* 파일 정보 오버레이 */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="text-xs truncate">{image.fileName || image.file?.name || "unnamed"}</div>
                          <div className="text-xs text-gray-300">
                            {image.size || `${Math.round((image.file?.size || 0) / 1024 / 1024 * 10) / 10} MB`}
                          </div>
                        </div>
                      </div>

                      {/* 날짜/시간 정보 */}
                      <div className="mt-2 text-center">
                        <div className="text-xs font-medium text-gray-700">{dateInfo.date}</div>
                        <div className="text-xs text-gray-500">{dateInfo.time}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredImages.map((image) => {
                  const dateInfo = formatDate(image.uploadDate)
                  return (
                    <div
                      key={image.id}
                      className={`flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 ${
                        selectedImages.includes(image.id) ? "bg-blue-50 border-blue-200" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(image.id)}
                        onChange={() => toggleImageSelection(image.id)}
                        className="w-4 h-4 text-blue-600"
                      />

                      <Image
                        src={image.url || "/placeholder.svg"}
                        alt={image.fileName || image.file?.name || "이미지"}
                        width={60}
                        height={60}
                        className="w-15 h-15 object-cover rounded border cursor-pointer"
                        onClick={() => setImageToView(image)}
                      />

                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {image.fileName || image.file?.name || "unnamed"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {image.dimensions || "알 수 없음"} • {image.size || `${Math.round((image.file?.size || 0) / 1024 / 1024 * 10) / 10} MB`}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {image.tags?.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          )) || (
                            <Badge variant="outline" className="text-xs">
                              {image.file?.type || "image"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {dateInfo.date}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {dateInfo.time}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {filteredImages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>조건에 맞는 이미지가 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 이미지 뷰어 모달 */}
        {imageToView && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            onClick={() => setImageToView(null)}
          >
            <div className="max-w-[95vw] max-h-[95vh] relative" onClick={(e) => e.stopPropagation()}>
              {/* 닫기 버튼 */}
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white"
                onClick={() => setImageToView(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* 이미지 */}
              <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {imageToView.fileName || imageToView.file?.name || "이미지"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(imageToView.uploadDate || imageToView.timestamp || new Date()).date}{" "}
                        {formatDate(imageToView.uploadDate || imageToView.timestamp || new Date()).time}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {imageToView.size || `${Math.round((imageToView.file?.size || 0) / 1024 / 1024 * 10) / 10} MB`}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-100">
                  <Image
                    src={imageToView.url || "/placeholder.svg"}
                    alt={imageToView.fileName || imageToView.file?.name || "이미지"}
                    width={1200}
                    height={800}
                    className="w-full h-auto max-h-[70vh] object-contain rounded bg-white"
                  />
                </div>

                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">파일명:</span>
                      <span className="ml-2">{imageToView.fileName || imageToView.file?.name || "unnamed"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">크기:</span>
                      <span className="ml-2">
                        {imageToView.size || `${Math.round((imageToView.file?.size || 0) / 1024 / 1024 * 10) / 10} MB`}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">업로드 시간:</span>
                      <span className="ml-2">
                        {formatDate(imageToView.uploadDate || imageToView.timestamp || new Date()).date}{" "}
                        {formatDate(imageToView.uploadDate || imageToView.timestamp || new Date()).time}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">타입:</span>
                      <span className="ml-2">{imageToView.file?.type || "image/jpeg"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
