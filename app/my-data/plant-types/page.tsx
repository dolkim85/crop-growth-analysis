"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Leaf, TrendingUp, BarChart3, Calendar, Target } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { GrowthChart } from "@/components/growth-chart"

// 임시 데이터
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
    },
  },
  {
    id: "4",
    plantType: "lettuce",
    date: "2025-05-20T10:00:00",
    userId: "spinmoll",
    result: {
      plantHealth: 94,
      growthRate: 8,
      size: 15,
      height: 12,
      leafCount: 18,
      leafSize: 4,
      condition: "양호",
    },
  },
]

const plantTypes = [
  { id: "tomato", name: "토마토", color: "#ef4444" },
  { id: "lettuce", name: "상추", color: "#22c55e" },
  { id: "cucumber", name: "오이", color: "#3b82f6" },
  { id: "pepper", name: "고추", color: "#f59e0b" },
  { id: "strawberry", name: "딸기", color: "#ec4899" },
  { id: "spinach", name: "시금치", color: "#10b981" },
]

export default function PlantTypesPage() {
  const { user } = useAuth()
  const [selectedPlantType, setSelectedPlantType] = useState<string>("all")

  // 사용자별 데이터 필터링
  const userAnalyses = mockAnalyses.filter((analysis) => analysis.userId === user?.id)

  // 식물 종류별 통계 계산
  const getPlantTypeStats = (plantTypeId: string) => {
    const data = userAnalyses.filter((analysis) => analysis.plantType === plantTypeId)
    if (data.length === 0) return null

    const avgHealth = data.reduce((sum, item) => sum + item.result.plantHealth, 0) / data.length
    const avgHeight = data.reduce((sum, item) => sum + item.result.height, 0) / data.length
    const avgGrowthRate = data.reduce((sum, item) => sum + item.result.growthRate, 0) / data.length
    const latest = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

    return {
      count: data.length,
      avgHealth: Math.round(avgHealth),
      avgHeight: Math.round(avgHeight),
      avgGrowthRate: Math.round(avgGrowthRate),
      latestDate: new Date(latest.date).toLocaleDateString("ko-KR"),
      latestHealth: latest.result.plantHealth,
      trend:
        data.length > 1
          ? latest.result.plantHealth > data[data.length - 2].result.plantHealth
            ? "up"
            : "down"
          : "stable",
    }
  }

  // 전체 식물 종류별 데이터
  const plantTypeData = plantTypes
    .map((plant) => ({
      ...plant,
      stats: getPlantTypeStats(plant.id),
    }))
    .filter((plant) => plant.stats !== null)
    .sort((a, b) => (b.stats?.count || 0) - (a.stats?.count || 0))

  // 선택된 식물의 차트 데이터
  const getChartData = (plantTypeId: string) => {
    return userAnalyses
      .filter((analysis) => analysis.plantType === plantTypeId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((analysis) => ({
        date: new Date(analysis.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
        height: analysis.result.height,
        leafCount: analysis.result.leafCount,
        health: analysis.result.plantHealth,
        leafSize: analysis.result.leafSize,
        growthRate: analysis.result.growthRate,
      }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
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
            <h1 className="text-3xl font-bold text-orange-800 flex items-center gap-2">
              <Leaf className="h-8 w-8" />
              식물 종류별 분석 데이터
            </h1>
            <p className="text-orange-600">{user?.name}님이 분석한 식물들의 종류별 성장 데이터를 확인하세요</p>
          </div>
        </div>

        {/* 전체 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-700">{plantTypeData.length}</div>
              <div className="text-sm text-orange-600">분석한 식물 종류</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-700">{userAnalyses.length}</div>
              <div className="text-sm text-green-600">총 분석 횟수</div>
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
              <div className="text-sm text-blue-600">전체 평균 건강도</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-700">
                {plantTypeData.length > 0 ? plantTypeData[0].name : "-"}
              </div>
              <div className="text-sm text-purple-600">가장 많이 분석한 식물</div>
            </CardContent>
          </Card>
        </div>

        {/* 식물 종류별 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plantTypeData.map((plant) => (
            <Card
              key={plant.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedPlantType(plant.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: plant.color }}></div>
                    {plant.name}
                  </CardTitle>
                  <Badge variant="outline" style={{ borderColor: plant.color, color: plant.color }}>
                    {plant.stats?.count}건
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold text-green-700">{plant.stats?.avgHealth}%</div>
                    <div className="text-green-600 text-xs">평균 건강도</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-bold text-blue-700">{plant.stats?.avgHeight}cm</div>
                    <div className="text-blue-600 text-xs">평균 키</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">최근 분석:</span>
                  <span className="font-medium">{plant.stats?.latestDate}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">성장률:</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp
                      className={`h-3 w-3 ${
                        plant.stats?.trend === "up"
                          ? "text-green-500"
                          : plant.stats?.trend === "down"
                            ? "text-red-500"
                            : "text-gray-500"
                      }`}
                    />
                    <span className="font-medium">{plant.stats?.avgGrowthRate}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">최근 건강도:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        (plant.stats?.latestHealth || 0) >= 90
                          ? "bg-green-500"
                          : (plant.stats?.latestHealth || 0) >= 70
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    ></div>
                    <span className="font-medium">{plant.stats?.latestHealth}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {plantTypeData.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Leaf className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">아직 분석된 식물 데이터가 없습니다.</p>
            </CardContent>
          </Card>
        )}

        {/* 상세 분석 */}
        {selectedPlantType && selectedPlantType !== "all" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {plantTypes.find((p) => p.id === selectedPlantType)?.name} 상세 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="charts" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="charts">성장 차트</TabsTrigger>
                  <TabsTrigger value="table">데이터 표</TabsTrigger>
                  <TabsTrigger value="summary">요약 정보</TabsTrigger>
                </TabsList>

                <TabsContent value="charts" className="space-y-4">
                  {(() => {
                    const chartData = getChartData(selectedPlantType)
                    const plant = plantTypes.find((p) => p.id === selectedPlantType)

                    return chartData.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GrowthChart
                          data={chartData}
                          type="line"
                          dataKey="height"
                          title="키 성장 추이"
                          color={plant?.color || "#10b981"}
                          yAxisLabel="키 (cm)"
                        />
                        <GrowthChart
                          data={chartData}
                          type="line"
                          dataKey="health"
                          title="건강도 변화"
                          color="#ef4444"
                          yAxisLabel="건강도 (%)"
                        />
                        <GrowthChart
                          data={chartData}
                          type="bar"
                          dataKey="leafCount"
                          title="잎 개수 변화"
                          color="#3b82f6"
                          yAxisLabel="잎 개수"
                        />
                        <GrowthChart
                          data={chartData}
                          type="line"
                          dataKey="growthRate"
                          title="성장률 추이"
                          color="#f59e0b"
                          yAxisLabel="성장률 (%)"
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>차트를 표시할 데이터가 부족합니다.</p>
                      </div>
                    )
                  })()}
                </TabsContent>

                <TabsContent value="table" className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>날짜</TableHead>
                          <TableHead>건강도</TableHead>
                          <TableHead>키 (cm)</TableHead>
                          <TableHead>잎 개수</TableHead>
                          <TableHead>잎 크기 (cm)</TableHead>
                          <TableHead>성장률 (%)</TableHead>
                          <TableHead>상태</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userAnalyses
                          .filter((analysis) => analysis.plantType === selectedPlantType)
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((analysis) => (
                            <TableRow key={analysis.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  {new Date(analysis.date).toLocaleDateString("ko-KR")}
                                </div>
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
                                  {analysis.result.plantHealth}%
                                </div>
                              </TableCell>
                              <TableCell>{analysis.result.height}</TableCell>
                              <TableCell>{analysis.result.leafCount}</TableCell>
                              <TableCell>{analysis.result.leafSize}</TableCell>
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
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="summary" className="space-y-4">
                  {(() => {
                    const stats = getPlantTypeStats(selectedPlantType)
                    const plant = plantTypes.find((p) => p.id === selectedPlantType)

                    return stats ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Target className="h-5 w-5" />
                              기본 정보
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">식물 종류:</span>
                              <span className="font-medium">{plant?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">총 분석 횟수:</span>
                              <span className="font-medium">{stats.count}회</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">최근 분석일:</span>
                              <span className="font-medium">{stats.latestDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">분석 기간:</span>
                              <span className="font-medium">
                                {(() => {
                                  const analyses = userAnalyses.filter((a) => a.plantType === selectedPlantType)
                                  if (analyses.length < 2) return "1일"
                                  const earliest = new Date(
                                    Math.min(...analyses.map((a) => new Date(a.date).getTime())),
                                  )
                                  const latest = new Date(Math.max(...analyses.map((a) => new Date(a.date).getTime())))
                                  const days = Math.ceil(
                                    (latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24),
                                  )
                                  return `${days}일`
                                })()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BarChart3 className="h-5 w-5" />
                              성장 통계
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">평균 건강도:</span>
                              <span className="font-medium text-green-600">{stats.avgHealth}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">평균 키:</span>
                              <span className="font-medium text-blue-600">{stats.avgHeight}cm</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">평균 성장률:</span>
                              <span className="font-medium text-orange-600">{stats.avgGrowthRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">최근 건강도:</span>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    stats.latestHealth >= 90
                                      ? "bg-green-500"
                                      : stats.latestHealth >= 70
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                  }`}
                                ></div>
                                <span className="font-medium">{stats.latestHealth}%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>통계 정보를 표시할 데이터가 없습니다.</p>
                      </div>
                    )
                  })()}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
