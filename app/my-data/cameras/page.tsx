"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Camera, Play, Pause, RotateCcw, Settings, Maximize, Volume2, VolumeX } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"

// 임시 카메라 데이터
const mockCameras = [
  {
    id: "1",
    name: "온실 A-1",
    location: "온실 A동 1번 구역",
    status: "online",
    streamUrl: "/placeholder.svg?height=480&width=640&text=온실A-1실시간영상",
    resolution: "1920x1080",
    fps: 30,
    userId: "spinmoll",
    lastUpdate: new Date(),
  },
  {
    id: "2",
    name: "온실 A-2",
    location: "온실 A동 2번 구역",
    status: "online",
    streamUrl: "/placeholder.svg?height=480&width=640&text=온실A-2실시간영상",
    resolution: "1920x1080",
    fps: 30,
    userId: "spinmoll",
    lastUpdate: new Date(),
  },
  {
    id: "3",
    name: "온실 B-1",
    location: "온실 B동 1번 구역",
    status: "offline",
    streamUrl: "/placeholder.svg?height=480&width=640&text=오프라인",
    resolution: "1920x1080",
    fps: 0,
    userId: "spinmoll",
    lastUpdate: new Date(Date.now() - 3600000), // 1시간 전
  },
]

export default function CamerasPage() {
  const { user } = useAuth()
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // 사용자별 카메라 필터링
  const userCameras = mockCameras.filter((camera) => camera.userId === user?.id)
  const onlineCameras = userCameras.filter((camera) => camera.status === "online")
  const offlineCameras = userCameras.filter((camera) => camera.status === "offline")

  // 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 첫 번째 온라인 카메라를 기본 선택
  useEffect(() => {
    if (!selectedCamera && onlineCameras.length > 0) {
      setSelectedCamera(onlineCameras[0].id)
    }
  }, [selectedCamera, onlineCameras])

  const selectedCameraData = userCameras.find((camera) => camera.id === selectedCamera)

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleRefresh = () => {
    // 스트림 새로고침 로직
    alert("카메라 스트림을 새로고침합니다.")
  }

  const formatLastUpdate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "방금 전"
    if (minutes < 60) return `${minutes}분 전`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}시간 전`
    const days = Math.floor(hours / 24)
    return `${days}일 전`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
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
            <h1 className="text-3xl font-bold text-purple-800 flex items-center gap-2">
              <Camera className="h-8 w-8" />
              실시간 카메라 모니터링
            </h1>
            <p className="text-purple-600">{user?.name}님의 등록된 카메라를 실시간으로 확인하세요</p>
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-700">{userCameras.length}</div>
              <div className="text-sm text-purple-600">총 카메라</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-700">{onlineCameras.length}</div>
              <div className="text-sm text-green-600">온라인</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-700">{offlineCameras.length}</div>
              <div className="text-sm text-red-600">오프라인</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-700">{currentTime.toLocaleTimeString("ko-KR")}</div>
              <div className="text-sm text-blue-600">현재 시간</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 스트림 영역 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    {selectedCameraData ? selectedCameraData.name : "카메라를 선택하세요"}
                  </CardTitle>
                  {selectedCameraData && (
                    <Badge variant={selectedCameraData.status === "online" ? "default" : "destructive"}>
                      {selectedCameraData.status === "online" ? "온라인" : "오프라인"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCameraData ? (
                  <>
                    {/* 비디오 스트림 영역 */}
                    <div
                      className={`relative bg-black rounded-lg overflow-hidden ${
                        isFullscreen ? "fixed inset-0 z-50" : "aspect-video"
                      }`}
                    >
                      <img
                        src={selectedCameraData.streamUrl || "/placeholder.svg"}
                        alt={`${selectedCameraData.name} 실시간 영상`}
                        className="w-full h-full object-cover"
                      />

                      {/* 스트림 오버레이 정보 */}
                      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded">
                        <div className="text-sm font-medium">{selectedCameraData.name}</div>
                        <div className="text-xs">{currentTime.toLocaleString("ko-KR")}</div>
                      </div>

                      {/* 상태 표시 */}
                      <div className="absolute top-4 right-4">
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded ${
                            selectedCameraData.status === "online" ? "bg-green-600 text-white" : "bg-red-600 text-white"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              selectedCameraData.status === "online" ? "bg-green-300" : "bg-red-300"
                            } ${selectedCameraData.status === "online" ? "animate-pulse" : ""}`}
                          ></div>
                          <span className="text-xs font-medium">
                            {selectedCameraData.status === "online" ? "LIVE" : "OFFLINE"}
                          </span>
                        </div>
                      </div>

                      {/* 컨트롤 바 */}
                      <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsPlaying(!isPlaying)}
                              className="text-white hover:bg-white/20"
                              disabled={selectedCameraData.status === "offline"}
                            >
                              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsMuted(!isMuted)}
                              className="text-white hover:bg-white/20"
                            >
                              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleRefresh}
                              className="text-white hover:bg-white/20"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-white text-xs">
                              {selectedCameraData.resolution} • {selectedCameraData.fps}fps
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleFullscreen}
                              className="text-white hover:bg-white/20"
                            >
                              <Maximize className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* 오프라인 상태 오버레이 */}
                      {selectedCameraData.status === "offline" && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-center text-white">
                            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium mb-2">카메라 오프라인</h3>
                            <p className="text-sm opacity-75">
                              마지막 연결: {formatLastUpdate(selectedCameraData.lastUpdate)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 카메라 정보 */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">위치:</span>
                        <span className="ml-2">{selectedCameraData.location}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">해상도:</span>
                        <span className="ml-2">{selectedCameraData.resolution}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">프레임률:</span>
                        <span className="ml-2">{selectedCameraData.fps}fps</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">마지막 업데이트:</span>
                        <span className="ml-2">{formatLastUpdate(selectedCameraData.lastUpdate)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Camera className="h-12 w-12 mx-auto mb-4" />
                      <p>카메라를 선택해주세요</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 카메라 목록 및 컨트롤 */}
          <div className="space-y-6">
            {/* 카메라 선택 */}
            <Card>
              <CardHeader>
                <CardTitle>카메라 선택</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                  <SelectTrigger>
                    <SelectValue placeholder="카메라를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {userCameras.map((camera) => (
                      <SelectItem key={camera.id} value={camera.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              camera.status === "online" ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></div>
                          {camera.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* 카메라 목록 */}
            <Card>
              <CardHeader>
                <CardTitle>전체 카메라 목록</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userCameras.map((camera) => (
                  <div
                    key={camera.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCamera === camera.id
                        ? "border-purple-300 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedCamera(camera.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            camera.status === "online" ? "bg-green-500" : "bg-red-500"
                          } ${camera.status === "online" ? "animate-pulse" : ""}`}
                        ></div>
                        <div>
                          <div className="font-medium text-sm">{camera.name}</div>
                          <div className="text-xs text-gray-500">{camera.location}</div>
                        </div>
                      </div>
                      <Badge variant={camera.status === "online" ? "default" : "destructive"} className="text-xs">
                        {camera.status === "online" ? "온라인" : "오프라인"}
                      </Badge>
                    </div>

                    {camera.status === "online" && (
                      <div className="mt-2 text-xs text-gray-500">
                        {camera.resolution} • {camera.fps}fps
                      </div>
                    )}

                    {camera.status === "offline" && (
                      <div className="mt-2 text-xs text-red-500">
                        마지막 연결: {formatLastUpdate(camera.lastUpdate)}
                      </div>
                    )}
                  </div>
                ))}

                {userCameras.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Camera className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">등록된 카메라가 없습니다.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 카메라 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  카메라 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Camera className="h-4 w-4 mr-2" />새 카메라 추가
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  카메라 설정
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  전체 새로고침
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
