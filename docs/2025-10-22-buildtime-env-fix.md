# Next.js 빌드타임 환경변수 수정 보고서

**날짜**: 2025년 10월 22일
**문제**: Deployment에서 런타임 환경변수 주입 시도 → Next.js에서 동작하지 않음

---

## 문제 상황

### Next.js 환경변수의 특징

**빌드타임 vs 런타임**:

```typescript
// ✅ 빌드 타임에 번들에 포함됨
process.env.NEXT_PUBLIC_API_URL

// 빌드 시점:
npm run build  // → 환경변수 값이 코드에 직접 치환됨

// 빌드 결과 (번들 코드):
const API_URL = "https://klepaas.com"  // ← 하드코딩된 것과 동일!
```

### 기존 설정의 문제

#### 1. GitHub Workflow (빌드 시)

```yaml
# ❌ 환경변수 없이 빌드
- name: Install & build
  run: |
    npm install
    npm run build  # 환경변수 없음!
```

**결과**:
- 우리가 환경변수를 필수로 만들었으므로 → **빌드 실패**
- 또는 빌드되더라도 `undefined`나 빈 값이 번들에 포함됨

#### 2. Deployment (런타임)

```yaml
# ❌ 런타임에 환경변수 주입 시도
env:
  - name: NEXT_PUBLIC_API_URL
    value: "https://klepaas.com"
  - name: NEXT_PUBLIC_WS_URL
    value: "wss://klepaas.com"
```

**문제**:
- Next.js는 이미 빌드된 번들을 실행
- 런타임 환경변수는 **무시됨**
- 빌드 시점에 포함된 값이 사용됨

---

## 해결 방법

### ✅ 수정 1: GitHub Workflow에 환경변수 추가

**파일**: `frontend/.github/workflows/ci.yml`

```yaml
# Before
- name: Install & build
  run: |
    npm install
    npm run build

# After
- name: Install & build
  env:
    NEXT_PUBLIC_API_URL: https://klepaas.com
    NEXT_PUBLIC_WS_URL: wss://klepaas.com
  run: |
    npm install
    npm run build
```

**효과**:
- 빌드 시점에 환경변수 주입
- 번들에 올바른 값이 포함됨
- Docker 이미지에 이미 빌드된 파일이 들어감

### ✅ 수정 2: Deployment values에서 env 제거

**파일**: `deployment-config/charts/common-chart/values/frontend-values.yaml`

```yaml
# Before
env:
  - name: NEXT_PUBLIC_API_URL
    value: "https://klepaas.com"
  - name: NEXT_PUBLIC_WS_URL
    value: "wss://klepaas.com"

# After
# Next.js 환경변수는 빌드 타임에 포함되므로 런타임 env는 불필요
# GitHub Workflow의 빌드 단계에서 환경변수 설정됨
```

**이유**:
- 런타임 환경변수는 효과가 없음
- 혼란을 방지하기 위해 제거

---

## 흐름 비교

### ❌ 기존 흐름 (잘못됨)

```
1. GitHub Workflow
   npm run build (환경변수 없음)
   → 빌드 실패 or undefined 포함

2. Docker 이미지
   잘못 빌드된 파일 포함

3. Kubernetes Deployment
   env로 환경변수 주입 시도
   → 무시됨 (이미 빌드된 파일)

4. 결과
   API 요청 실패!
```

### ✅ 수정된 흐름 (올바름)

```
1. GitHub Workflow
   NEXT_PUBLIC_API_URL=https://klepaas.com npm run build
   → 빌드 시 환경변수 번들에 포함

2. Docker 이미지
   올바르게 빌드된 파일 포함
   (이미 https://klepaas.com이 코드에 하드코딩된 상태)

3. Kubernetes Deployment
   런타임 환경변수 불필요
   (빌드 시점에 이미 포함됨)

4. 결과
   API 요청 성공! ✅
```

---

## Next.js 환경변수 동작 원리

### NEXT_PUBLIC_ 접두사

```typescript
// ✅ 브라우저에서 접근 가능 (빌드 시 번들에 포함)
process.env.NEXT_PUBLIC_API_URL

// ❌ 서버에서만 접근 가능 (런타임)
process.env.DATABASE_PASSWORD
```

### 빌드 프로세스

```bash
# 1. 환경변수 설정
export NEXT_PUBLIC_API_URL=https://klepaas.com

# 2. 빌드 실행
npm run build

# 3. webpack이 코드 변환
# Before:
const url = process.env.NEXT_PUBLIC_API_URL

# After (번들):
const url = "https://klepaas.com"  // ← 직접 치환됨!
```

### 런타임에는 변경 불가

```bash
# Docker 컨테이너 실행 시
docker run -e NEXT_PUBLIC_API_URL=https://other-domain.com frontend

# 🔴 이미 빌드된 번들에는 https://klepaas.com이 하드코딩되어 있음
# 🔴 런타임 환경변수는 무시됨
```

---

## 환경별 배포 전략

### 문제: 같은 이미지로 여러 환경에 배포 불가

```
staging: https://staging.klepaas.com
production: https://klepaas.com

❌ 같은 Docker 이미지 사용 불가
   (빌드 시점에 URL이 고정됨)
```

### 해결책 1: 환경별 이미지 빌드

