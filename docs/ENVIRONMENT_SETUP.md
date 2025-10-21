# 환경변수 설정 가이드

## 개요

이 프로젝트는 **환경변수 필수화** 정책을 사용합니다. 빌드 시점에 필수 환경변수가 설정되지 않으면 에러가 발생하여 실수를 방지합니다.

## 필수 환경변수

다음 환경변수는 **반드시** 설정되어야 합니다:

| 변수명 | 설명 | 예시 (로컬) | 예시 (프로덕션) |
|--------|------|-------------|----------------|
| `NEXT_PUBLIC_API_URL` | 백엔드 API URL | `http://localhost:8000` | `https://klepaas.com` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:8000` | `wss://klepaas.com` |
| `NEXT_PUBLIC_ORIGIN` | 프론트엔드 Origin | `http://localhost:3000` | `https://klepaas.com` |

## 선택적 환경변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `NEXT_PUBLIC_BASE_PATH` | 앱 base path | `""` (빈 문자열) |

## 환경별 설정 파일

### 로컬 개발 환경: `.env.local`

```bash
# .env.local (git에 커밋하지 않음)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_ORIGIN=http://localhost:3000
NEXT_PUBLIC_BASE_PATH=
```

### 프로덕션 환경: `.env.production`

```bash
# .env.production (git에 커밋하지 않음)
NEXT_PUBLIC_API_URL=https://klepaas.com
NEXT_PUBLIC_WS_URL=wss://klepaas.com
NEXT_PUBLIC_ORIGIN=https://klepaas.com
NEXT_PUBLIC_BASE_PATH=
```

## 설정 방법

### 1. 환경변수 파일 생성

```bash
# 템플릿 파일 복사
cp .env.example .env.local

# 또는 직접 생성
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_ORIGIN=http://localhost:3000
NEXT_PUBLIC_BASE_PATH=
EOF
```

### 2. 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
```

환경변수가 자동으로 로드됩니다.

### 3. 프로덕션 빌드

#### 방법 A: `.env.production` 파일 사용

```bash
# .env.production 파일이 있으면 자동으로 로드됨
npm run build
```

#### 방법 B: 명령줄에서 직접 지정

```bash
NEXT_PUBLIC_API_URL=https://klepaas.com \
NEXT_PUBLIC_WS_URL=wss://klepaas.com \
NEXT_PUBLIC_ORIGIN=https://klepaas.com \
npm run build
```

#### 방법 C: CI/CD 파이프라인에서 설정

**GitHub Actions 예시:**

```yaml
# .github/workflows/deploy.yml
- name: Build Frontend
  env:
    NEXT_PUBLIC_API_URL: https://klepaas.com
    NEXT_PUBLIC_WS_URL: wss://klepaas.com
    NEXT_PUBLIC_ORIGIN: https://klepaas.com
  run: npm run build
```

**Dockerfile 예시:**

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# 빌드 시 환경변수 주입
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_ORIGIN

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_ORIGIN=$NEXT_PUBLIC_ORIGIN

RUN npm run build
```

빌드 실행:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://klepaas.com \
  --build-arg NEXT_PUBLIC_WS_URL=wss://klepaas.com \
  --build-arg NEXT_PUBLIC_ORIGIN=https://klepaas.com \
  -t klepaas-frontend .
```

## 환경변수가 설정되지 않았을 때

필수 환경변수가 누락되면 빌드 시 명확한 에러 메시지가 표시됩니다:

```
❌ 필수 환경변수가 설정되지 않았습니다: NEXT_PUBLIC_API_URL
빌드 시 다음과 같이 설정하세요:
NEXT_PUBLIC_API_URL=your_value npm run build
```

## 환경변수 우선순위

Next.js는 다음 순서로 환경변수를 로드합니다 (위가 우선):

1. `process.env` (시스템 환경변수)
2. `.env.$(NODE_ENV).local` (예: `.env.production.local`)
3. `.env.local` (**주의**: `NODE_ENV=test`일 때는 로드 안 됨)
4. `.env.$(NODE_ENV)` (예: `.env.production`)
5. `.env`

## 보안 주의사항

### ⚠️ Git에 커밋하지 말아야 할 파일

- `.env.local`
- `.env.production.local`
- `.env.production` (민감한 정보 포함 시)

### ✅ Git에 커밋해도 되는 파일

- `.env.example` (템플릿, 실제 값 없음)

### `.gitignore` 설정 확인

```gitignore
# 환경변수 파일
.env*.local
.env.production
```

## 트러블슈팅

### 문제: 환경변수 변경 후에도 이전 값이 적용됨

**원인**: Next.js는 환경변수를 빌드 시점에 번들에 포함시킵니다.

**해결**:
```bash
# .next 폴더 삭제 후 재빌드
rm -rf .next
npm run build
```

### 문제: 브라우저에서 환경변수가 `undefined`

**원인**: `NEXT_PUBLIC_` 접두사가 없는 환경변수는 서버에서만 사용 가능합니다.

**해결**: 브라우저에서 사용할 환경변수는 반드시 `NEXT_PUBLIC_` 접두사를 붙이세요.

```bash
# ❌ 브라우저에서 접근 불가
API_URL=https://example.com

# ✅ 브라우저에서 접근 가능
NEXT_PUBLIC_API_URL=https://example.com
```

### 문제: Docker 빌드 시 환경변수가 적용 안 됨

**원인**: Docker 빌드 시 `ARG`와 `ENV`를 모두 설정해야 합니다.

**해결**: Dockerfile에서 `ARG` → `ENV` 순서로 설정:

```dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

## 참고 자료

- [Next.js 환경변수 공식 문서](https://nextjs.org/docs/basic-features/environment-variables)
- [Next.js 빌드타임 환경변수](https://nextjs.org/docs/basic-features/environment-variables#exposing-environment-variables-to-the-browser)

## 변경 이력

- **2025-10-22**: 환경변수 필수화 정책 적용, 기본값 제거
- **2025-10-22**: Nginx reverse proxy 설정 수정에 따른 URL 구조 변경
