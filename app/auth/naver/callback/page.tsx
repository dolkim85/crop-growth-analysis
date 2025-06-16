"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authService } from "@/lib/auth"

export default function NaverCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      const state = searchParams.get("state")
      const error = searchParams.get("error")
      const storedState = sessionStorage.getItem("naver_state")

      if (error) {
        console.error("Naver 로그인 오류:", error)
        router.push("/login?error=naver_login_failed")
        return
      }

      if (state !== storedState) {
        console.error("Naver 로그인 state 불일치")
        router.push("/login?error=naver_login_failed")
        return
      }

      if (code) {
        try {
          const result = await authService.handleSocialCallback("naver", code, state)
          if (result.success && result.user) {
            localStorage.setItem("crop_analysis_auth", JSON.stringify(result.user))
            router.push("/analysis")
          } else {
            router.push("/login?error=naver_login_failed")
          }
        } catch (error) {
          console.error("Naver 콜백 처리 오류:", error)
          router.push("/login?error=naver_login_failed")
        }
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-green-600">Naver 로그인 처리 중...</p>
      </div>
    </div>
  )
}
