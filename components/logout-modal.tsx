"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LogOut } from "lucide-react"
import { useAuth } from "./auth-provider"
import { useRouter } from "next/navigation"

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const { logout, user } = useAuth()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = () => {
    setIsLoggingOut(true)

    // 로그아웃 처리
    logout()

    // 약간의 지연 후 홈페이지로 리다이렉션 (UX 개선)
    setTimeout(() => {
      router.push("/")
      setIsLoggingOut(false)
      onClose()
    }, 500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-red-600" />
            로그아웃
          </DialogTitle>
          <DialogDescription className="text-left">
            <div className="space-y-2">
              <span>정말 로그아웃 하시겠습니까?</span>
              {user && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{user.name}</span>
                    {user.role === "admin" && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">관리자</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 block">{user.email}</span>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoggingOut}>
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2"
          >
            {isLoggingOut ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                로그아웃 중...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                로그아웃
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
