/**
 * 애플리케이션 설정
 * 환경변수를 한 곳에서 관리합니다.
 *
 * ⚠️ 주의: 필수 환경변수는 빌드 시점에 반드시 설정되어야 합니다.
 * 기본값을 제공하지 않으므로 누락 시 에러가 발생합니다.
 */

// 필수 환경변수 검증
const getRequiredEnv = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `❌ 필수 환경변수가 설정되지 않았습니다: ${key}\n` +
      `빌드 시 다음과 같이 설정하세요:\n` +
      `${key}=your_value npm run build`
    )
  }
  return value
}

export const config = {
  // API 기본 URL (필수)
  api: {
    baseUrl: getRequiredEnv('NEXT_PUBLIC_API_URL'),
    wsUrl: getRequiredEnv('NEXT_PUBLIC_WS_URL'),
  },

  // 환경 정보
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    nodeEnv: process.env.NODE_ENV || 'production',
  },

  // 기타 설정 (선택적)
  app: {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  },
} as const

// 타입 안전성을 위한 헬퍼
export const getApiUrl = (endpoint: string) => {
  return `${config.api.baseUrl}${endpoint}`
}

export const getWsUrl = (endpoint: string) => {
  return `${config.api.wsUrl}${endpoint}`
}
