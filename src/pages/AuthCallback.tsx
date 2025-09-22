import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner, Alert } from '@/components'

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { oauth2Login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasProcessed, setHasProcessed] = useState(false) // 중복 처리 방지

  useEffect(() => {
    let isMounted = true // 컴포넌트가 마운트된 상태인지 확인
    
    const handleOAuth2Callback = async () => {
      // 이미 처리된 경우 중복 실행 방지
      if (hasProcessed) {
        return
      }
      
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // OAuth2 에러 처리
        if (error) {
          if (isMounted) {
            setError(errorDescription || 'OAuth2 인증 중 오류가 발생했습니다.')
            setHasProcessed(true)
          }
          return
        }

        // 인증 코드가 없는 경우
        if (!code) {
          if (isMounted) {
            setError('인증 코드를 받지 못했습니다.')
            setHasProcessed(true)
          }
          return
        }

        // URL에서 provider 추출 (state 파라미터 또는 referrer에서)
        const provider = state || getProviderFromReferrer()
        
        // 디버깅 정보 출력
        console.log('OAuth2 Callback Debug:', {
          code: code ? 'present' : 'missing',
          state: state,
          referrer: document.referrer,
          detectedProvider: provider
        })
        
        if (!provider || !['google', 'github'].includes(provider)) {
          if (isMounted) {
            setError(`지원하지 않는 OAuth2 제공자입니다. (state: ${state}, referrer: ${document.referrer})`)
            setHasProcessed(true)
          }
          return
        }

        // OAuth2 로그인 처리
        const redirectUri = `${window.location.origin}/auth/callback`
        await oauth2Login({
          provider: provider as 'google' | 'github',
          code,
          redirectUri
        })

        // 성공 시 처리 완료 표시 및 대시보드로 리다이렉트
        if (isMounted) {
          setHasProcessed(true)
          navigate('/dashboard', { replace: true })
        }
      } catch (error: any) {
        console.error('OAuth2 callback error:', error)
        if (isMounted) {
          // 네트워크 에러와 일반 에러를 구분하여 처리
          if (error.code === 'NETWORK_ERROR' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
            setError('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
          } else {
            setError(error.response?.data?.message || error.message || 'OAuth2 로그인에 실패했습니다.')
          }
          setHasProcessed(true)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    handleOAuth2Callback()
    
    // cleanup function
    return () => {
      isMounted = false
    }
  }, []) // 의존성 배열을 완전히 비워서 한 번만 실행

  // referrer에서 provider 추출하는 함수
  const getProviderFromReferrer = (): string | null => {
    const referrer = document.referrer.toLowerCase()
    if (referrer.includes('github.com')) return 'github'
    if (referrer.includes('google.com') || referrer.includes('accounts.google.com')) return 'google'
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg text-gray-600">인증을 처리하고 있습니다...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              K-Le-PaaS
            </h1>
            <h2 className="text-2xl font-semibold text-gray-700">
              인증 오류
            </h2>
          </div>
          
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
          
          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              로그인 페이지로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default AuthCallback
