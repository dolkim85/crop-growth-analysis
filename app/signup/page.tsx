"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Leaf, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signup, socialLogin } = useAuth()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.')
      return false
    }
    if (!formData.email.trim()) {
      setError('이메일을 입력해주세요.')
      return false
    }
    if (formData.password.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다.')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return false
    }
    if (!agreedToTerms) {
      setError('이용약관에 동의해주세요.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setLoading(true)

    const result = await signup(formData.email, formData.password, formData.name)
    
    if (result.success) {
      router.push('/analysis')
    } else {
      setError(result.error || '회원가입에 실패했습니다.')
    }
    
    setLoading(false)
  }

  const handleSocialLogin = async (provider: 'google' | 'kakao' | 'naver') => {
    setLoading(true)
    setError('')

    const result = await socialLogin(provider)
    
    if (result.success) {
      router.push('/analysis')
    } else {
      setError(result.error || '소셜 로그인에 실패했습니다.')
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
            <CardTitle className="text-2xl font-bold text-green-800">회원가입</CardTitle>
            <p className="text-gray-600">새 계정을 만들어 작물 분석을 시작하세요</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={formData.email}
                    onChange={handleInputChange}
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={handleInputChange}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  <Link href="#" className="text-green-600 hover:text-green-700">이용약관</Link> 및{' '}
                  <Link href="#" className="text-green-600 hover:text-green-700">개인정보처리방침</Link>에 동의합니다
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? '가입 중...' : '회원가입'}
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
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    G
                  </div>
                  Google로 가입하기
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin('kakao')}
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-black text-xs font-bold">
                    K
                  </div>
                  카카오톡으로 가입하기
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin('naver')}
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    N
                  </div>
                  네이버로 가입하기
                </div>
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                로그인
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
