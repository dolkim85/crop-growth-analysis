"use client"

import { Button } from "@/components/ui/button"
import { BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'

export function AuthSection() {
  const { isAuthenticated, user } = useAuth()

  if (isAuthenticated) {
    return (
      <div className="space-y-4">
        <p className="text-lg text-green-700">
          안녕하세요, <span className="font-semibold">{user?.name}</span>님!
        </p>
        <Link href="/analysis">
          <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
            <BarChart3 className="h-5 w-5 mr-2" />
            작물 분석 시작하기
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex gap-4 justify-center">
      <Link href="/signup">
        <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
          무료로 시작하기
        </Button>
      </Link>
      <Link href="/login">
        <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-green-300 text-green-700 hover:bg-green-50">
          로그인
        </Button>
      </Link>
    </div>
  )
} 