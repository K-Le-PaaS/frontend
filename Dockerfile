# Multi-stage Dockerfile for Next.js (App Router) production build
# Uses Next.js standalone output to keep the runtime image small

ARG NODE_VERSION=20-alpine

# 1) Base with common settings
FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME=/root/.local/share/pnpm \
    NODE_ENV=production
WORKDIR /app

# 2) Dependencies (leverage layer caching)
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 3) Build
FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Accept build-time overrides for public envs (optional)
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
RUN npm run build

# 4) Production runner with standalone output
FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# Copy only the standalone server and assets
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Healthcheck (basic)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT).then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))" || exit 1

EXPOSE 3000
CMD ["node", "server.js"]


