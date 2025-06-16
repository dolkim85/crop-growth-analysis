"use client"

import { useState } from "react"
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

// 임시 데이터 (실제로는 전역 상태나 API에서 가져와야 함)
const mockAnalyses = [
  {
    id: "1",
    plantType: "tomato",
    date: "2025-04-28T10:00:00",
    userId: "spinmoll",
    result: {
      plantHealth: 97,
      growthRate: 12,
      size: 18,
      height: 28,
      leafCount: 12,
      leafSize: 6,
      condition: "양호",
      recommendations: ["수분 공급량을 10% 증가시키세요"],
    },
  },
  {
    id: "2",
    plantType: "tomato",
    date: "2025-05-15T10:00:00",
    userId: "spinmoll",
    result: {
      plantHealth: 92,
      growthRate: 10,
      size: 20,
      height: 32,
      leafCount: 14,
      leafSize: 7,
      condition: "양호",
      recommendations: ["질소 비료를 추가 공급하는 것을 권장합니다"],
    },
  },
  {
    id: "3",
    plantType: "cucumber",
    date: "2025-05-10T10:00:00",
    userId: "spinmoll",
    result: {
      plantHealth: 88,
      growthRate: 15,
      size: 22,
      height: 35,
      leafCount: 8,
      leafSize: 9,
      condition: "양호",
      recommendations: ["잎의 색상 변화를 지속적으로 모니터링하세요"],
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

export default function AnalysesPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPlantType, setSelectedPlantType] = useState("all")
  const [sortBy, setSortBy] = useState("date-desc")
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  // 사용자별 데이터 필터링
  const userAnalyses = mockAnalyses.filter((analysis) => analysis.userId === user?.id)

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
                  ? Math.round(userAnalyses.reduce((sum, a) => sum + a.result.plantHealth, 0) / userAnalyses.length)
                  : 0}
                %
              </div>
              <div className="text-sm text-blue-600">평균 건강도</div>
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
                  ? Math.round(userAnalyses.reduce((sum, a) => sum + a.result.height, 0) / userAnalyses.length)
                  : 0}
                cm
              </div>
              <div className="text-sm text-orange-600">평균 키</div>
            </CardContent>
          </Card>
        </div>

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
                <Button onClick={exportSelected} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  선택 항목 내보내기
                </Button>
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
                    <TableHead>건강도</TableHead>
                    <TableHead>키</TableHead>
                    <TableHead>잎 개수</TableHead>
                    <TableHead>성장률</TableHead>
                    <TableHead>상태</TableHead>
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
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              analysis.result.plantHealth >= 90
                                ? "bg-green-500"
                                : analysis.result.plantHealth >= 70
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          ></div>
                          <span className="font-medium">{analysis.result.plantHealth}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{analysis.result.height}cm</TableCell>
                      <TableCell>{analysis.result.leafCount}개</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          {analysis.result.growthRate}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {analysis.result.condition}
                        </Badge>
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

            {filteredAnalyses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>조건에 맞는 분석 결과가 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
