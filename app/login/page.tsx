"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Leaf, Mail, Lock, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { login, socialLogin, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect") || "/analysis"

  // 이미 로그인된 경우 리다이렉션
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectPath)
    }
  }, [isAuthenticated, router, redirectPath])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await login(email, password)

    if (result.success) {
      router.push(redirectPath)
    } else {
      setError(result.error || "로그인에 실패했습니다.")
    }

    setLoading(false)
  }

  const handleSocialLogin = async (provider: "google" | "kakao" | "naver") => {
    setLoading(true)
    setError("")

    const result = await socialLogin(provider)

    if (result.success) {
      router.push(redirectPath)
    } else {
      setError(result.error || "소셜 로그인에 실패했습니다.")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <Navbar />

      <div className="flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Leaf className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">로그인</CardTitle>
            <p className="text-gray-600">계정에 로그인하여 작물 분석을 시작하세요</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일 또는 아이디</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="이메일 또는 아이디를 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-2 text-sm text-gray-500">또는</span>
              </div>
            </div>

            {/* 소셜 로그인 */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin("google")}
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    G
                  </div>
                  Google로 로그인
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin("kakao")}
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-black text-xs font-bold">
                    K
                  </div>
                  카카오톡으로 로그인
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin("naver")}
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    N
                  </div>
                  네이버로 로그인
                </div>
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="text-green-600 hover:text-green-700 font-medium">
                회원가입
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
