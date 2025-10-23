"use client"

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { config } from '@/lib/config'

function CallbackInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state')
    // state는 'provider=google' 형태로 전달됨 → 'google'만 추출
    const provider = state && state.includes('provider=') ? (state.split('provider=')[1] as string) : null

    if (error) {
      // 에러가 있는 경우
      window.opener?.postMessage({
        type: 'OAUTH2_ERROR',
        error: error
      }, window.location.origin)
      window.close()
      return
    }

    if (code && provider) {
      // 성공적으로 인증 코드를 받은 경우
      handleOAuth2Callback(code, provider as 'google' | 'github')
    }
  }, [searchParams])

  const handleOAuth2Callback = async (code: string, provider: 'google' | 'github') => {
    try {
      // 브라우저에서 현재 origin 가져오기
      const origin = window.location.origin
      const redirectUri = `${origin}${config.app.basePath}/oauth2-callback`

      // 백엔드로 인증 코드 전송하여 사용자 정보 받기
      const response = await fetch(`${config.api.baseUrl}/api/v1/auth/oauth2/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          code,
          redirect_uri: redirectUri
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // 성공적으로 로그인된 경우 부모 창으로 사용자 정보 전달
        window.opener?.postMessage({
          type: 'OAUTH2_SUCCESS',
          user: data.user,
          accessToken: data.access_token
        }, window.location.origin)
      } else {
        throw new Error(data.message || '로그인 실패')
      }
      
      window.close()
    } catch (error) {
      console.error('OAuth2 콜백 처리 실패:', error)
      window.opener?.postMessage({
        type: 'OAUTH2_ERROR',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }, window.location.origin)
      window.close()
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>로그인 처리 중...</p>
      </div>
    </div>
  )
}

export default function OAuth2CallbackPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>로그인 처리 중...</p></div>}>
      <CallbackInner />
    </Suspense>
  )
}
