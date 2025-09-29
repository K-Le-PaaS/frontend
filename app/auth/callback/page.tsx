"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api"

function CallbackInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      
      // state에서 provider 정보 추출
      const provider = state?.includes('provider=') 
        ? state.split('provider=')[1] 
        : null

      if (code && provider) {
        try {
          // 백엔드 API를 호출하여 토큰 교환 및 사용자 정보 가져오기
          const redirectUri = 'http://localhost:3000/auth/callback'
          type OAuthResponse = { success: boolean; user?: any; access_token?: string; message?: string }
          const response = await apiClient.loginWithOAuth2(
            provider as 'google' | 'github',
            code,
            redirectUri
          ) as OAuthResponse

          if (response && response.success === true) {
            // 부모 창으로 사용자 정보와 JWT 토큰 전달
            window.opener.postMessage({
              type: 'OAUTH2_SUCCESS',
              user: response.user,
              accessToken: response.access_token
            }, window.location.origin)
            window.close()
          } else {
            window.opener.postMessage({
              type: 'OAUTH2_ERROR',
              error: response.message || 'OAuth2 login failed'
            }, window.location.origin)
            window.close()
          }
        } catch (error) {
          console.error('OAuth2 callback error:', error)
          window.opener.postMessage({
            type: 'OAUTH2_ERROR',
            error: (error as Error).message || 'OAuth2 callback failed'
          }, window.location.origin)
          window.close()
        }
      } else {
        window.opener.postMessage({
          type: 'OAUTH2_ERROR',
          error: 'Missing code or provider in OAuth2 callback'
        }, window.location.origin)
        window.close()
      }
    }

    handleOAuthCallback()
  }, [searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <p>로그인 처리 중...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-100"><p>로그인 처리 중...</p></div>}>
      <CallbackInner />
    </Suspense>
  )
}
