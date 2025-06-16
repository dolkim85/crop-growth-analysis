"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthState, authService } from '@/lib/auth'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  socialLogin: (provider: 'google' | 'kakao' | 'naver') => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 페이지 로드 시 저장된 사용자 정보 확인
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password)
    if (result.success && result.user) {
      setUser(result.user)
    }
    return { success: result.success, error: result.error }
  }

  const signup = async (email: string, password: string, name: string) => {
    const result = await authService.signup(email, password, name)
    if (result.success && result.user) {
      setUser(result.user)
    }
    return { success: result.success, error: result.error }
  }

  const socialLogin = async (provider: 'google' | 'kakao' | 'naver') => {
    const result = await authService.socialLogin(provider)
    if (result.success && result.user) {
      setUser(result.user)
    }
    return { success: result.success, error: result.error }
  }

  const logout = () => {
    authService.logout();
    setUser(null);
    // 로컬 스토리지에서 확실히 제거
    localStorage.removeItem('crop_analysis_auth');
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    socialLogin,
    logout,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
