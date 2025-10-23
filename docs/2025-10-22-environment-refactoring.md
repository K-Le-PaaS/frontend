# 환경변수 리팩토링 및 필수화 보고서

**날짜**: 2025년 10월 22일
**목적**: 환경변수 기본값 제거 및 필수화를 통한 빌드 안정성 확보

---

## 문제 상황

### 기존 방식의 문제점

```typescript
// ❌ 기존 코드
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://klepaas.com'
```

**문제**:
1. 환경변수가 설정되지 않아도 기본값으로 빌드 성공
2. 로컬 개발용 기본값이 프로덕션 빌드에 포함될 위험
3. 환경변수 누락을 사전에 감지 불가능
4. 하드코딩된 값이 여러 파일에 분산

**실제 발생했던 문제**:
```bash
# CI/CD에서 환경변수 설정 누락
npm run build  # 환경변수 없음

# 빌드는 성공하지만 기본값 사용
# → 프로덕션에서 localhost:8000으로 요청 시도
# → 모든 API 요청 실패
```

---

## 해결 방안

### 1. 중앙 집중식 설정 파일 생성

**`frontend/lib/config.ts`**

```typescript
// 필수 환경변수 검증 함수
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
  api: {
    baseUrl: getRequiredEnv('NEXT_PUBLIC_API_URL'),  // 기본값 없음!
    wsUrl: getRequiredEnv('NEXT_PUBLIC_WS_URL'),
  },
  app: {
    origin: getRequiredEnv('NEXT_PUBLIC_ORIGIN'),
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',  // 선택적
  },
}
```

**장점**:
- ✅ 환경변수 누락 시 빌드가 **즉시 실패**
- ✅ 명확한 에러 메시지로 문제 파악 용이
- ✅ 실수로 잘못된 기본값 사용 불가능
- ✅ 모든 설정을 한 곳에서 관리

### 2. 환경변수 파일 생성

#### `.env.local` (로컬 개발)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_ORIGIN=http://localhost:3000
```

#### `.env.production` (프로덕션)

```bash
NEXT_PUBLIC_API_URL=https://klepaas.com
NEXT_PUBLIC_WS_URL=wss://klepaas.com
NEXT_PUBLIC_ORIGIN=https://klepaas.com
```

#### `.env.example` (템플릿)

```bash
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_WS_URL=wss://your-domain.com
NEXT_PUBLIC_ORIGIN=https://your-domain.com
NEXT_PUBLIC_BASE_PATH=
```

### 3. 코드 리팩토링

#### Before (하드코딩 분산)

```typescript
// ❌ lib/api.ts
const API_BASE_URL = 'https://klepaas.com'

// ❌ hooks/use-global-websocket.ts
const base = 'wss://klepaas.com'

// ❌ app/oauth2-callback/page.tsx
const origin = 'https://klepaas.com'
```

#### After (중앙 집중)

```typescript
// ✅ 모든 파일에서 동일하게 사용
import { config } from '@/lib/config'

config.api.baseUrl  // 환경변수에서 로드
config.api.wsUrl    // 환경변수에서 로드
config.app.origin   // 환경변수에서 로드
```

---

## 수정된 파일 목록

### 1. 신규 생성

| 파일 | 목적 |
|------|------|
| `lib/config.ts` | 중앙 집중식 설정 관리 |
| `.env.local` | 로컬 개발 환경변수 |
| `.env.production` | 프로덕션 환경변수 |
| `.env.example` | 환경변수 템플릿 |
| `docs/ENVIRONMENT_SETUP.md` | 환경변수 설정 가이드 |
| `docs/2025-10-22-environment-refactoring.md` | 이 문서 |

### 2. 수정된 파일

| 파일 | 변경 내용 |
|------|-----------|
| `lib/api.ts` | 하드코딩 제거 → `config` 사용 |
| `hooks/use-global-websocket.ts` | 하드코딩 제거 → `config` 사용 |
| `app/oauth2-callback/page.tsx` | 하드코딩 제거 → `config` 사용 |

---

## 환경변수 필수화의 이점

### 1. 빌드 안정성 보장

```bash
# 환경변수 없이 빌드 시도
npm run build

