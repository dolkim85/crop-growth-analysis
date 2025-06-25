'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  FileText, 
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { AnalysisResult, EnvironmentData, UploadedImage } from '@/utils/smartfarm/types'
import { STORAGE_KEYS } from '@/utils/smartfarm/constants'

interface DataManagementProps {
  analysisResults?: AnalysisResult[]
  environmentData?: EnvironmentData[]
  uploadedImages?: UploadedImage[]
  onDataImported?: (data: any) => void
}

export const DataManagement: React.FC<DataManagementProps> = ({
  analysisResults = [],
  environmentData = [],
  uploadedImages = [],
  onDataImported
}) => {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [storageUsage, setStorageUsage] = useState({
    used: 0,
    total: 0,
    percentage: 0
  })

  // 로컬 스토리지에 데이터 저장
  const saveData = useCallback(async () => {
    try {
      const data = {
        analysisResults,
        environmentData,
        uploadedImages: uploadedImages.map(img => ({
          ...img,
          file: null, // File 객체는 직렬화할 수 없음
          preview: img.preview // base64 문자열만 저장
        })),
        savedAt: new Date().toISOString()
      }

      localStorage.setItem(STORAGE_KEYS.ANALYSIS_RESULTS, JSON.stringify(data.analysisResults))
      localStorage.setItem(STORAGE_KEYS.ENVIRONMENT_DATA, JSON.stringify(data.environmentData))
      localStorage.setItem(STORAGE_KEYS.UPLOADED_IMAGES, JSON.stringify(data.uploadedImages))
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED, data.savedAt)

      setLastSaved(new Date())
      
      // 스토리지 사용량 계산
      const totalSize = JSON.stringify(data).length
      setStorageUsage({
        used: totalSize,
        total: 5 * 1024 * 1024, // 5MB 가정
        percentage: Math.min((totalSize / (5 * 1024 * 1024)) * 100, 100)
      })

    } catch (error) {
      console.error('데이터 저장 실패:', error)
    }
  }, [analysisResults, environmentData, uploadedImages])

  // 로컬 스토리지에서 데이터 불러오기
  const loadData = useCallback(() => {
    try {
      const savedAnalysisResults = localStorage.getItem(STORAGE_KEYS.ANALYSIS_RESULTS)
      const savedEnvironmentData = localStorage.getItem(STORAGE_KEYS.ENVIRONMENT_DATA)
      const savedUploadedImages = localStorage.getItem(STORAGE_KEYS.UPLOADED_IMAGES)
      const savedAt = localStorage.getItem(STORAGE_KEYS.LAST_SAVED)

      const data = {
        analysisResults: savedAnalysisResults ? JSON.parse(savedAnalysisResults) : [],
        environmentData: savedEnvironmentData ? JSON.parse(savedEnvironmentData) : [],
        uploadedImages: savedUploadedImages ? JSON.parse(savedUploadedImages) : [],
        savedAt: savedAt ? new Date(savedAt) : null
      }

      if (data.savedAt) {
        setLastSaved(data.savedAt)
      }

      onDataImported?.(data)
      
    } catch (error) {
      console.error('데이터 불러오기 실패:', error)
    }
  }, [onDataImported])

  // JSON 파일로 내보내기
  const exportData = useCallback(async () => {
    setIsExporting(true)
    
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: {
          analysisResults,
          environmentData,
          uploadedImages: uploadedImages.map(img => ({
            id: img.id,
            preview: img.preview,
            uploadedAt: img.uploadedAt,
            analyzed: img.analyzed
          }))
        },
        metadata: {
          totalAnalyses: analysisResults.length,
          totalEnvironmentRecords: environmentData.length,
          totalImages: uploadedImages.length
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `smartfarm_data_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('데이터 내보내기 실패:', error)
    } finally {
      setIsExporting(false)
    }
  }, [analysisResults, environmentData, uploadedImages])

  // JSON 파일에서 가져오기
  const importData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        
        if (importedData.data) {
          onDataImported?.(importedData.data)
        }
        
      } catch (error) {
        console.error('데이터 가져오기 실패:', error)
      } finally {
        setIsImporting(false)
      }
    }
    
    reader.readAsText(file)
  }, [onDataImported])

  // 모든 데이터 삭제
  const clearAllData = useCallback(() => {
    if (confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      localStorage.removeItem(STORAGE_KEYS.ANALYSIS_RESULTS)
      localStorage.removeItem(STORAGE_KEYS.ENVIRONMENT_DATA)
      localStorage.removeItem(STORAGE_KEYS.UPLOADED_IMAGES)
      localStorage.removeItem(STORAGE_KEYS.LAST_SAVED)
      
      setLastSaved(null)
      setStorageUsage({ used: 0, total: 0, percentage: 0 })
      
      onDataImported?.({
        analysisResults: [],
        environmentData: [],
        uploadedImages: []
      })
    }
  }, [onDataImported])

  // CSV 형식으로 분석 결과 내보내기
  const exportAnalysisCSV = useCallback(() => {
    if (analysisResults.length === 0) return

    const csvHeaders = ['이미지ID', '건강상태', '성장상태', '권장사항', '분석시간']
    const csvRows = analysisResults.map(result => [
      result.imageId,
      result.health,
      result.growth,
      result.recommend,
      result.analyzedAt.toLocaleString('ko-KR')
    ])

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `분석결과_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [analysisResults])

  // 환경 데이터 CSV 내보내기
  const exportEnvironmentCSV = useCallback(() => {
    if (environmentData.length === 0) return

    const csvHeaders = [
      '시간', '내부온도', '외부온도', '내부습도', '근권온도', 
      '일사량', '용존산소', 'pH', 'EC'
    ]
    const csvRows = environmentData.map(data => [
      data.timestamp.toLocaleString('ko-KR'),
      data.innerTemperature,
      data.outerTemperature,
      data.innerHumidity,
      data.rootZoneTemperature,
      data.solarRadiation,
      data.dissolvedOxygen,
      data.ph,
      data.ec
    ])

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `환경데이터_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [environmentData])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          데이터 관리
          {lastSaved && (
            <Badge variant="secondary" className="ml-auto text-xs">
              마지막 저장: {lastSaved.toLocaleString('ko-KR')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 데이터 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analysisResults.length}
              </div>
              <div className="text-sm text-gray-600">분석 결과</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {environmentData.length}
              </div>
              <div className="text-sm text-gray-600">환경 데이터</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {uploadedImages.length}
              </div>
              <div className="text-sm text-gray-600">업로드된 이미지</div>
            </CardContent>
          </Card>
        </div>

        {/* 스토리지 사용량 */}
        {storageUsage.used > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              스토리지 사용량: {(storageUsage.used / 1024).toFixed(1)}KB / {(storageUsage.total / 1024 / 1024).toFixed(1)}MB 
              ({storageUsage.percentage.toFixed(1)}%)
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="save-load" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="save-load">저장/불러오기</TabsTrigger>
            <TabsTrigger value="export">내보내기</TabsTrigger>
            <TabsTrigger value="import">가져오기</TabsTrigger>
          </TabsList>

          {/* 저장/불러오기 */}
          <TabsContent value="save-load" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={saveData} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                로컬 저장
              </Button>
              
              <Button onClick={loadData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                로컬 불러오기
              </Button>
            </div>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                데이터는 브라우저의 로컬 스토리지에 안전하게 저장됩니다.
                브라우저를 종료해도 데이터가 유지됩니다.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* 내보내기 */}
          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={exportData} 
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    내보내는 중...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    JSON 내보내기
                  </>
                )}
              </Button>
              
              <Button 
                onClick={exportAnalysisCSV}
                disabled={analysisResults.length === 0}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                분석결과 CSV
              </Button>
            </div>
            
            <Button 
              onClick={exportEnvironmentCSV}
              disabled={environmentData.length === 0}
              variant="outline"
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              환경데이터 CSV
            </Button>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                JSON 파일은 모든 데이터를 포함하며, CSV 파일은 표 형태로 특정 데이터만 포함합니다.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* 가져오기 */}
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  disabled={isImporting}
                  className="hidden"
                  id="import-file"
                />
                <Button asChild variant="outline" className="w-full">
                  <label htmlFor="import-file" className="cursor-pointer">
                    {isImporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        가져오는 중...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        JSON 파일 가져오기
                      </>
                    )}
                  </label>
                </Button>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  이전에 내보낸 JSON 파일만 가져올 수 있습니다.
                  가져오기 시 기존 데이터는 덮어씌워집니다.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>

        {/* 데이터 삭제 */}
        <div className="pt-4 border-t">
          <Button 
            onClick={clearAllData}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            모든 데이터 삭제
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 