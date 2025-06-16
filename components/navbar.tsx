"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Leaf, User, LogOut, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { LogoutModal } from "@/components/logout-modal"
// 관리자 표시를 위한 Badge import 추가
import { Badge } from "@/components/ui/badge"

export function Navbar() {
  const { user, isAuthenticated } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  return (
    <nav className="bg-white shadow-sm border-b border-green-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-green-800">스마트팜 분석</span>
          </Link>

          {/* 메뉴 */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* 작물 성장 분석 링크 */}
                <Link href="/analysis">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    작물 성장 분석
                  </Button>
                </Link>

                {/* 사용자 프로필 드롭다운 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gray-200">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-sm text-gray-700">{user?.name || "사용자"}</span>
                        {user?.role === "admin" && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                            관리자
                          </Badge>
                        )}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {user?.role === "admin" && (
                      <>
                        <DropdownMenuItem className="cursor-pointer">
                          <User className="h-4 w-4 mr-2" />
                          관리자 패널
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <User className="h-4 w-4 mr-2" />
                          사용자 관리
                        </DropdownMenuItem>
                        <div className="border-t my-1"></div>
                      </>
                    )}
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      프로필 설정
                    </DropdownMenuItem>
                    <div className="border-t my-1"></div>
                    <DropdownMenuItem
                      onClick={() => setShowLogoutModal(true)}
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* 로그아웃 모달 */}
                <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
                {isAuthenticated && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </Button>
                )}
              </>
            ) : (
              <>
                {/* 비로그인 사용자 메뉴 */}
                <Link href="/login">
                  <Button variant="ghost">로그인</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-green-600 hover:bg-green-700">회원가입</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
