# K-Le-PaaS Frontend - 전체 아키텍처 문서

> **목적**: K-Le-PaaS Frontend 시스템의 전체 아키텍처, 디렉토리 구조, 핵심 컴포넌트, 데이터 흐름을 포괄적으로 설명하는 문서

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [기술 스택](#기술-스택)
3. [전체 아키텍처](#전체-아키텍처)
4. [디렉토리 구조](#디렉토리-구조)
5. [핵심 컴포넌트](#핵심-컴포넌트)
6. [상태 관리](#상태-관리)
7. [데이터 흐름](#데이터-흐름)
8. [라우팅 및 네비게이션](#라우팅-및-네비게이션)
9. [스타일링 및 UI](#스타일링-및-ui)
10. [인증 및 보안](#인증-및-보안)

---

## 🎯 시스템 개요

### 프로젝트 설명
K-Le-PaaS Frontend는 **AI 기반 Kubernetes PaaS 플랫폼**의 사용자 인터페이스입니다.

### 핵심 특징
- **Next.js 15 기반**: App Router + Server Components
- **React 19**: 최신 React 기능 활용
- **TypeScript**: 타입 안전성
- **shadcn/ui**: Radix UI 기반 컴포넌트 라이브러리
- **Tailwind CSS 4**: 유틸리티 우선 스타일링
- **WebSocket 실시간 통신**: 배포 상태 실시간 모니터링
- **OAuth2 인증**: GitHub, Google 소셜 로그인

### 주요 기능
1. **대시보드**: 전체 클러스터 상태 한눈에 보기
2. **자연어 명령**: "nginx 재시작해줘" → K8s 명령 실행
3. **실시간 배포 모니터링**: WebSocket 기반 실시간 업데이트
4. **GitHub 통합**: 저장소 연결 및 워크플로우 트리거
5. **Slack 연동**: 알림 채널 설정
6. **프로메테우스 메트릭 시각화**: Recharts 기반 실시간 그래프

---

## 🛠 기술 스택

### 프레임워크
- **Next.js 15.2.4**: React 프레임워크 (App Router)
- **React 19**: UI 라이브러리
- **TypeScript 5**: 정적 타입 체크

### UI 라이브러리
- **shadcn/ui**: 재사용 가능한 컴포넌트 (61개 컴포넌트)
- **Radix UI**: 접근성 우선 Headless UI (25개 패키지)
- **Lucide React**: 아이콘 라이브러리
- **Tailwind CSS 4.1.9**: 유틸리티 우선 CSS
- **tailwindcss-animate**: 애니메이션 유틸리티

### 데이터 시각화
- **Recharts**: 선언적 차트 라이브러리
- **React Day Picker 9.8.0**: 날짜 선택기

### 폼 및 검증
- **React Hook Form 7.60.0**: 폼 상태 관리
- **Zod 3.25.67**: 스키마 검증
- **@hookform/resolvers**: Zod 통합

### 상태 관리
- **React Context API**: 전역 상태 (Auth)
- **Custom Hooks**: 재사용 가능한 로직

### 통신
- **Fetch API**: REST API 호출
- **WebSocket**: 실시간 이벤트 (배포 모니터링)
- **Server-Sent Events (SSE)**: 실시간 스트리밍 (선택사항)

### 빌드 및 배포
- **Docker**: 컨테이너화 (standalone output)
- **Nginx**: 리버스 프록시 (프로덕션)
- **Vercel Analytics**: 사용자 분석

---

## 🏗 전체 아키텍처

### 레이어 구조
```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│  (Browser - React Components)                                │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │  Hooks   │  │ Contexts │   │
│  │ (App Dir)│  │ (61개)   │  │  (3개)   │  │  (Auth)  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  API Client  │  │  WebSocket   │  │  Local       │      │
│  │  (REST)      │  │  Manager     │  │  Storage     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    Backend Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ K-Le-PaaS    │  │  WebSocket   │  │   OAuth2     │      │
│  │   API        │  │   Server     │  │  Providers   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 컴포넌트 계층 구조
```
App (layout.tsx)
├── Theme Provider (Dark/Light)
├── Auth Provider (전역 인증 상태)
└── Page (app/page.tsx)
    ├── Sidebar (네비게이션)
    ├── Header (사용자 정보, 알림)
    └── Main Content (동적 뷰)
        ├── Dashboard Overview
        ├── Natural Language Command
        ├── Deployment Status Monitoring
        ├── GitHub Integration Panel
        └── Real-Time Monitoring Dashboard
```

---

## 📂 디렉토리 구조

### 전체 구조
```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 루트 레이아웃 (Theme, Auth Provider)
│   ├── page.tsx                  # 메인 페이지 (대시보드)
│   ├── auth/                     # 인증 관련 페이지
│   │   └── callback/
│   │       └── page.tsx          # GitHub OAuth 콜백
│   └── oauth2-callback/
│       └── page.tsx              # Google OAuth 콜백
│
├── components/                   # React 컴포넌트 (61개)
│   ├── dashboard-overview.tsx   # 대시보드 메인
│   ├── natural-language-command.tsx  # NLP 명령 입력
│   ├── deployment-status-monitoring.tsx  # 배포 상태
│   ├── github-integration-panel.tsx  # GitHub 연동
│   ├── real-time-monitoring-dashboard.tsx  # 실시간 모니터링
│   ├── realtime-deployment-monitor.tsx  # 배포 실시간 추적
│   ├── deployment-progress.tsx  # 배포 진행률
│   ├── header.tsx               # 헤더 (사용자, 알림)
│   ├── sidebar.tsx              # 사이드바 네비게이션
│   ├── login-modal.tsx          # 로그인 모달
│   ├── slack-connected-notifier.tsx  # Slack 연동 알림
│   ├── theme-provider.tsx       # 테마 관리
│   │
│   └── ui/                      # shadcn/ui 컴포넌트 (48개)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── toast.tsx
│       ├── chart.tsx            # Recharts 래퍼
│       └── ...
│
├── hooks/                        # Custom React Hooks
│   ├── use-global-websocket.ts  # WebSocket 전역 관리
│   ├── use-toast.ts             # Toast 알림
│   └── use-mobile.ts            # 모바일 감지
│
├── contexts/                     # React Context
│   └── auth-context.tsx         # 인증 상태 관리
│
├── lib/                          # 유틸리티 라이브러리
│   ├── api.ts                   # API 클라이언트 (REST)
│   └── utils.ts                 # 유틸 함수 (cn 등)
│
├── styles/                       # 글로벌 스타일
│   └── globals.css              # Tailwind 기본 설정
│
├── docs/                         # 문서
│   ├── FRONTEND_ARCHITECTURE.md # 이 문서
│   └── README.md                # 문서 인덱스
│
├── public/                       # 정적 파일
│
├── next.config.mjs               # Next.js 설정
├── tailwind.config.js            # Tailwind 설정
├── tsconfig.json                 # TypeScript 설정
├── components.json               # shadcn/ui 설정
├── package.json                  # 의존성
├── Dockerfile                    # Docker 이미지
└── .env.local                    # 환경 변수 (로컬)
```

---

## 🔧 핵심 컴포넌트

### 1. **메인 페이지 (`app/page.tsx`)**

**역할**: 애플리케이션의 메인 진입점

**주요 기능**:
- 뷰 전환 로직 (Dashboard, Commands, Deployments, GitHub, Monitoring)
- Slack 연동 완료 토스트 표시
- AuthProvider 래핑

**코드 구조**:
```tsx
export default function HomePage() {
  const [activeView, setActiveView] = useState("dashboard")

  const renderContent = () => {
    switch (activeView) {
      case "commands": return <NaturalLanguageCommand />
      case "deployments": return <DeploymentStatusMonitoring />
      case "github": return <GitHubIntegrationPanel />
      case "monitoring": return <RealTimeMonitoringDashboard />
      default: return <DashboardOverview />
    }
  }

  return (
    <AuthProvider>
      <div className="flex h-screen">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <div className="flex-1">
          <Header />
          <main>{renderContent()}</main>
        </div>
      </div>
    </AuthProvider>
  )
}
```

**코드 위치**: `frontend/app/page.tsx`

---

### 2. **대시보드 개요 (`components/dashboard-overview.tsx`)**

**역할**: 전체 클러스터 상태 요약

**표시 정보**:
- Deployment 개수
- Running Pods 개수
- Service 개수
- Ingress 개수
- 최근 배포 이력
- 리소스 사용률 그래프

**데이터 소스**:
- API: `GET /api/v1/dashboard/overview`
- WebSocket: 실시간 업데이트

**UI 컴포넌트**:
- `Card` - 요약 카드
- `Chart` - Recharts 기반 그래프
- `Badge` - 상태 뱃지

---

### 3. **자연어 명령 (`components/natural-language-command.tsx`)**

**역할**: 자연어로 Kubernetes 명령 실행

**사용 예시**:
- "nginx 재시작해줘"
- "전체 상황 보여줘"
- "로그 50줄 보여줘"

**처리 흐름**:
```
사용자 입력
    ↓
텍스트 입력 필드
    ↓
API 호출: POST /api/v1/nlp/process
    → { command: "nginx 재시작해줘" }
    ↓
백엔드 NLP 처리
    → Gemini API 파싱
    → Kubernetes 실행
    ↓
결과 표시
    → 성공/실패 메시지
    → 실행 내역 표시
```

**UI 컴포넌트**:
- `Input` - 명령 입력
- `Button` - 실행 버튼
- `Card` - 결과 표시
- `ScrollArea` - 명령 이력

---

### 4. **배포 상태 모니터링 (`components/deployment-status-monitoring.tsx`)**

**역할**: 모든 배포 상태 실시간 추적

**표시 정보**:
- 배포 이름
- 네임스페이스
- Replica 상태 (Ready/Desired)
- 이미지 태그
- 생성 시간
- 상태 (Running, Pending, Failed)

**실시간 업데이트**:
- WebSocket 연결: `/ws/deployments`
- 이벤트: `ADDED`, `MODIFIED`, `DELETED`

**UI 컴포넌트**:
- `Table` - 배포 목록
- `Badge` - 상태 표시
- `Progress` - 진행률

---

### 5. **GitHub 통합 패널 (`components/github-integration-panel.tsx`)**

**역할**: GitHub 저장소 연결 및 워크플로우 관리

**주요 기능**:
1. **저장소 연결**: OAuth 인증 후 저장소 목록 조회
2. **워크플로우 트리거**: 수동 배포 실행
3. **최근 워크플로우 실행 이력**: 성공/실패 상태

**API 엔드포인트**:
- `GET /api/v1/projects/integrations` - 연결된 저장소
- `POST /api/v1/github/workflows/trigger` - 워크플로우 실행

**UI 컴포넌트**:
- `Select` - 저장소 선택
- `Button` - 워크플로우 트리거
- `List` - 실행 이력

---

### 6. **실시간 모니터링 대시보드 (`components/real-time-monitoring-dashboard.tsx`)**

**역할**: Prometheus 메트릭 실시간 시각화

**표시 메트릭**:
- CPU 사용률
- 메모리 사용률
- 네트워크 I/O
- 디스크 사용률

**데이터 소스**:
- API: `POST /api/v1/monitoring/query`
- PromQL 쿼리

**차트 타입**:
- Line Chart - 시계열 데이터
- Area Chart - 누적 데이터
- Bar Chart - 비교 데이터

**라이브러리**: Recharts

---

### 7. **API 클라이언트 (`lib/api.ts`)**

**역할**: 백엔드 REST API 통신

**주요 메서드**:

#### 인증
```typescript
loginWithOAuth2(provider: 'google' | 'github', code: string)
verifyToken()
logout()
```

#### 대시보드
```typescript
getDashboardData()
getDeployments()
getClusters()
```

#### NLP
```typescript
sendNLPCommand(command: string)
```

#### GitHub
```typescript
getProjectIntegrations()
triggerWorkflow(repoId: string, workflow: string)
```

#### Slack
```typescript
getSlackAuthUrl()
getSlackStatus()
```

#### 모니터링
```typescript
queryPrometheus(query: string)
```

**인증 처리**:
```typescript
// 자동으로 Authorization 헤더 추가
const token = localStorage.getItem('auth_token')
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
```

---

### 8. **WebSocket 관리 (`hooks/use-global-websocket.ts`)**

**역할**: 전역 WebSocket 연결 관리

**연결 URL**:
- 배포 모니터링: `/ws/deployments`
- 특정 배포: `/ws/deployments/<deployment-id>`

**사용 예시**:
```typescript
const { data, error, isConnected } = useGlobalWebSocket('/ws/deployments')

useEffect(() => {
  if (data) {
    console.log('New deployment event:', data)
    // 상태 업데이트
  }
}, [data])
```

**재연결 로직**:
- 자동 재연결 (5초 간격)
- 지수 백오프 (최대 30초)
- 연결 상태 추적

---

## 🔄 상태 관리

### 1. **React Context API**

#### Auth Context (`contexts/auth-context.tsx`)
```typescript
interface AuthContextType {
  user: User | null
  login: (provider: 'google' | 'github') => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 토큰 검증 및 사용자 정보 로드
    verifyToken()
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**사용처**:
- 로그인/로그아웃 상태
- 사용자 정보
- 보호된 라우트

---

### 2. **Local State (useState)**

**컴포넌트별 상태**:
- 폼 입력값
- 모달 열림/닫힘
- 로딩 상태
- 에러 상태

**예시**:
```typescript
const [deployments, setDeployments] = useState<Deployment[]>([])
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

---

### 3. **Local Storage**

**저장 데이터**:
- `auth_token` - JWT 토큰
- `user` - 사용자 정보 (JSON)
- `theme` - 테마 설정 (dark/light)

**보안 고려사항**:
- XSS 공격 방지: DOMPurify 사용 (필요 시)
- CSRF 방지: SameSite 쿠키 (백엔드)

---

## 📡 데이터 흐름

### 1. **REST API 호출 흐름**

```
컴포넌트
    ↓
API 클라이언트 (lib/api.ts)
    → 인증 토큰 자동 추가
    → fetch() 호출
    ↓
Next.js Rewrites (next.config.mjs)
    → /api/* → http://localhost:8000/api/*
    → /mcp/* → http://localhost:8000/mcp/*
    ↓
K-Le-PaaS Backend API
    → FastAPI 엔드포인트
    → 비즈니스 로직 실행
    → Kubernetes API 호출
    ↓
응답 반환
    → JSON 데이터
    ↓
컴포넌트 상태 업데이트
    → setState()
    → 리렌더링
```

---

### 2. **WebSocket 실시간 통신 흐름**

```
컴포넌트 마운트
    ↓
useGlobalWebSocket Hook
    → WebSocket 연결 생성
    → ws://localhost:8000/ws/deployments
    ↓
백엔드 WebSocket 서버
    → Kubernetes Watch API
    → 이벤트 감지 (ADDED, MODIFIED, DELETED)
    ↓
이벤트 브로드캐스트
    → JSON 메시지 전송
    ↓
useGlobalWebSocket Hook
    → onMessage 핸들러
    → data 상태 업데이트
    ↓
컴포넌트 리렌더링
    → 실시간 UI 업데이트
```

---

### 3. **OAuth2 인증 흐름**

```
사용자 "Login with GitHub" 클릭
    ↓
프론트엔드: OAuth2 URL 요청
    → GET /api/v1/auth/oauth2/url/github
    → redirect_uri: http://localhost:3000/console/oauth2-callback
    ↓
백엔드: GitHub OAuth URL 생성
    → https://github.com/login/oauth/authorize?client_id=...
    ↓
브라우저 리다이렉트 → GitHub 로그인 페이지
    ↓
사용자 GitHub 승인
    ↓
GitHub 콜백
    → http://localhost:3000/console/oauth2-callback?code=<auth-code>
    ↓
프론트엔드: Authorization Code 교환
    → POST /api/v1/auth/oauth2/login
    → { provider: "github", code: "<auth-code>", redirect_uri: "..." }
    ↓
백엔드: Access Token 획득
    → POST https://github.com/login/oauth/access_token
    → 사용자 정보 조회: GET https://api.github.com/user
    → JWT 토큰 생성 (선택사항)
    ↓
프론트엔드: 토큰 저장
    → localStorage.setItem('auth_token', token)
    → AuthContext 업데이트
    ↓
대시보드 리다이렉트
```

---

## 🗺 라우팅 및 네비게이션

### Next.js App Router

**라우트 구조**:
```
/console                      # 메인 페이지 (app/page.tsx)
/console/auth/callback        # GitHub OAuth 콜백
/console/oauth2-callback      # Google OAuth 콜백
```

**basePath 설정**:
```javascript
// next.config.mjs
basePath: '/console',
assetPrefix: '/console',
```

**네비게이션**:
- **Client-Side**: `useState` 기반 뷰 전환 (SPA 느낌)
- **Page 전환**: Next.js `<Link>` (필요 시)

---

## 🎨 스타일링 및 UI

### Tailwind CSS 4

**설정 파일**: `tailwind.config.js`

**커스텀 테마**:
```javascript
theme: {
  extend: {
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      primary: 'hsl(var(--primary))',
      // ... shadcn/ui 색상 시스템
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
  },
}
```

**다크 모드**:
```tsx
// components/theme-provider.tsx
<ThemeProvider attribute="class" defaultTheme="system">
  {children}
</ThemeProvider>
```

**유틸리티 사용**:
```tsx
<div className="flex items-center justify-between p-4 border-b">
  <h1 className="text-2xl font-bold">Dashboard</h1>
</div>
```

---

### shadcn/ui 컴포넌트

**설치된 컴포넌트 (48개)**:
- `Button`, `Card`, `Dialog`, `Input`, `Select`
- `Table`, `Toast`, `Tooltip`, `Dropdown Menu`
- `Chart` (Recharts 래퍼)
- `Calendar`, `Date Picker`
- `Accordion`, `Tabs`, `Carousel`
- `Badge`, `Avatar`, `Alert`
- `Progress`, `Slider`, `Switch`
- `Popover`, `Context Menu`, `Navigation Menu`

**재사용 패턴**:
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Deployments</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="outline" size="sm">Deploy</Button>
  </CardContent>
</Card>
```

---

## 🔒 인증 및 보안

### 1. **OAuth2 인증**

**지원 프로바이더**:
- GitHub
- Google

**토큰 저장**:
- `localStorage.auth_token` - JWT (또는 Access Token)

**자동 인증 헤더 추가**:
```typescript
// lib/api.ts
const token = localStorage.getItem('auth_token')
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
```

---

### 2. **보호된 라우트**

**AuthContext 사용**:
```tsx
const { isAuthenticated, isLoading } = useAuth()

if (isLoading) return <LoadingSpinner />
if (!isAuthenticated) return <LoginModal />

return <Dashboard />
```

---

### 3. **CORS 및 Proxy**

**Next.js Rewrites**:
```javascript
// next.config.mjs
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*',
    },
  ]
}
```

**장점**:
- CORS 문제 해결
- 백엔드 URL 숨김
- 동일 출처 정책 우회

---

### 4. **XSS 방지**

**React 자동 이스케이프**:
- JSX는 기본적으로 XSS 방지
- `dangerouslySetInnerHTML` 사용 금지 (또는 DOMPurify)

---

## 📊 성능 최적화

### 1. **Next.js 최적화**

#### Server Components
```tsx
// 기본적으로 Server Component (app/ 디렉토리)
export default function DashboardPage() {
  // 서버에서 렌더링
  return <Dashboard />
}
```

#### Client Components (필요 시)
```tsx
'use client'  // 명시적 선언
import { useState } from 'react'
```

---

### 2. **이미지 최적화**

**Next.js Image**:
```tsx
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority  // LCP 최적화
/>
```

**지원 형식**: AVIF, WebP

---

### 3. **코드 스플리팅**

**동적 Import**:
```tsx
import dynamic from 'next/dynamic'

const MonitoringDashboard = dynamic(
  () => import('@/components/real-time-monitoring-dashboard'),
  { loading: () => <LoadingSpinner /> }
)
```

---

### 4. **메모이제이션**

**React.memo**:
```tsx
export const ExpensiveComponent = React.memo(({ data }) => {
  // 복잡한 렌더링 로직
})
```

**useMemo**:
```tsx
const filteredDeployments = useMemo(
  () => deployments.filter(d => d.status === 'Running'),
  [deployments]
)
```

---

## 📚 관련 문서

### 백엔드 연동
- [Backend Architecture](../../backend-hybrid/docs/architecture/BACKEND_ARCHITECTURE.md) - 백엔드 시스템 전체
- [NLP API](../../backend-hybrid/docs/architecture/nlp/implementation.md) - 자연어 명령 API

### 환경 설정
- [환경 변수 설정](../../backend-hybrid/docs/ENVIRONMENT_AND_CONFIG.md) - 백엔드 환경 설정

### 프로젝트 문서
- [프로젝트 README](../README.md) - 프로젝트 소개

---

## 🔄 업데이트 이력

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| 1.0.0 | 2025-10-20 | 초기 프론트엔드 아키텍처 문서 작성 |

---

**작성자**: Frontend Team
**최종 수정**: 2025-10-20
**다음 리뷰**: 2025-11-20

> **💡 참고**: 이 문서는 시스템 변경사항이 있을 때마다 업데이트됩니다. 새로운 컴포넌트나 아키텍처 변경 시 반드시 문서를 업데이트해주세요!
