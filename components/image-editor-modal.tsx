"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { RotateCw, Crop, Save, X } from "lucide-react"
import { canvasToBlob, type CropArea } from "@/utils/image-editor"

interface ImageEditorModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onSave: (editedImageUrl: string, editedFile: File) => void
}

export function ImageEditorModal({ isOpen, onClose, imageUrl, onSave }: ImageEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalImageRef = useRef<HTMLImageElement>(null)
  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null)
  const [rotation, setRotation] = useState(0)
  const [isCropping, setIsCropping] = useState(false)
  const [cropArea, setCropArea] = useState<CropArea | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // 이미지를 캔버스에 그리는 함수
  const drawImageToCanvas = useCallback(
    (image: HTMLImageElement) => {
      const canvas = canvasRef.current
      if (!canvas || !image) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // 최대 표시 크기 설정
      const maxWidth = 600
      const maxHeight = 400

      let { width: imgWidth, height: imgHeight } = image

      // 회전된 경우 크기 조정
      if (rotation === 90 || rotation === 270) {
        ;[imgWidth, imgHeight] = [imgHeight, imgWidth]
      }

      // 비율을 유지하면서 최대 크기에 맞게 조정
      const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1)
      const displayWidth = imgWidth * scale
      const displayHeight = imgHeight * scale

      // 캔버스 크기 설정
      canvas.width = displayWidth
      canvas.height = displayHeight
      setCanvasSize({ width: displayWidth, height: displayHeight })

      // 캔버스 초기화
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 이미지 그리기
      if (rotation > 0) {
        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.drawImage(image, -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight)
        ctx.restore()
      } else {
        ctx.drawImage(image, 0, 0, displayWidth, displayHeight)
      }

      // 크롭 영역 표시
      if (isCropping && cropArea) {
        // 크롭 영역 외부를 어둡게
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
        ctx.fillRect(0, 0, canvas.width, cropArea.y)
        ctx.fillRect(0, cropArea.y, cropArea.x, cropArea.height)
        ctx.fillRect(
          cropArea.x + cropArea.width,
          cropArea.y,
          canvas.width - cropArea.x - cropArea.width,
          cropArea.height,
        )
        ctx.fillRect(0, cropArea.y + cropArea.height, canvas.width, canvas.height - cropArea.y - cropArea.height)

        // 크롭 영역 테두리
        ctx.strokeStyle = "#3b82f6"
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)

        // 크롭 영역 모서리 핸들
        const handleSize = 8
        ctx.fillStyle = "#3b82f6"
        ctx.setLineDash([])
        ctx.fillRect(cropArea.x - handleSize / 2, cropArea.y - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(cropArea.x + cropArea.width - handleSize / 2, cropArea.y - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(cropArea.x - handleSize / 2, cropArea.y + cropArea.height - handleSize / 2, handleSize, handleSize)
        ctx.fillRect(
          cropArea.x + cropArea.width - handleSize / 2,
          cropArea.y + cropArea.height - handleSize / 2,
          handleSize,
          handleSize,
        )
      }
    },
    [rotation, isCropping, cropArea],
  )

  // 이미지 로드
  useEffect(() => {
    if (isOpen && imageUrl) {
      const image = new Image()
      image.crossOrigin = "anonymous"
      image.onload = () => {
        originalImageRef.current = image
        setCurrentImage(image)
        setRotation(0)
        setIsCropping(false)
        setCropArea(null)
      }
      image.src = imageUrl
    }
  }, [isOpen, imageUrl])

  // 이미지 그리기
  useEffect(() => {
    if (currentImage) {
      drawImageToCanvas(currentImage)
    }
  }, [currentImage, drawImageToCanvas])

  // 회전 처리
  const handleRotate = () => {
    if (!currentImage) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const newRotation = (rotation + 90) % 360

    // 90도 또는 270도 회전 시 캔버스 크기 변경
    if (newRotation === 90 || newRotation === 270) {
      canvas.width = currentImage.height
      canvas.height = currentImage.width
    } else {
      canvas.width = currentImage.width
      canvas.height = currentImage.height
    }

    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((90 * Math.PI) / 180)
    ctx.drawImage(currentImage, -currentImage.width / 2, -currentImage.height / 2)

    const rotatedImage = new Image()
    rotatedImage.onload = () => {
      setCurrentImage(rotatedImage)
      setRotation(newRotation)
    }
    rotatedImage.src = canvas.toDataURL("image/jpeg", 0.9)
  }

  // 마우스 좌표를 캔버스 좌표로 변환
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  // 크롭 시작
  const handleCropStart = () => {
    setIsCropping(true)
    // 기본 크롭 영역 설정 (중앙에 60% 크기)
    const defaultSize = Math.min(canvasSize.width, canvasSize.height) * 0.6
    const x = (canvasSize.width - defaultSize) / 2
    const y = (canvasSize.height - defaultSize) / 2

    setCropArea({
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: Math.min(defaultSize, canvasSize.width),
      height: Math.min(defaultSize, canvasSize.height),
    })
  }

  // 마우스 이벤트 처리
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping) return

    const coords = getCanvasCoordinates(e)
    setIsDragging(true)
    setDragStart(coords)
    setCropArea({ x: coords.x, y: coords.y, width: 0, height: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping || !isDragging) return

    const coords = getCanvasCoordinates(e)

    const newCropArea = {
      x: Math.max(0, Math.min(dragStart.x, coords.x)),
      y: Math.max(0, Math.min(dragStart.y, coords.y)),
      width: Math.min(canvasSize.width - Math.min(dragStart.x, coords.x), Math.abs(coords.x - dragStart.x)),
      height: Math.min(canvasSize.height - Math.min(dragStart.y, coords.y), Math.abs(coords.y - dragStart.y)),
    }

    setCropArea(newCropArea)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 크롭 적용
  const applyCrop = () => {
    if (!cropArea || !currentImage) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 현재 표시된 이미지의 실제 크기와 캔버스 크기 비율 계산
    const scaleX = currentImage.width / canvasSize.width
    const scaleY = currentImage.height / canvasSize.height

    // 실제 이미지에서 크롭할 영역 계산
    const cropX = cropArea.x * scaleX
    const cropY = cropArea.y * scaleY
    const cropWidth = cropArea.width * scaleX
    const cropHeight = cropArea.height * scaleY

    // 크롭된 크기로 캔버스 설정
    canvas.width = cropWidth
    canvas.height = cropHeight

    // 크롭된 영역만 그리기
    ctx.drawImage(currentImage, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

    // 크롭된 이미지를 새 이미지로 설정
    const croppedImage = new Image()
    croppedImage.onload = () => {
      setCurrentImage(croppedImage)
      setIsCropping(false)
      setCropArea(null)
    }
    croppedImage.src = canvas.toDataURL("image/jpeg", 0.9)
  }

  // 저장
  const handleSave = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const blob = await canvasToBlob(canvas)
      const editedFile = new File([blob], "edited-image.jpg", { type: "image/jpeg" })
      const editedImageUrl = URL.createObjectURL(blob)

      onSave(editedImageUrl, editedFile)
      onClose()
    } catch (error) {
      console.error("Failed to save edited image:", error)
    }
  }

  // 취소
  const handleCancel = () => {
    setRotation(0)
    setIsCropping(false)
    setCropArea(null)
    setCurrentImage(originalImageRef.current)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            이미지 편집
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="flex items-center gap-2"
              disabled={isCropping}
            >
              <RotateCw className="h-4 w-4" />
              회전
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCropStart}
              disabled={isCropping}
              className="flex items-center gap-2"
            >
              <Crop className="h-4 w-4" />
              크롭
            </Button>
            {isCropping && (
              <>
                <Button variant="default" size="sm" onClick={applyCrop} className="bg-blue-600 hover:bg-blue-700">
                  크롭 적용
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCropping(false)
                    setCropArea(null)
                  }}
                >
                  크롭 취소
                </Button>
              </>
            )}
          </div>

          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-96"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ cursor: isCropping ? "crosshair" : "default" }}
            />
          </div>

          {isCropping && (
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-600">마우스를 드래그하여 크롭할 영역을 선택하세요</p>
              {cropArea && (
                <p className="text-xs text-gray-500">
                  크롭 영역: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            취소
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
