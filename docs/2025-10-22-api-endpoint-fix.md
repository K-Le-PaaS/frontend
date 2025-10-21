# API 엔드포인트 하드코딩 및 경로 수정 보고서

**날짜**: 2025년 10월 22일
**작성자**: Claude Code
**문제**: 프론트엔드 빌드 시 환경변수가 제대로 주입되지 않아 API 요청 실패

---

## 목차

1. [문제 상황](#문제-상황)
2. [원인 분석](#원인-분석)
3. [해결 과정](#해결-과정)
4. [최종 해결책](#최종-해결책)
5. [수정된 파일 목록](#수정된-파일-목록)
6. [검증 결과](#검증-결과)
7. [교훈 및 향후 개선사항](#교훈-및-향후-개선사항)

---

## 문제 상황

### 초기 증상

프론트엔드를 빌드하고 배포했을 때 다음과 같은 404 에러가 발생:

```javascript
Failed to load command history: Error: HTTP error! status: 404 - {"detail":"Not Found"}
POST https://klepaas.com/api/v1/nlp/process 404 (Not Found)
GET https://klepaas.com/api/v1/nlp/history?limit=20&offset=0&t=1761061407647 404 (Not Found)
```

### 사용자 요구사항

- 환경변수 `NEXT_PUBLIC_API_URL=https://klepaas.com/api`가 빌드 시 제대로 주입되지 않음
- 로컬 개발 환경의 `localhost` 값이 프로덕션 빌드에 들어가는 문제
- 빠른 해결을 위해 하드코딩으로 우선 처리 요청

---

## 원인 분석

### 1. 환경변수 주입 문제

Next.js의 빌드 시점 환경변수(`NEXT_PUBLIC_*`) 처리 방식:

- **문제점**: 환경변수가 빌드 타임에 정적으로 번들에 포함되어야 함
- **현상**: 빌드 시 환경변수가 설정되지 않아 기본값(`localhost:8000`)이 사용됨

```typescript
// 기존 코드
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

### 2. Nginx 리버스 프록시 구조 파악 오류

초기에는 백엔드 구조를 잘못 이해:

**잘못된 가정**:
```
https://klepaas.com/api/v1/... → 백엔드로 직접 연결
```

**실제 구조**:
```
https://klepaas.com/              → Next.js 프론트엔드
https://klepaas.com/api/          → FastAPI 백엔드 (리버스 프록시)
https://klepaas.com/api/api/v1/... → 실제 백엔드 API 엔드포인트
```

### 3. 엔드포인트 경로 불일치

프론트엔드 코드에서 사용하는 엔드포인트 패턴이 혼재:

- `/api/v1/...` (대부분의 엔드포인트)
- `/api/...` (일부 레거시 auth 엔드포인트)
- `/mcp/...` (MCP 관련)

백엔드(`backend-hybrid/app/main.py`)를 확인한 결과:
- **모든 API 라우터가 `prefix="/api/v1"`로 통일**되어 있음
- MCP는 prefix 없이 `/mcp/...` 경로로 직접 마운트

---

## 해결 과정

### 1단계: 초기 하드코딩 시도 (실패)

**시도한 수정**:
```typescript
// frontend/lib/api.ts
const API_BASE_URL = 'https://klepaas.com/api'
```

**문제**:
- 이렇게 하면 엔드포인트가 `/api/v1/...`로 시작하므로
- 최종 URL: `https://klepaas.com/api/api/v1/...` ← 중복!

**오해**: API_BASE_URL에 `/api`를 넣으면 안 될 것 같다고 착각

### 2단계: BASE_URL 수정 시도 (여전히 실패)

**시도한 수정**:
```typescript
const API_BASE_URL = 'https://klepaas.com'
```

**문제**:
- 엔드포인트: `https://klepaas.com/api/v1/...`
- 하지만 실제 백엔드는 `https://klepaas.com/api/`에 마운트되어 있음
- 여전히 404 에러 발생

### 3단계: Nginx 구조 확인

실제 서버 응답을 테스트:

```bash
# 루트 접근 → 프론트엔드 HTML 반환
curl -s https://klepaas.com/ | head -20
# 결과: Next.js 페이지

# /api 접근 → 백엔드 JSON 반환
curl -s https://klepaas.com/api/
# 결과: {"name":"K-Le-PaaS Backend Hybrid","version":"0.1.0",...}

# 실제 엔드포인트 테스트
curl -s https://klepaas.com/api/api/v1/nlp/suggestions
# 결과: ["nginx pod 상태 확인해줘", ...]  ← 성공!
```

**핵심 발견**:
- Nginx가 `/api/*` 경로를 FastAPI 백엔드로 프록시
- FastAPI는 `/api/v1/...` 구조로 라우터 등록
- 따라서 최종 경로는 `/api` + `/api/v1/...` = `/api/api/v1/...`

### 4단계: 엔드포인트 통일

프론트엔드 코드에서 일부 엔드포인트가 `/api/auth/...` 형태로 되어 있었음:

```typescript
// 잘못된 엔드포인트들
'/api/auth/login'       // ❌ 백엔드에 없음
'/api/deployments'      // ❌ 백엔드에 없음
'/api/clusters'         // ❌ 백엔드에 없음
```

백엔드(`main.py`) 확인 결과 모든 라우터가 `/api/v1` prefix로 등록:

```python
app.include_router(system_router, prefix="/api/v1", tags=["system"])
app.include_router(dashboard_router, prefix="/api/v1", tags=["dashboard"])
app.include_router(deployments_router, prefix="/api/v1", tags=["deployments"])
app.include_router(nlp_router, prefix="/api/v1", tags=["nlp"])
# ... (모든 라우터가 /api/v1 prefix)
```

**수정**: 모든 엔드포인트를 `/api/v1/...` 형태로 통일

---

## 최종 해결책

### 하드코딩된 값

#### 1. `frontend/lib/api.ts`
```typescript
// Before
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// After (하드코딩)
const API_BASE_URL = 'https://klepaas.com/api'
```

#### 2. `frontend/app/oauth2-callback/page.tsx`
```typescript
// Before
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/oauth2/login`, {

// After (하드코딩)
const response = await fetch(`https://klepaas.com/api/v1/auth/oauth2/login`, {
```

#### 3. `frontend/hooks/use-global-websocket.ts`
```typescript
// Before
const base = (typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_WS_URL == null || process.env.NEXT_PUBLIC_WS_URL === ''))
  ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
  : (process.env.NEXT_PUBLIC_WS_URL as string)

// After (하드코딩)
const base = 'wss://klepaas.com/api'
```

### 엔드포인트 통일

모든 API 호출을 `/api/v1/...` 패턴으로 수정:

```typescript
// Auth endpoints
'/api/v1/auth/login'           // ✅
'/api/v1/auth/register'        // ✅
'/api/v1/auth/logout'          // ✅
'/api/v1/auth/me'              // ✅
'/api/v1/auth/oauth2/login'    // ✅

// Dashboard
'/api/v1/dashboard/overview'   // ✅
'/api/v1/deployments'          // ✅
'/api/v1/clusters'             // ✅

// NLP
'/api/v1/nlp/process'          // ✅
'/api/v1/nlp/history'          // ✅
'/api/v1/nlp/suggestions'      // ✅

// MCP (prefix 없음)
'/mcp/execute'                 // ✅
'/mcp/status'                  // ✅
```

---

## 수정된 파일 목록

### 1. `frontend/lib/api.ts`

**변경 사항**:
- Line 1: `API_BASE_URL` 하드코딩
- Line 63-84: Auth 엔드포인트 `/api/v1/...`으로 통일
- Line 92-96: Dashboard 엔드포인트 `/api/v1/...`으로 통일

**변경 전후 비교**:

| 함수 | 변경 전 | 변경 후 |
|------|---------|---------|
| login | `/api/auth/login` | `/api/v1/auth/login` |
| register | `/api/auth/register` | `/api/v1/auth/register` |
| logout | `/api/auth/logout` | `/api/v1/auth/logout` |
| getCurrentUser | `/api/auth/me` | `/api/v1/auth/me` |
| getDeployments | `/api/deployments` | `/api/v1/deployments` |
| getClusters | `/api/clusters` | `/api/v1/clusters` |

### 2. `frontend/app/oauth2-callback/page.tsx`

**변경 사항**:
- Line 39: fetch URL 하드코딩 및 중복 `/api` 제거

```typescript
// Before
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/oauth2/login`, {

// After
const response = await fetch(`https://klepaas.com/api/v1/auth/oauth2/login`, {
```

### 3. `frontend/hooks/use-global-websocket.ts`

**변경 사항**:
- Line 66-67: WebSocket base URL 하드코딩

```typescript
// Before
const base = (typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_WS_URL == null || process.env.NEXT_PUBLIC_WS_URL === ''))
  ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
  : (process.env.NEXT_PUBLIC_WS_URL as string)
const wsUrl = `${base}/api/v1/ws/deployments`

// After
const base = 'wss://klepaas.com/api'
const wsUrl = `${base}/api/v1/ws/deployments`
```

---

## 검증 결과

### API 엔드포인트 테스트

```bash
# NLP Suggestions (성공)
curl -s https://klepaas.com/api/api/v1/nlp/suggestions
# 결과: ["nginx pod 상태 확인해줘", "frontend-app pod 로그 50줄 보여줘", ...]

# 백엔드 정보 (성공)
curl -s https://klepaas.com/api/
# 결과: {"name":"K-Le-PaaS Backend Hybrid","version":"0.1.0","status":"running"}
```

### 최종 URL 구조

| 리소스 | URL 패턴 | 실제 예시 |
|--------|----------|-----------|
| 프론트엔드 | `https://klepaas.com/` | 메인 페이지, 대시보드 등 |
| 백엔드 API | `https://klepaas.com/api/api/v1/...` | `/api/api/v1/nlp/process` |
| 백엔드 MCP | `https://klepaas.com/api/mcp/...` | `/api/mcp/info` |
| WebSocket | `wss://klepaas.com/api/api/v1/ws/...` | `/api/api/v1/ws/deployments` |

### URL 구성 분석

```
https://klepaas.com/api/api/v1/nlp/process
                   └─┬─┘└────┬────┘└───┬───┘
                     │       │         │
                     │       │         └─ FastAPI 라우터 경로
                     │       └─────────── FastAPI prefix ("/api/v1")
                     └─────────────────── Nginx 프록시 경로
```

---

## 교훈 및 향후 개선사항

### 교훈

1. **환경변수 관리의 중요성**
   - Next.js 빌드 시점에 환경변수가 정적으로 번들에 포함됨
   - 런타임 환경변수와 빌드타임 환경변수를 구분해야 함
   - `NEXT_PUBLIC_*` 변수는 빌드 시점에 반드시 주입되어야 함

2. **인프라 구조 파악의 중요성**
   - Nginx 리버스 프록시 구조를 먼저 정확히 파악해야 함
   - 프론트엔드-Nginx-백엔드 간 경로 매핑을 문서화해야 함
   - 실제 서버 응답을 테스트하여 구조 확인 필요

3. **API 엔드포인트 일관성**
   - 백엔드 라우터 prefix 통일 중요 (모든 API를 `/api/v1/...` 패턴으로)
   - 프론트엔드 코드에서 엔드포인트 패턴 혼재 방지
   - 레거시 코드 제거 시 엔드포인트 일관성 검증 필요

4. **문서화의 중요성**
   - 인프라 구조를 명확히 문서화
   - API 엔드포인트 스펙 문서 유지
   - 환경별 설정 값 문서화

### 향후 개선사항

#### 1. 환경변수 관리 개선

**문제**: 하드코딩은 임시 방편, 환경별 배포 어려움

**제안**:

```typescript
// lib/config.ts (신규 생성)
export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://klepaas.com/api',
  wsBaseUrl: process.env.NEXT_PUBLIC_WS_URL || 'wss://klepaas.com/api',
  environment: process.env.NODE_ENV || 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
}

// 사용
import { config } from '@/lib/config'
const API_BASE_URL = config.apiBaseUrl
```

**빌드 파이프라인 개선**:

```yaml
# .github/workflows/deploy.yml
- name: Build Frontend
  env:
    NEXT_PUBLIC_API_URL: https://klepaas.com/api
    NEXT_PUBLIC_WS_URL: wss://klepaas.com/api
  run: npm run build
```

#### 2. Nginx 설정 문서화

**제안**: `docs/infrastructure.md` 생성

```markdown
## Nginx 리버스 프록시 구조

### 경로 매핑
- `/` → Next.js (포트 3000)
- `/api/` → FastAPI (포트 8080)

### 백엔드 URL 구조
- 내부: http://localhost:8080/api/v1/...
- 외부: https://klepaas.com/api/api/v1/...

### 설정 파일
위치: /etc/nginx/sites-available/klepaas.conf
```

#### 3. API 클라이언트 개선

**문제**: 하드코딩된 URL이 여러 파일에 분산

**제안**: 단일 API 클라이언트로 통합

```typescript
// lib/api-client.ts
class ApiClient {
  private baseURL: string
  private wsBaseURL: string

  constructor() {
    this.baseURL = config.apiBaseUrl
    this.wsBaseURL = config.wsBaseUrl
  }

  // 모든 API 호출을 이 클래스를 통해 처리
  async get<T>(endpoint: string): Promise<T> { ... }
  async post<T>(endpoint: string, data: any): Promise<T> { ... }
  connectWebSocket(endpoint: string): WebSocket { ... }
}

export const apiClient = new ApiClient()
```

#### 4. 개발 환경 설정 개선

**`.env.local` (개발 환경)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

**`.env.production` (프로덕션)**:
```env
NEXT_PUBLIC_API_URL=https://klepaas.com/api
NEXT_PUBLIC_WS_URL=wss://klepaas.com/api
```

#### 5. 테스트 자동화

**제안**: API 엔드포인트 통합 테스트 추가

```typescript
// tests/api-endpoints.test.ts
describe('API Endpoints', () => {
  it('should call correct API URLs', () => {
    const mockFetch = jest.fn()
    global.fetch = mockFetch

    apiClient.login({ email: 'test@test.com', password: 'pass' })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://klepaas.com/api/api/v1/auth/login',
      expect.any(Object)
    )
  })
})
```

#### 6. 엔드포인트 스펙 문서

**제안**: `docs/api-endpoints.md` 생성

```markdown
## API 엔드포인트 목록

### 인증 (Auth)
- POST /api/v1/auth/login
- POST /api/v1/auth/register
- GET /api/v1/auth/me

### 대시보드 (Dashboard)
- GET /api/v1/dashboard/overview

### NLP
- POST /api/v1/nlp/process
- GET /api/v1/nlp/history
- GET /api/v1/nlp/suggestions
```

---

## 결론

이번 이슈는 다음 세 가지 문제가 복합적으로 발생한 경우였습니다:

1. **환경변수 주입 실패**: 빌드 타임에 `NEXT_PUBLIC_API_URL`이 설정되지 않음
2. **인프라 구조 오해**: Nginx 리버스 프록시 경로 매핑을 잘못 이해
3. **엔드포인트 불일치**: 프론트엔드와 백엔드 간 API 경로 패턴 불일치

**즉각적인 해결**은 하드코딩을 통해 완료했지만, **장기적인 개선**을 위해서는 위의 개선사항들을 단계적으로 적용해야 합니다.

특히 다음 작업이 우선순위가 높습니다:

1. ✅ 하드코딩 제거하고 환경변수 관리 개선
2. ✅ 빌드 파이프라인에 환경변수 주입 자동화
3. ✅ Nginx 및 인프라 구조 문서화
4. ✅ API 엔드포인트 스펙 문서 작성

---

**참고 자료**:
- Next.js 환경변수 문서: https://nextjs.org/docs/basic-features/environment-variables
- FastAPI 배포 가이드: https://fastapi.tiangolo.com/deployment/
- Nginx 리버스 프록시: https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/

**관련 파일**:
- `frontend/lib/api.ts`
- `frontend/app/oauth2-callback/page.tsx`
- `frontend/hooks/use-global-websocket.ts`
- `backend-hybrid/app/main.py`

**버전 정보**:
- Next.js: 15.x
- FastAPI: 0.1.0
- Nginx: (서버 버전 확인 필요)
