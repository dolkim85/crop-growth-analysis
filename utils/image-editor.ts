export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export const rotateImage = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  rotation: number,
): void => {
  const { width, height } = image

  // 90도 또는 270도 회전 시 캔버스 크기 변경
  if (rotation === 90 || rotation === 270) {
    canvas.width = height
    canvas.height = width
  } else {
    canvas.width = width
    canvas.height = height
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()

  // 회전 중심점을 캔버스 중앙으로 설정
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((rotation * Math.PI) / 180)

  // 이미지를 중앙에 그리기
  ctx.drawImage(image, -width / 2, -height / 2, width, height)
  ctx.restore()
}

export const cropImage = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cropArea: CropArea,
): void => {
  canvas.width = cropArea.width
  canvas.height = cropArea.height

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(image, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, cropArea.width, cropArea.height)
}

export const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob!)
      },
      "image/jpeg",
      0.9,
    )
  })
}