```yaml
# GitHub Workflow
jobs:
  build-staging:
    - name: Build for staging
      env:
        NEXT_PUBLIC_API_URL: https://staging.klepaas.com
      run: npm run build

  build-production:
    - name: Build for production
      env:
        NEXT_PUBLIC_API_URL: https://klepaas.com
      run: npm run build
```

### 해결책 2: window.location.origin 활용 (우리가 선택)

```typescript
// ✅ 런타임에 동적으로 도메인 가져오기
const origin = window.location.origin
const redirectUri = `${origin}/oauth2-callback`

// 장점:
// - 같은 빌드로 여러 환경 지원
// - localhost, staging, production 모두 동작

// 단점:
// - OAuth2 redirect_uri처럼 동적 생성 가능한 경우에만 사용 가능
// - API URL은 빌드 시 고정되어야 함
```

---

## 검증 방법

### 1. 빌드 후 번들 확인

```bash
# 빌드 실행
NEXT_PUBLIC_API_URL=https://klepaas.com npm run build

# 번들에 URL이 포함되었는지 확인
grep -r "klepaas.com" .next/static/chunks/

# 결과 예시:
# .next/static/chunks/main-abc123.js: baseUrl:"https://klepaas.com"
```

### 2. Docker 이미지 확인

```bash
# 이미지 빌드
docker build -t frontend:test .

# 컨테이너 실행
docker run -p 3000:3000 frontend:test

# 브라우저에서 접속
# Network 탭에서 API 요청 URL 확인
# → https://klepaas.com/api/v1/... 로 요청되어야 함
```

### 3. Kubernetes Pod 로그 확인

```bash
# Pod 실행
kubectl get pods -n default | grep frontend

# 브라우저 콘솔 확인 (개발자 도구)
# Network 탭에서 API 요청 확인
# → https://klepaas.com/api/v1/... 로 요청되는지 확인
```

---

## 주의사항

### ⚠️ 환경변수 변경 시 재빌드 필수

```bash
# 환경변수 변경
export NEXT_PUBLIC_API_URL=https://new-domain.com

# ❌ 캐시 때문에 이전 빌드 사용될 수 있음
npm run build

# ✅ 캐시 삭제 후 재빌드
rm -rf .next
npm run build
```

### ⚠️ Docker 빌드 캐시 주의

```bash
# ❌ 캐시 사용 시 이전 환경변수 사용될 수 있음
docker build -t frontend .

# ✅ 캐시 무시하고 빌드
docker build --no-cache -t frontend .
```

### ⚠️ GitHub Actions 캐시

```yaml
# GitHub Actions는 node_modules 캐시
# 환경변수 변경 시 자동으로 재빌드됨
# 하지만 확실하게 하려면:

- name: Clear Next.js cache
  run: rm -rf .next

- name: Build
  env:
    NEXT_PUBLIC_API_URL: https://klepaas.com
  run: npm run build
```

---

## FAQ

### Q1. 왜 Deployment values에 env를 넣었는데 안 되나요?

**A**: Next.js는 빌드 시점에 환경변수를 번들에 포함합니다. 런타임 환경변수는 서버 사이드 렌더링에만 영향을 주며, 클라이언트 사이드 코드(브라우저)에는 영향을 주지 않습니다.

### Q2. 다른 환경(staging, dev)에 배포하려면?

**A**:
- **방법 1**: GitHub Workflow에서 환경별로 다른 환경변수로 빌드하여 다른 이미지 생성
- **방법 2**: `window.location.origin`을 활용하여 동적으로 URL 생성 (일부 경우에만 가능)

### Q3. 로컬 개발할 때는 어떻게 하나요?

**A**: `.env.local` 파일에 환경변수 설정하면 `npm run dev` 실행 시 자동으로 로드됩니다.

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Q4. 빌드 없이 환경변수를 변경할 수 없나요?

**A**: Next.js의 `NEXT_PUBLIC_*` 환경변수는 불가능합니다. 대안:
- Server-side only 환경변수 사용 (브라우저 접근 불가)
- 런타임 설정 API 구현 (서버에서 설정 파일 읽어서 제공)
- Feature flag 서비스 사용 (LaunchDarkly 등)

---

## 관련 문서

- [Next.js 환경변수 공식 문서](https://nextjs.org/docs/basic-features/environment-variables)
- [환경변수 설정 가이드](./ENVIRONMENT_SETUP.md)
- [환경변수 리팩토링 보고서](./2025-10-22-environment-refactoring.md)

---

## 수정된 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `frontend/.github/workflows/ci.yml` | 빌드 단계에 환경변수 추가 |
| `deployment-config/.../frontend-values.yaml` | 런타임 env 제거 및 주석 추가 |

---

## 체크리스트

프로덕션 배포 전 확인사항:

- [ ] GitHub Workflow에 올바른 환경변수 설정됨
- [ ] 빌드 성공 확인
- [ ] Docker 이미지에 올바른 URL 포함 확인
- [ ] Deployment values에서 불필요한 런타임 env 제거
- [ ] 브라우저에서 API 요청이 올바른 URL로 전송되는지 확인
- [ ] OAuth2 로그인 동작 확인

---

**작성자**: Claude Code
**배포일**: 2025-10-22
