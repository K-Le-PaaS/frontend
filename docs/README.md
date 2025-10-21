# K-Le-PaaS Frontend 문서

> K-Le-PaaS Frontend 프로젝트의 모든 기술 문서를 체계적으로 정리한 디렉토리입니다.

---

## 📂 문서 구조

```
docs/
├── README.md                    # 이 파일
└── FRONTEND_ARCHITECTURE.md     # 전체 프론트엔드 아키텍처 ⭐
```

---

## 🚀 빠른 시작

### 처음 시작하는 경우

1. **프론트엔드 아키텍처 이해**: [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) ⭐ 필독
   - 전체 시스템 구조 및 컴포넌트
   - 디렉토리 구조 (61개 컴포넌트)
   - 핵심 기술 스택 (Next.js 15, React 19, TypeScript)
   - 데이터 흐름 및 상태 관리
   - 인증, 스타일링, 성능 최적화

2. **백엔드 API 이해**: [../../backend-hybrid/docs/architecture/BACKEND_ARCHITECTURE.md](../../backend-hybrid/docs/architecture/BACKEND_ARCHITECTURE.md)
   - REST API 엔드포인트
   - WebSocket 실시간 통신
   - OAuth2 인증 플로우

3. **로컬 개발 시작**:
   ```bash
   # 의존성 설치
   npm install

   # 환경 변수 설정
   cp .env.example .env.local
   # NEXT_PUBLIC_API_URL=http://localhost:8000 설정

   # 개발 서버 실행
   npm run dev
   # → http://localhost:3000/console
   ```

4. **프로덕션 빌드**:
   ```bash
   # 빌드
   npm run build

   # 프로덕션 서버 실행
   npm start
   ```

---

## 📖 주요 문서 설명

### 🌟 FRONTEND_ARCHITECTURE.md
**전체 프론트엔드 시스템 아키텍처 문서**

다음 내용을 포함합니다:
- **시스템 개요**: AI 기반 Kubernetes PaaS 플랫폼 UI
- **기술 스택**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **전체 아키텍처**: 레이어 구조, 컴포넌트 계층
- **디렉토리 구조**: app/, components/, hooks/, lib/, contexts/
- **핵심 컴포넌트**:
  - 메인 페이지 (app/page.tsx)
  - 대시보드 개요 (dashboard-overview.tsx)
  - 자연어 명령 (natural-language-command.tsx)
  - 배포 모니터링 (deployment-status-monitoring.tsx)
  - GitHub 통합 (github-integration-panel.tsx)
  - 실시간 모니터링 (real-time-monitoring-dashboard.tsx)
  - API 클라이언트 (lib/api.ts)
  - WebSocket 관리 (hooks/use-global-websocket.ts)
- **상태 관리**: React Context API, Local State, Local Storage
- **데이터 흐름**: REST API, WebSocket, OAuth2
- **라우팅**: Next.js App Router, basePath 설정
- **스타일링**: Tailwind CSS 4, shadcn/ui (48개 컴포넌트)
- **인증 및 보안**: OAuth2, 보호된 라우트, CORS, XSS 방지
- **성능 최적화**: Server Components, 이미지 최적화, 코드 스플리팅

---

## 🎯 주요 기능

### 1. 대시보드
- 전체 클러스터 상태 한눈에 보기
- Deployment, Pod, Service, Ingress 개수
- 최근 배포 이력
- 리소스 사용률 그래프 (Recharts)

### 2. 자연어 명령
- "nginx 재시작해줘" → Kubernetes 명령 실행
- Gemini API 기반 자연어 처리
- 14가지 명령어 지원 (status, logs, restart, deploy 등)

### 3. 실시간 배포 모니터링
- WebSocket 기반 실시간 업데이트
- 배포 상태 (Running, Pending, Failed)
- Pod Ready 상태
- 배포 진행률

### 4. GitHub 통합
- OAuth 인증 후 저장소 연결
- 워크플로우 수동 트리거
- 최근 실행 이력 조회

### 5. Slack 연동
- OAuth 인증 후 채널 연결
- 배포 알림 수신

### 6. 프로메테우스 메트릭
- CPU, 메모리, 네트워크 사용률
- 실시간 그래프 (Recharts)
- PromQL 쿼리

---

## 🛠 기술 스택

### 프레임워크
- **Next.js 15.2.4**: React 프레임워크 (App Router, Server Components)
- **React 19**: UI 라이브러리
- **TypeScript 5**: 정적 타입 체크

