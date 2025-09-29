"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Chrome } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"

type OAuthUrlResponse = { auth_url: string }

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      // Google OAuth2 인증 URL 가져오기
      const response = await apiClient.getOAuth2Url('google') as OAuthUrlResponse
      const authUrl = response.auth_url
      
      // 새 창에서 OAuth2 인증 페이지 열기
      const popup = window.open(authUrl, 'oauth2', 'width=500,height=600,scrollbars=yes,resizable=yes')
      
      // 팝업에서 메시지 수신 대기
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'OAUTH2_SUCCESS') {
          const { user, accessToken } = event.data
          login(user, accessToken)
          onClose()
          window.removeEventListener('message', messageListener)
        } else if (event.data.type === 'OAUTH2_ERROR') {
          console.error('OAuth2 로그인 실패:', event.data.error)
          window.removeEventListener('message', messageListener)
        }
      }
      
      window.addEventListener('message', messageListener)
      
      // 팝업이 닫혔는지 확인
                  const checkClosed = setInterval(() => {
                    try {
                      if (popup?.closed) {
                        clearInterval(checkClosed)
                        window.removeEventListener('message', messageListener)
                        setIsLoading(false)
                      }
                    } catch (error) {
                      // Cross-Origin-Opener-Policy로 인한 오류 무시
                      console.warn('Cannot check popup status:', error)
                    }
                  }, 1000)
      
    } catch (error) {
      console.error('Google 로그인 실패:', error)
      setIsLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    setIsLoading(true)
    try {
      // GitHub OAuth2 인증 URL 가져오기
      const response = await apiClient.getOAuth2Url('github') as OAuthUrlResponse
      const authUrl = response.auth_url
      
      // 새 창에서 OAuth2 인증 페이지 열기
      const popup = window.open(authUrl, 'oauth2', 'width=500,height=600,scrollbars=yes,resizable=yes')
      
      // 팝업에서 메시지 수신 대기
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'OAUTH2_SUCCESS') {
          const { user, accessToken } = event.data
          login(user, accessToken)
          onClose()
          window.removeEventListener('message', messageListener)
        } else if (event.data.type === 'OAUTH2_ERROR') {
          console.error('OAuth2 로그인 실패:', event.data.error)
          window.removeEventListener('message', messageListener)
        }
      }
      
      window.addEventListener('message', messageListener)
      
      // 팝업이 닫혔는지 확인
                  const checkClosed = setInterval(() => {
                    try {
                      if (popup?.closed) {
                        clearInterval(checkClosed)
                        window.removeEventListener('message', messageListener)
                        setIsLoading(false)
                      }
                    } catch (error) {
                      // Cross-Origin-Opener-Policy로 인한 오류 무시
                      console.warn('Cannot check popup status:', error)
                    }
                  }, 1000)
      
    } catch (error) {
      console.error('GitHub 로그인 실패:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>
            K-Le-PaaS에 로그인하여 GitHub 리포지토리를 연동하고 관리하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            <Chrome className="w-4 h-4 mr-2" />
            Google로 로그인
          </Button>
          
          <Button
            onClick={handleGitHubLogin}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            <Github className="w-4 h-4 mr-2" />
            GitHub로 로그인
          </Button>
          
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            취소
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
