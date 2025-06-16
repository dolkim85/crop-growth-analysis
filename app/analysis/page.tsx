"use client"

import { useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"

// 기존 작물 성장 분석 컴포넌트를 import
import CropGrowthAnalysis from "../crop-growth-analysis"

export default function AnalysisPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 로그인 상태가 아니면 즉시 로그인 페이지로 리다이렉션
    if (!loading && !isAuthenticated) {
      router.replace("/login?redirect=/analysis")
    }
  }, [isAuthenticated, loading, router])

  // 로그인 상태 확인 중 로딩 화면 개선
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-600">로그인 상태 확인 중...</p>
        </div>
      </div>
    )
  }

  // 로그인되지 않은 상태에서는 아무것도 렌더링하지 않음
  if (!isAuthenticated) {
    return null
  }

  return (
    <div>
      <Navbar />
      <CropGrowthAnalysis />
    </div>
  )
}
