import { socialAuthService } from "./social-auth"

export interface User {
  id: string
  email: string
  name: string
  provider: "email" | "google" | "kakao" | "naver"
  avatar?: string
  role?: "admin" | "user" // 역할 추가
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

// 모의 사용자 데이터베이스
const mockUsers: User[] = [
  {
    id: "admin_spinmoll",
    email: "spinmoll@admin.com",
    name: "spinmoll (관리자)",
    provider: "email",
    avatar: "/placeholder.svg?height=40&width=40&text=Admin",
    role: "admin", // 관리자 역할 추가
  },
]

// 로컬 스토리지 키
const AUTH_STORAGE_KEY = "crop_analysis_auth"

export const authService = {
  // 로그인
  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 1000)) // 로딩 시뮬레이션

    // 관리자 계정 확인 (아이디: spinmoll, 비밀번호: 1234)
    if (email === "spinmoll" && password === "1234") {
      const adminUser = mockUsers[0] // 관리자 계정
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser))
      return { success: true, user: adminUser }
    }

    // 일반 사용자 확인
    const user = mockUsers.find((u) => u.email === email)
    if (user && password) {
      // 일반 사용자는 비밀번호 검증 (실제로는 해시 비교)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      return { success: true, user }
    }

    return { success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." }
  },

  // 회원가입
  signup: async (
    email: string,
    password: string,
    name: string,
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 이미 존재하는 사용자 확인
    if (mockUsers.some((u) => u.email === email)) {
      return { success: false, error: "이미 존재하는 이메일입니다." }
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      provider: "email",
      role: "user", // 일반 사용자 역할
    }

    mockUsers.push(newUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
    return { success: true, user: newUser }
  },

  // 소셜 로그인 - 실제 API 연동
  socialLogin: async (
    provider: "google" | "kakao" | "naver",
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      // 실제 소셜 로그인 API 호출
      switch (provider) {
        case "google":
          socialAuthService.loginWithGoogle()
          break
        case "kakao":
          socialAuthService.loginWithKakao()
          break
        case "naver":
          socialAuthService.loginWithNaver()
          break
      }

      // 리다이렉션이 발생하므로 여기서는 성공으로 반환
      return { success: true }
    } catch (error) {
      console.error(`${provider} 로그인 오류:`, error)
      return { success: false, error: `${provider} 로그인에 실패했습니다.` }
    }
  },

  // 소셜 로그인 콜백 처리
  handleSocialCallback: async (
    provider: string,
    code: string,
    state?: string,
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      // 실제로는 백엔드 API를 호출하여 토큰 교환 및 사용자 정보 획득
      // 여기서는 모의 응답으로 처리
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const socialUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: `user@${provider}.com`,
        name: `${provider} 사용자`,
        provider: provider as "google" | "kakao" | "naver",
        avatar: `/placeholder.svg?height=40&width=40&text=${provider.charAt(0).toUpperCase()}`,
      }

      mockUsers.push(socialUser)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(socialUser))
      return { success: true, user: socialUser }
    } catch (error) {
      console.error("소셜 로그인 콜백 처리 오류:", error)
      return { success: false, error: "소셜 로그인 처리 중 오류가 발생했습니다." }
    }
  },

  // 로그아웃
  logout: () => {
    // 로컬 스토리지와 세션 스토리지 모두 정리
    localStorage.removeItem(AUTH_STORAGE_KEY)
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    // 소셜 로그인 관련 세션도 정리
    sessionStorage.removeItem("naver_state")

    // 페이지 새로고침으로 완전한 로그아웃 보장
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  },

  // 현재 사용자 가져오기
  getCurrentUser: (): User | null => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  },
}