# 즉시 에러 발생 (기존에는 성공)
❌ Error: 필수 환경변수가 설정되지 않았습니다: NEXT_PUBLIC_API_URL
빌드 시 다음과 같이 설정하세요:
NEXT_PUBLIC_API_URL=your_value npm run build
```

### 2. 환경별 설정 명확화

```bash
# 로컬 개발
npm run dev  # .env.local 자동 로드

# 프로덕션 빌드
npm run build  # .env.production 자동 로드

# 또는 명시적 지정
NEXT_PUBLIC_API_URL=https://staging.klepaas.com npm run build
```

### 3. CI/CD 파이프라인 개선

**Before (위험)**:
```yaml
# 환경변수 설정 누락해도 빌드 성공
- name: Build
  run: npm run build  # 기본값 사용
```

**After (안전)**:
```yaml
# 환경변수 필수 - 누락 시 빌드 실패
- name: Build
  env:
    NEXT_PUBLIC_API_URL: https://klepaas.com
    NEXT_PUBLIC_WS_URL: wss://klepaas.com
    NEXT_PUBLIC_ORIGIN: https://klepaas.com
  run: npm run build
```

### 4. 타입 안전성 및 자동완성

```typescript
// ✅ TypeScript 자동완성 지원
config.api.baseUrl  // ← IDE에서 자동완성
config.api.wsUrl
config.app.origin

// ✅ 오타 방지
config.api.basUrl  // ← 컴파일 에러
```

---

## 마이그레이션 가이드

### 개발자용 (로컬 환경)

```bash
# 1. 최신 코드 pull
git pull origin main

# 2. .env.local 파일 생성
cp .env.example .env.local

# 3. 로컬 환경에 맞게 수정
vim .env.local

# 4. 의존성 설치 및 실행
npm install
npm run dev
```

### DevOps/CI/CD 담당자용

#### GitHub Actions

```yaml
# .github/workflows/build.yml
jobs:
  build:
    steps:
      - name: Build Frontend
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          NEXT_PUBLIC_WS_URL: ${{ secrets.WS_URL }}
          NEXT_PUBLIC_ORIGIN: ${{ secrets.ORIGIN }}
        run: npm run build
```

**필수 작업**: GitHub Secrets에 다음 값 추가
- `API_URL`: https://klepaas.com
- `WS_URL`: wss://klepaas.com
- `ORIGIN`: https://klepaas.com

#### Docker

**Dockerfile**:
```dockerfile
FROM node:18-alpine AS builder

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_ORIGIN

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_ORIGIN=$NEXT_PUBLIC_ORIGIN

RUN npm run build
```

**빌드 명령**:
```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://klepaas.com \
  --build-arg NEXT_PUBLIC_WS_URL=wss://klepaas.com \
  --build-arg NEXT_PUBLIC_ORIGIN=https://klepaas.com \
  -t klepaas-frontend .
```

---

## 테스트 체크리스트

### 로컬 개발 환경

- [ ] `.env.local` 파일 존재 확인
- [ ] `npm run dev` 실행 시 에러 없이 시작
- [ ] API 요청이 `http://localhost:8000`로 전송되는지 확인
- [ ] WebSocket이 `ws://localhost:8000`로 연결되는지 확인

### 프로덕션 빌드

- [ ] `.env.production` 파일 존재 확인
- [ ] `npm run build` 실행 시 에러 없이 빌드 성공
- [ ] 빌드된 파일에서 환경변수가 올바르게 치환되었는지 확인

```bash
# 빌드 후 확인
grep -r "https://klepaas.com" .next/static/chunks/
# 결과: 여러 파일에서 발견되어야 함
```

### 환경변수 누락 테스트

```bash
# 환경변수 없이 빌드 시도
unset NEXT_PUBLIC_API_URL
npm run build

# 기대 결과: 명확한 에러 메시지와 함께 빌드 실패
```

