# Healthcare AI - Frontend (Next.js + Tailwind CSS)

# ═══════════════════════════════════════════════════
# Stage 1: Dependencies
# ═══════════════════════════════════════════════════
FROM node:20-alpine AS deps

WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci

# ═══════════════════════════════════════════════════
# Stage 2: Build
# ═══════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ✅ Build arguments
ARG API_GATEWAY_URL=http://api-gateway:8080
ARG NEXT_PUBLIC_AUTH_API_URL=/api/gateway
ARG DOCKER_ENV=true

ENV API_GATEWAY_URL=${API_GATEWAY_URL}
ENV NEXT_PUBLIC_AUTH_API_URL=${NEXT_PUBLIC_AUTH_API_URL}
ENV DOCKER_ENV=${DOCKER_ENV}

RUN npm run build

# ═══════════════════════════════════════════════════
# Stage 3: Production
# ═══════════════════════════════════════════════════
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_ENV=true

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]