# ══════════════════════════════════════════════════════════════
# Rogue Studio — Production Dockerfile
# Multi-stage build for minimal image size
# ══════════════════════════════════════════════════════════════

FROM node:20-alpine AS base

# Install system deps needed for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# ── Dependencies stage ──
FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Build stage ──
FROM base AS builder

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Production stage ──
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Install security research tooling
RUN apk add --no-cache \
    tor \
    binutils \
    radare2 \
    curl \
    nmap \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 rogue

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=rogue:nodejs /app/.next/standalone ./
COPY --from=builder --chown=rogue:nodejs /app/.next/static ./.next/static

# Create workspace directory with proper permissions
RUN mkdir -p /app/rogue_workspace && chown rogue:nodejs /app/rogue_workspace

USER rogue

EXPOSE 3000

# Health check for orchestrators (Docker, k8s)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