---

## Nginx 설정과의 연계

이번 리팩토링은 **Nginx trailing slash 수정**과 함께 진행되었습니다.

### Nginx 설정 변경

**Before**:
```nginx
location /api/ {
    proxy_pass http://klepaas_backend/;  # trailing slash → /api/ 제거
}
```

**After**:
```nginx
location /api/ {
    proxy_pass http://klepaas_backend;  # no trailing slash → 경로 유지
}
```

### URL 구조

```
프론트엔드 요청:  https://klepaas.com/api/v1/auth/login
                              ↓
Nginx 처리:       경로 유지 (trailing slash 없음)
                              ↓
백엔드 전달:      http://backend:30800/api/v1/auth/login
                              ↓
FastAPI 라우터:   ✅ /api/v1/auth/login 매칭 성공
```

**환경변수 설정**:
```bash
NEXT_PUBLIC_API_URL=https://klepaas.com  # /api 붙이지 않음!
```

**프론트엔드 코드**:
```typescript
config.api.baseUrl  // https://klepaas.com
엔드포인트          // /api/v1/auth/login
최종 URL           // https://klepaas.com/api/v1/auth/login ✅
```

---

## 트러블슈팅

### Q1. 환경변수 변경 후에도 이전 값이 사용됨

**원인**: Next.js 빌드 캐시

**해결**:
```bash
rm -rf .next
npm run build
```

### Q2. Docker 빌드 시 환경변수가 적용 안 됨

**원인**: `ARG`만 설정하고 `ENV`로 변환하지 않음

**해결**:
```dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL  # ← 이 줄 필수
```

### Q3. 개발 서버에서는 되는데 프로덕션 빌드에서 실패

**원인**: `.env.local`과 `.env.production` 값이 다름

**해결**: 두 파일의 환경변수 키가 동일한지 확인
```bash
diff <(grep '^NEXT_PUBLIC' .env.local | cut -d= -f1 | sort) \
     <(grep '^NEXT_PUBLIC' .env.production | cut -d= -f1 | sort)
```

---

## 향후 개선 방향

### 1. 환경변수 스키마 검증

**zod를 사용한 런타임 검증**:

```typescript
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_WS_URL: z.string().startsWith('ws'),
  NEXT_PUBLIC_ORIGIN: z.string().url(),
})

const env = envSchema.parse(process.env)
```

### 2. 환경별 빌드 스크립트

**package.json**:
```json
{
  "scripts": {
    "build:dev": "dotenv -e .env.development -- next build",
    "build:staging": "dotenv -e .env.staging -- next build",
    "build:prod": "dotenv -e .env.production -- next build"
  }
}
```

### 3. 환경변수 문서 자동 생성

```typescript
// scripts/generate-env-docs.ts
// .env.example을 파싱하여 Markdown 문서 자동 생성
```

---

## 관련 문서

- [환경변수 설정 가이드](./ENVIRONMENT_SETUP.md)
- [API 엔드포인트 수정 보고서](./2025-10-22-api-endpoint-fix.md)
- [Next.js 환경변수 공식 문서](https://nextjs.org/docs/basic-features/environment-variables)

---

## 체크리스트

프로덕션 배포 전 다음 항목을 확인하세요:

- [ ] `.env.production` 파일이 올바른 값으로 설정됨
- [ ] CI/CD 파이프라인에 환경변수 설정 추가
- [ ] Docker 빌드 시 `ARG` 및 `ENV` 설정 확인
- [ ] Nginx 설정 변경 완료 (trailing slash 제거)
- [ ] 프로덕션 빌드 테스트 완료
- [ ] API 요청이 올바른 URL로 전송되는지 확인
- [ ] WebSocket 연결 정상 동작 확인
- [ ] 팀원들에게 변경사항 공유 및 `.env.local` 설정 안내

---

**작성자**: Claude Code
**검토자**: [검토자 이름]
**승인자**: [승인자 이름]
**배포일**: 2025-10-22
