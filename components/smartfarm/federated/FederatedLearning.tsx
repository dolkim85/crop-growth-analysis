'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Network, 
  Users, 
  Share, 
  Download, 
  Upload, 
  Activity, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react"
import { FederatedTrainingStatus, FederatedNode } from '@/utils/smartfarm/types'

interface FederatedLearningProps {
  onStatusChange?: (status: FederatedTrainingStatus) => void
  autoJoin?: boolean
  shareData?: boolean
}

export const FederatedLearning: React.FC<FederatedLearningProps> = ({
  onStatusChange,
  autoJoin = false,
  shareData = true
}) => {
  const [isParticipating, setIsParticipating] = useState(false)
  const [trainingStatus, setTrainingStatus] = useState<FederatedTrainingStatus>({
    isActive: false,
    currentRound: 0,
    totalRounds: 10,
    participants: 0,
    accuracy: 0,
    loss: 0,
    lastUpdated: new Date()
  })
  const [nodes, setNodes] = useState<FederatedNode[]>([])
  const [dataSharing, setDataSharing] = useState(shareData)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')

  // 연합학습 네트워크 연결
  const connectToNetwork = useCallback(async () => {
    setConnectionStatus('connecting')
    
    try {
      // 실제 구현에서는 백엔드 API 호출
      await new Promise(resolve => setTimeout(resolve, 2000)) // 시뮬레이션
      
      setConnectionStatus('connected')
      setIsParticipating(true)
      
      // Mock 노드 데이터
      const mockNodes: FederatedNode[] = [
        {
          id: 'node_1',
          name: '스마트팜 A',
          location: '경기도 화성시',
          status: 'active',
          contribution: 85,
          lastSeen: new Date(Date.now() - 1000 * 60 * 5), // 5분 전
          dataPoints: 1250
        },
        {
          id: 'node_2', 
          name: '스마트팜 B',
          location: '충남 논산시',
          status: 'active',
          contribution: 92,
          lastSeen: new Date(Date.now() - 1000 * 60 * 2), // 2분 전
          dataPoints: 1580
        },
        {
          id: 'node_3',
          name: '스마트팜 C',
          location: '전남 나주시',
          status: 'inactive',
          contribution: 78,
          lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
          dataPoints: 950
        }
      ]
      
      setNodes(mockNodes)
      
    } catch (error) {
      setConnectionStatus('disconnected')
      console.error('연합학습 네트워크 연결 실패:', error)
    }
  }, [])

  // 연합학습 시작
  const startTraining = useCallback(async () => {
    if (!isParticipating) return

    const newStatus: FederatedTrainingStatus = {
      isActive: true,
      currentRound: 1,
      totalRounds: 10,
      participants: nodes.filter(n => n.status === 'active').length + 1,
      accuracy: 0.65,
      loss: 0.45,
      lastUpdated: new Date()
    }
    
    setTrainingStatus(newStatus)
    onStatusChange?.(newStatus)

    // 학습 진행 시뮬레이션
    for (let round = 1; round <= 10; round++) {
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const updatedStatus: FederatedTrainingStatus = {
        ...newStatus,
        currentRound: round,
        accuracy: Math.min(0.95, 0.65 + (round * 0.03)),
        loss: Math.max(0.05, 0.45 - (round * 0.04)),
        lastUpdated: new Date()
      }
      
      setTrainingStatus(updatedStatus)
      onStatusChange?.(updatedStatus)
    }

    // 학습 완료
    const finalStatus: FederatedTrainingStatus = {
      ...newStatus,
      isActive: false,
      currentRound: 10,
      accuracy: 0.95,
      loss: 0.05,
      lastUpdated: new Date()
    }
    
    setTrainingStatus(finalStatus)
    onStatusChange?.(finalStatus)
  }, [isParticipating, nodes, onStatusChange])

  // 네트워크에서 나가기
  const leaveNetwork = useCallback(() => {
    setIsParticipating(false)
    setConnectionStatus('disconnected')
    setNodes([])
    setTrainingStatus(prev => ({
      ...prev,
      isActive: false
    }))
  }, [])

  // 자동 참여 설정
  useEffect(() => {
    if (autoJoin && connectionStatus === 'disconnected') {
      connectToNetwork()
    }
  }, [autoJoin, connectionStatus, connectToNetwork])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          연합학습 네트워크
          <Badge 
            variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
            className="ml-auto"
          >
            {connectionStatus === 'connected' ? '연결됨' : 
             connectionStatus === 'connecting' ? '연결 중...' : '연결 안됨'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 연결 상태 및 제어 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <div>
              <div className="font-medium">
                {connectionStatus === 'connected' ? '네트워크에 연결됨' :
                 connectionStatus === 'connecting' ? '연결 중...' : '네트워크 연결 안됨'}
              </div>
              <div className="text-sm text-gray-600">
                {isParticipating ? `${nodes.filter(n => n.status === 'active').length + 1}개 노드 참여 중` : '연합학습에 참여하지 않음'}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isParticipating ? (
              <Button 
                onClick={connectToNetwork}
                disabled={connectionStatus === 'connecting'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Network className="h-4 w-4 mr-2" />
                네트워크 참여
              </Button>
            ) : (
              <Button onClick={leaveNetwork} variant="outline">
                <Share className="h-4 w-4 mr-2" />
                네트워크 나가기
              </Button>
            )}
          </div>
        </div>

        {/* 데이터 공유 설정 */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-500" />
            <div>
              <Label htmlFor="data-sharing" className="font-medium">
                데이터 공유
              </Label>
              <div className="text-sm text-gray-600">
                학습 데이터를 네트워크와 안전하게 공유
              </div>
            </div>
          </div>
          <Switch
            id="data-sharing"
            checked={dataSharing}
            onCheckedChange={setDataSharing}
            disabled={!isParticipating}
          />
        </div>

        {isParticipating && (
          <Tabs defaultValue="training" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="training">학습 현황</TabsTrigger>
              <TabsTrigger value="nodes">참여 노드</TabsTrigger>
              <TabsTrigger value="history">학습 기록</TabsTrigger>
            </TabsList>

            {/* 학습 현황 */}
            <TabsContent value="training" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 학습 진행률 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      학습 진행률
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>라운드</span>
                        <span>{trainingStatus.currentRound}/{trainingStatus.totalRounds}</span>
                      </div>
                      <Progress 
                        value={(trainingStatus.currentRound / trainingStatus.totalRounds) * 100}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>참여자: {trainingStatus.participants}명</span>
                        <span>
                          {trainingStatus.isActive ? '학습 중' : '대기 중'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 모델 성능 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      모델 성능
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">정확도</span>
                        <span className="font-medium text-green-600">
                          {(trainingStatus.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">손실값</span>
                        <span className="font-medium text-red-600">
                          {trainingStatus.loss.toFixed(3)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        마지막 업데이트: {trainingStatus.lastUpdated.toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 학습 제어 */}
              <div className="flex gap-2">
                <Button
                  onClick={startTraining}
                  disabled={trainingStatus.isActive}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {trainingStatus.isActive ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-pulse" />
                      학습 진행 중...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      학습 시작
                    </>
                  )}
                </Button>
                
                <Button variant="outline" disabled={!trainingStatus.isActive}>
                  <Download className="h-4 w-4 mr-2" />
                  모델 다운로드
                </Button>
              </div>
            </TabsContent>

            {/* 참여 노드 */}
            <TabsContent value="nodes" className="space-y-4">
              <div className="grid gap-4">
                {nodes.map(node => (
                  <Card key={node.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${
                            node.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <div className="font-medium">{node.name}</div>
                            <div className="text-sm text-gray-600">{node.location}</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            기여도: {node.contribution}%
                          </div>
                          <div className="text-xs text-gray-600">
                            데이터: {node.dataPoints.toLocaleString()}개
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          마지막 접속: {node.lastSeen.toLocaleString('ko-KR')}
                        </span>
                        <Badge variant={node.status === 'active' ? 'default' : 'secondary'}>
                          {node.status === 'active' ? '활성' : '비활성'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* 학습 기록 */}
            <TabsContent value="history" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  연합학습 기록은 개인정보 보호를 위해 암호화되어 저장됩니다.
                  학습 성능 지표만 공유되며, 실제 데이터는 각 노드에서 안전하게 관리됩니다.
                </AlertDescription>
              </Alert>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">최근 학습 세션</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">세션 #1</div>
                        <div className="text-sm text-gray-600">
                          2024-12-25 14:30 - 15:45 (1시간 15분)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">완료</div>
                        <div className="text-xs text-gray-600">정확도: 94.2%</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">세션 #2</div>
                        <div className="text-sm text-gray-600">
                          2024-12-24 09:15 - 10:30 (1시간 15분)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">완료</div>
                        <div className="text-xs text-gray-600">정확도: 91.8%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
} 