### UI 라이브러리
- **shadcn/ui**: 재사용 가능한 컴포넌트 (48개)
- **Radix UI**: 접근성 우선 Headless UI (25개 패키지)
- **Tailwind CSS 4.1.9**: 유틸리티 우선 CSS
- **Lucide React**: 아이콘 라이브러리

### 데이터 시각화
- **Recharts**: 선언적 차트 라이브러리

### 폼 및 검증
- **React Hook Form 7.60.0**: 폼 상태 관리
- **Zod 3.25.67**: 스키마 검증

### 통신
- **Fetch API**: REST API 호출
- **WebSocket**: 실시간 이벤트

---

## 🔍 컴포넌트 찾기

### 메인 페이지
→ `app/page.tsx` - 애플리케이션 진입점

### 핵심 컴포넌트
→ `components/dashboard-overview.tsx` - 대시보드
→ `components/natural-language-command.tsx` - NLP 명령
→ `components/deployment-status-monitoring.tsx` - 배포 모니터링
→ `components/github-integration-panel.tsx` - GitHub 통합
→ `components/real-time-monitoring-dashboard.tsx` - 실시간 모니터링

### UI 컴포넌트
→ `components/ui/` - shadcn/ui 컴포넌트 (48개)

### Hooks
→ `hooks/use-global-websocket.ts` - WebSocket 관리
→ `hooks/use-toast.ts` - Toast 알림

### Contexts
→ `contexts/auth-context.tsx` - 인증 상태

### 라이브러리
→ `lib/api.ts` - API 클라이언트
→ `lib/utils.ts` - 유틸 함수

---

## 📝 개발 가이드

### 새 컴포넌트 추가
1. `components/` 디렉토리에 `.tsx` 파일 생성
2. shadcn/ui 컴포넌트 사용 (`components/ui/`)
3. TypeScript 타입 정의
4. Tailwind CSS 스타일링

### 새 API 엔드포인트 연동
1. `lib/api.ts`에 메서드 추가
2. TypeScript 타입 정의
3. 컴포넌트에서 호출

### 새 페이지 추가
1. `app/` 디렉토리에 `page.tsx` 생성
2. App Router 규칙 따르기
3. 메타데이터 설정 (SEO)

---

## 🎨 디자인 시스템

### 색상 (Tailwind CSS)
- `background` - 배경색
- `foreground` - 전경색
- `primary` - 주요 색상
- `secondary` - 보조 색상
- `accent` - 강조 색상
- `destructive` - 위험 색상

### 테마
- Light Mode
- Dark Mode (기본)

### 타이포그래피
- Font: Geist Sans, Geist Mono

---

## 🔗 관련 문서

### 프로젝트 문서
- **프론트엔드 README**: [../README.md](../README.md)
- **백엔드 아키텍처**: [../../backend-hybrid/docs/architecture/BACKEND_ARCHITECTURE.md](../../backend-hybrid/docs/architecture/BACKEND_ARCHITECTURE.md)
- **NLP API**: [../../backend-hybrid/docs/architecture/nlp/implementation.md](../../backend-hybrid/docs/architecture/nlp/implementation.md)

### 외부 문서
- [Next.js 공식 문서](https://nextjs.org/docs)
- [React 공식 문서](https://react.dev)
- [shadcn/ui 컴포넌트](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)

---

## 🤝 기여 가이드

1. 새로운 기능 구현 시 관련 문서 업데이트
2. 컴포넌트는 재사용 가능하게 설계
3. TypeScript 타입 정의 필수
4. Tailwind CSS 유틸리티 우선 사용
5. 접근성 (a11y) 고려

---

## 🐛 트러블슈팅

### CORS 에러
- `next.config.mjs`의 `rewrites` 설정 확인
- 백엔드 CORS 설정 확인

### WebSocket 연결 실패
- 백엔드 WebSocket 서버 실행 확인
- URL 경로 확인 (`/ws/deployments`)

### OAuth 리다이렉트 오류
- `redirect_uri` 정확히 일치하는지 확인
- 백엔드 OAuth 설정 확인 (GitHub Client ID, Secret)

### 빌드 에러
- `npm install` 재실행
- `node_modules` 삭제 후 재설치
- TypeScript 에러 확인

---

**문서 정리 날짜**: 2025-10-20
**담당자**: Frontend Team

