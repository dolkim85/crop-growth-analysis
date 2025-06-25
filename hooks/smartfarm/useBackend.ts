import { useState, useEffect } from 'react'
import { API_CONFIG } from '@/utils/smartfarm/constants'

export type BackendConnectionStatus = "checking" | "connected" | "disconnected"

export const useBackend = () => {
  const [connectionStatus, setConnectionStatus] = useState<BackendConnectionStatus>("checking")

  const checkBackendConnection = async () => {
    try {
      setConnectionStatus("checking")
      
      console.log("🚀 온라인 백엔드 서버 연결 시작...")
      console.log("📡 요청 URL:", `${API_CONFIG.RAILWAY_URL}/api/v1/health`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log("⏰ 백엔드 연결 타임아웃")
        controller.abort()
      }, API_CONFIG.TIMEOUT)
      
      const response = await fetch(`${API_CONFIG.RAILWAY_URL}/api/v1/health`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit'
      })
      
      clearTimeout(timeoutId)
      
      console.log("📊 백엔드 응답 상태:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("✅ Railway 온라인 백엔드 연결 성공!", data)
        
        // 서버 상태 확인
        if (data.status === "initializing") {
          console.log("🔄 서버 초기화 중... 진행률:", data.progress + "%")
          setConnectionStatus("checking")
          
          // 5초 후 재시도
          setTimeout(() => {
            console.log("🔄 서버 초기화 완료 대기 중... 재시도")
            checkBackendConnection()
          }, 5000)
          return
        }
        
        // 온라인 서버 정보 저장
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('BACKEND_URL', API_CONFIG.RAILWAY_URL)
            localStorage.setItem('BACKEND_MODE', 'online')
            localStorage.setItem('BACKEND_STATUS', 'connected')
          } catch (storageError) {
            console.warn("온라인 서버 정보 저장 실패:", storageError)
          }
        }
        
        setConnectionStatus("connected")
        console.log("🎉 프로덕션 온라인 모드 활성화!")
        return
      } else {
        throw new Error(`Railway 서버 응답 오류: HTTP ${response.status} - ${response.statusText}`)
      }
      
    } catch (error: any) {
      console.error("❌ Railway 백엔드 연결 실패:", error)
      
      // 상세한 에러 분석
      if (error.name === 'AbortError') {
        console.log("⏰ 백엔드 연결 타임아웃 - 서버 응답 시간 초과")
      } else if (error.message?.includes('CORS')) {
        console.log("🚫 CORS 오류 - 브라우저 보안 정책 문제")
      } else if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
        console.log("🌐 네트워크 오류 - 인터넷 연결 또는 서버 문제")
      } else {
        console.log("❓ 알 수 없는 오류:", error.message)
      }
      
      console.log("💥 온라인 백엔드 서버에 연결할 수 없습니다. Railway 서버 상태를 확인하세요.")
      setConnectionStatus("disconnected")
      
      // 사용자에게 명확한 오류 메시지 표시
      if (typeof window !== 'undefined') {
        console.error("🚨 백엔드 서버 연결 실패 - 클라이언트 모드로 전환됨")
        console.log("🔄 10초 후 자동 재연결 시도...")
        
        // 10초 후 자동 재시도
        setTimeout(() => {
          console.log("🔄 백엔드 재연결 시도...")
          checkBackendConnection()
        }, API_CONFIG.RETRY_INTERVAL)
      }
    }
  }

  const sendAnalysisRequest = async (formData: FormData) => {
    if (connectionStatus !== "connected") {
      throw new Error("백엔드 서버에 연결되지 않았습니다")
    }

    console.log("📤 Railway 백엔드로 분석 요청 전송...")
    
    const response = await fetch(`${API_CONFIG.RAILWAY_URL}/api/v1/analyze`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      mode: 'cors',
      credentials: 'omit'
    })

    console.log("📊 백엔드 응답 상태:", response.status)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("📥 백엔드 응답 데이터:", data)
    
    return data
  }

  const sendFederatedAnalysisRequest = async (formData: FormData) => {
    if (connectionStatus !== "connected") {
      throw new Error("백엔드 서버에 연결되지 않았습니다")
    }

    console.log("📤 Railway 백엔드로 연합학습 분석 요청 전송...")
    
    const response = await fetch(`${API_CONFIG.RAILWAY_URL}/api/v1/federated/analyze`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      mode: 'cors',
      credentials: 'omit'
    })

    console.log("📊 백엔드 응답 상태:", response.status)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("📥 백엔드 응답 데이터:", data)
    
    return data
  }

  const sendFeedback = async (feedbackData: any) => {
    if (connectionStatus !== "connected") {
      return // 백엔드 연결이 없으면 피드백 전송 생략
    }

    try {
      await fetch(`${API_CONFIG.RAILWAY_URL}/api/v1/federated/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      })
    } catch (error) {
      console.error("피드백 전송 실패:", error)
    }
  }

  // 컴포넌트 마운트 시 백엔드 연결 확인
  useEffect(() => {
    checkBackendConnection()
  }, [])

  return {
    connectionStatus,
    checkBackendConnection,
    sendAnalysisRequest,
    sendFederatedAnalysisRequest,
    sendFeedback
  }
} 