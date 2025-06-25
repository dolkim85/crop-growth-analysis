/**
 * 🌱 스마트팜 백엔드 연결 훅
 * Vercel 서버리스 API 연동
 */

import { useState, useCallback } from 'react'

// Vercel 서버리스 API URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://crop-growth-analysis-j02bu0gsn-guendolkim-6814s-projects.vercel.app/api'
  : '/api'

export interface BackendStatus {
  isConnected: boolean
  isLoading: boolean
  error: string | null
  lastChecked: Date | null
  version: string
  platform: string
}

export function useBackend() {
  const [status, setStatus] = useState<BackendStatus>({
    isConnected: false,
    isLoading: false,
    error: null,
    lastChecked: null,
    version: '',
    platform: 'Vercel Serverless'
  })

  // 헬스체크
  const checkHealth = useCallback(async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      
      if (response.ok && data.status === 'success') {
        setStatus({
          isConnected: true,
          isLoading: false,
          error: null,
          lastChecked: new Date(),
          version: data.version || '2.0.0-vercel',
          platform: data.platform || 'Vercel Serverless'
        })
        return true
      } else {
        throw new Error(data.message || '헬스체크 실패')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '연결 실패'
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: errorMessage,
        lastChecked: new Date()
      }))
      return false
    }
  }, [])

  // 이미지 분석 요청
  const analyzeImages = useCallback(async (images: File[]) => {
    if (!status.isConnected) {
      throw new Error('백엔드 서버에 연결되지 않았습니다')
    }

    try {
      const formData = new FormData()
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image)
      })

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (response.ok && data.status === 'success') {
        return data.data
      } else {
        throw new Error(data.message || '분석 실패')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '분석 중 오류 발생'
      throw new Error(errorMessage)
    }
  }, [status.isConnected])

  return {
    status,
    checkHealth,
    analyzeImages
  }
} 