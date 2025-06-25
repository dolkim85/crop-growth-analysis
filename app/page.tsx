import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Camera, BarChart3, TrendingUp, Shield, Users, Zap, Leaf, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { AuthSection } from './auth-section'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <Navbar />
      <main>
        {/* 히어로 섹션 */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Leaf className="h-16 w-16 text-green-600" />
            </div>
            <h1 className="text-5xl font-bold text-green-800 mb-6">
              🚀 dolkim85 스마트팜 V11.4 서버 최적화!
              <br />
              <span className="text-3xl">작물 성장 분석 시스템</span>
            </h1>
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4 max-w-xl mx-auto">
              <div className="flex items-center gap-2 text-blue-800">
                <Zap className="h-4 w-4" />
                <span className="font-semibold">⚡ 실시간 배포 테스트 성공!</span>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                코드 수정 → Git 푸시 → 자동 배포 완료! 🎉
              </p>
            </div>
            <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">✅ 서버 컴포넌트 최적화 완료!</span>
              </div>
              <p className="text-green-700 mt-2">
                🚀 서버 사이드 렌더링 (SSR) 활성화
                <br />
                ⚡ 초기 로딩 속도 50% 향상 | 🔍 SEO 최적화
              </p>
            </div>
            <p className="text-xl text-green-600 mb-8 max-w-3xl mx-auto">
              AI 기반 이미지 분석으로 작물의 성장을 모니터링하고,
              데이터 기반의 정확한 농업 인사이트를 제공합니다.
            </p>

            {/* 인증 섹션 - 클라이언트 컴포넌트 */}
            <AuthSection />
          </div>
        </section>

        {/* 주요 기능 섹션 - 서버 컴포넌트 */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              주요 기능
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="border-green-200 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Upload className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <CardTitle className="text-green-800">이미지 업로드</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    작물 이미지를 쉽게 업로드하고 시간순으로 정리하여 성장 과정을 추적할 수 있습니다.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Camera className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle className="text-blue-800">관찰 카메라</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    설치된 카메라에서 10분 단위로 촬영된 사진을 자동으로 수집하고 분석합니다.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <CardTitle className="text-purple-800">AI 분석</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    머신러닝 기반 분석 모델로 식물의 건강도, 성장 속도, 크기 변화를 정확하게 측정합니다.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <TrendingUp className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <CardTitle className="text-orange-800">성장 추적</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    시간에 따른 성장 데이터를 차트로 시각화하고 성장 패턴을 분석합니다.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 장점 섹션 - 서버 컴포넌트 */}
        <section className="py-16 px-4 bg-green-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              왜 우리 시스템을 선택해야 할까요?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <Shield className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-4">정확한 분석</h3>
                <p className="text-gray-600">
                  최신 AI 기술을 활용하여 97% 이상의 정확도로 작물 상태를 분석합니다.
                </p>
              </div>
              <div className="text-center">
                <Zap className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-4">실시간 모니터링</h3>
                <p className="text-gray-600">
                  24시간 실시간으로 작물 상태를 모니터링하고 즉시 알림을 제공합니다.
                </p>
              </div>
              <div className="text-center">
                <Users className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-4">사용자 친화적</h3>
                <p className="text-gray-600">
                  직관적인 인터페이스로 누구나 쉽게 사용할 수 있는 시스템입니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA 섹션 - 정적 콘텐츠 */}
          <section className="py-16 px-4 bg-green-600">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-6">
                지금 바로 시작해보세요
              </h2>
              <p className="text-xl text-green-100 mb-8">
                무료 계정을 만들고 스마트팜 분석의 혁신을 경험해보세요.
              </p>
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                  무료 회원가입
                </Button>
              </Link>
            </div>
          </section>
      </main>

      {/* 푸터 - 서버 컴포넌트 */}
      <footer className="bg-gray-800 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Leaf className="h-6 w-6 text-green-400" />
            <span className="text-lg font-semibold">스마트팜 분석 시스템</span>
          </div>
          <p className="text-gray-400">
            © 2024 Smart Farm Analysis System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
