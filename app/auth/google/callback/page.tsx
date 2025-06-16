"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authService } from "@/lib/auth"
import { useAuth } from "@/components/auth-provider"

export default function GoogleCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      const error = searchParams.get("error")

      if (error) {
        console.error("Google 로그인 오류:", error)
        router.push("/login?error=google_login_failed")
        return
      }

      if (code) {
        try {
          const result = await authService.handleSocialCallback("google", code)
          if (result.success && result.user) {
            // AuthProvider의 상태 업데이트
            localStorage.setItem("crop_analysis_auth", JSON.stringify(result.user))
            router.push("/analysis")
          } else {
            router.push("/login?error=google_login_failed")
          }
        } catch (error) {
          console.error("Google 콜백 처리 오류:", error)
          router.push("/login?error=google_login_failed")
        }
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-green-600">Google 로그인 처리 중...</p>
      </div>
    </div>
  )
}
