'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Camera, Image as ImageIcon, Trash2, RotateCcw, ZoomIn } from "lucide-react"
import { UploadedImage, AnalysisResult } from '@/utils/smartfarm/types'
import { useBackend } from '@/hooks/smartfarm/useBackend'

interface ImageAnalysisProps {
  onAnalysisComplete?: (results: AnalysisResult[]) => void
  maxImages?: number
  allowedFormats?: string[]
  maxFileSize?: number
}

export const ImageAnalysis: React.FC<ImageAnalysisProps> = ({
  onAnalysisComplete,
  maxImages = 10,
  allowedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 10 * 1024 * 1024 // 10MB
}) => {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  const { analyzeImages, isConnected } = useBackend()

  // 이미지 업로드 처리
  const handleImageUpload = useCallback((files: FileList | null) => {
    if (!files) return

    const newImages: UploadedImage[] = []
    
    Array.from(files).forEach((file, index) => {
      // 파일 유효성 검사
      if (!allowedFormats.includes(file.type)) {
        setError(`지원하지 않는 파일 형식입니다: ${file.name}`)
        return
      }
      
      if (file.size > maxFileSize) {
        setError(`파일 크기가 너무 큽니다: ${file.name} (최대 ${maxFileSize / 1024 / 1024}MB)`)
        return
      }

      if (images.length + newImages.length >= maxImages) {
        setError(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData: UploadedImage = {
          id: `img_${Date.now()}_${index}`,
          file,
          preview: e.target?.result as string,
          uploadedAt: new Date(),
          analyzed: false
        }
        newImages.push(imageData)
        
        if (newImages.length === Array.from(files).length) {
          setImages(prev => [...prev, ...newImages])
          setError(null)
        }
      }
      reader.readAsDataURL(file)
    })
  }, [images.length, maxImages, allowedFormats, maxFileSize])

  // 이미지 삭제
  const removeImage = useCallback((imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
    setAnalysisResults(prev => prev.filter(result => result.imageId !== imageId))
  }, [])

  // 모든 이미지 삭제
  const clearAllImages = useCallback(() => {
    setImages([])
    setAnalysisResults([])
    setSelectedImageIndex(null)
    setError(null)
  }, [])

  // 분석 실행
  const handleAnalyze = useCallback(async () => {
    if (images.length === 0) {
      setError('분석할 이미지를 먼저 업로드해주세요')
      return
    }

    if (!isConnected) {
      setError('백엔드 서버에 연결할 수 없습니다')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setError(null)

    try {
      const results = await analyzeImages(images, (progress) => {
        setAnalysisProgress(progress)
      })

      setAnalysisResults(results)
      
      // 이미지 상태 업데이트
      setImages(prev => prev.map(img => ({
        ...img,
        analyzed: true
      })))

      onAnalysisComplete?.(results)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다')
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress(0)
    }
  }, [images, isConnected, analyzeImages, onAnalysisComplete])

  // 파일 드래그 앤 드롭
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleImageUpload(e.dataTransfer.files)
  }, [handleImageUpload])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          이미지 분석
          <Badge variant="secondary" className="ml-auto">
            {images.length}/{maxImages}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 업로드 영역 */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            이미지를 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-sm text-gray-500 mb-4">
            JPEG, PNG, WebP 형식 지원 (최대 {maxFileSize / 1024 / 1024}MB)
          </p>
          <input
            type="file"
            multiple
            accept={allowedFormats.join(',')}
            onChange={(e) => handleImageUpload(e.target.files)}
            className="hidden"
            id="image-upload"
          />
          <Button asChild variant="outline">
            <label htmlFor="image-upload" className="cursor-pointer">
              <ImageIcon className="h-4 w-4 mr-2" />
              파일 선택
            </label>
          </Button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 업로드된 이미지 목록 */}
        {images.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">업로드된 이미지</h3>
              <div className="flex gap-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !isConnected}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isAnalyzing ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      분석 시작
                    </>
                  )}
                </Button>
                <Button onClick={clearAllImages} variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  전체 삭제
                </Button>
              </div>
            </div>

            {/* 분석 진행률 */}
            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>분석 진행률</span>
                  <span>{analysisProgress.toFixed(0)}%</span>
                </div>
                <Progress value={analysisProgress} className="w-full" />
              </div>
            )}

            {/* 이미지 그리드 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={image.preview}
                      alt={`업로드된 이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* 오버레이 */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* 상태 표시 */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {image.analyzed && (
                      <Badge variant="default" className="text-xs">
                        분석완료
                      </Badge>
                    )}
                  </div>

                  {/* 삭제 버튼 */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage(image.id)
                    }}
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 left-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 분석 결과 */}
        {analysisResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">분석 결과</h3>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">요약</TabsTrigger>
                <TabsTrigger value="details">상세 결과</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysisResults.map((result, index) => (
                    <Card key={result.imageId}>
                      <CardContent className="p-4">
                        <div className="text-sm font-medium mb-2">
                          이미지 {index + 1}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>건강도:</span>
                            <Badge variant={result.health === '좋음' ? 'default' : 'destructive'}>
                              {result.health}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>성장도:</span>
                            <span className="font-medium">{result.growth}</span>
                          </div>
                          <div className="text-xs text-gray-600 mt-2">
                            {result.recommend}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                {analysisResults.map((result, index) => (
                  <Card key={result.imageId}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        이미지 {index + 1} 상세 분석
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium mb-2">기본 정보</div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>건강 상태:</span>
                              <Badge variant={result.health === '좋음' ? 'default' : 'destructive'}>
                                {result.health}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>성장 상태:</span>
                              <span>{result.growth}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>분석 시간:</span>
                              <span className="text-xs text-gray-600">
                                {result.analyzedAt.toLocaleString('ko-KR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-2">권장사항</div>
                          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {result.recommend}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 