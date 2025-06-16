// 실제 소셜 로그인 API 연동을 위한 서비스
export interface SocialAuthConfig {
  google: {
    clientId: string
    redirectUri: string
  }
  kakao: {
    clientId: string
    redirectUri: string
  }
  naver: {
    clientId: string
    redirectUri: string
  }
}

// 환경변수에서 설정값 가져오기 (실제 배포시에는 환경변수 설정 필요)
const getConfig = (): SocialAuthConfig => {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
  
  return {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "your-google-client-id",
      redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || `${origin}/auth/google/callback`,
    },
    kakao: {
      clientId: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || "your-kakao-client-id",
      redirectUri: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || `${origin}/auth/kakao/callback`,
    },
    naver: {
      clientId: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || "your-naver-client-id",
      redirectUri: process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI || `${origin}/auth/naver/callback`,
    },
  }
}

export const socialAuthService = {
  // Google OAuth 로그인
  loginWithGoogle: () => {
    if (typeof window === "undefined") return
    
    const config = getConfig()
    const googleAuthUrl =
      `https://accounts.google.com/oauth/authorize?` +
      `client_id=${config.google.clientId}&` +
      `redirect_uri=${encodeURIComponent(config.google.redirectUri)}&` +
      `response_type=code&` +
      `scope=openid email profile&` +
      `access_type=offline`

    window.location.href = googleAuthUrl
  },

  // Kakao OAuth 로그인
  loginWithKakao: () => {
    if (typeof window === "undefined") return
    
    const config = getConfig()
    // Kakao SDK 초기화 및 로그인
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(config.kakao.clientId)
      }

      window.Kakao.Auth.authorize({
        redirectUri: config.kakao.redirectUri,
        scope: "profile_nickname,profile_image,account_email",
      })
    } else {
      // Kakao SDK가 로드되지 않은 경우 직접 URL로 이동
      const kakaoAuthUrl =
        `https://kauth.kakao.com/oauth/authorize?` +
        `client_id=${config.kakao.clientId}&` +
        `redirect_uri=${encodeURIComponent(config.kakao.redirectUri)}&` +
        `response_type=code&` +
        `scope=profile_nickname,profile_image,account_email`

      window.location.href = kakaoAuthUrl
    }
  },

  // Naver OAuth 로그인
  loginWithNaver: () => {
    if (typeof window === "undefined") return
    
    const config = getConfig()
    const state = Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem("naver_state", state)

    const naverAuthUrl =
      `https://nid.naver.com/oauth2.0/authorize?` +
      `client_id=${config.naver.clientId}&` +
      `redirect_uri=${encodeURIComponent(config.naver.redirectUri)}&` +
      `response_type=code&` +
      `state=${state}&` +
      `scope=name,email,profile_image`

    window.location.href = naverAuthUrl
  },
}

// 타입 확장 (Kakao SDK)
declare global {
  interface Window {
    Kakao: any
  }
}
