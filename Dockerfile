# ==============
# 1. Builder Stage: 앱을 빌드하는 단계
# ==============
FROM node:20-bullseye AS builder

# 작업 디렉터리 설정
WORKDIR /app

# package.json 파일들만 먼저 복사하여 의존성 설치 (캐시 활용)
COPY package*.json ./
RUN npm install

# 나머지 전체 소스코드 복사
COPY . .

# next.config.js에 output: 'standalone' 설정이 되어 있어야 합니다.
# 앱 빌드 실행 -> 이 단계에서 .next/standalone 이 생성됩니다.
RUN npm run build

# ==============
# 2. Runner Stage: 빌드된 앱을 실행하는 단계
# ==============
FROM node:20-bullseye-slim AS runner

WORKDIR /app

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Builder Stage에서 생성된 'standalone' 폴더만 복사
COPY --from=builder /app/.next/standalone ./

# (선택 사항) public 폴더와 .next/static 폴더 복사
# 만약 Next.js에서 이미지 최적화(next/image)나 정적 파일을 사용한다면
# 이 두 줄의 주석을 해제하세요.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Next.js standalone 서버 실행 (server.js)
CMD ["node", "server.js"]
