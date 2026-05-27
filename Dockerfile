# =========================
# deps
# =========================
FROM node:lts-slim AS deps

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci && \
    npm cache clean --force


# =========================
# builder
# =========================
FROM node:lts-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 构建阶段仅提供 Prisma 所需环境变量
# 不生成 .env 文件，避免污染最终环境
ENV DATABASE_URL=file:/app/data/dev.db
ENV JWT_SECRET=docker-build-secret-key
ENV ENCRYPTION_KEY=docker-build-encryption-key

# 生成 Prisma Client
RUN npx prisma generate

# Next.js 构建
RUN npm run build


# =========================
# runner
# =========================
FROM node:lts-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Prisma/OpenSSL 依赖
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# -------------------------
# 运行时环境变量
# -------------------------
ENV DATABASE_URL=file:/app/data/dev.db
ENV SMTP_PORT=2525
ENV SMTP_HOST=127.0.0.1

# -------------------------
# Next.js standalone
# 注意 next.config.js 需要:
# output: 'standalone'
# -------------------------
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma
COPY --from=builder /app/prisma ./prisma

# SMTP 脚本
COPY --from=builder /app/scripts ./scripts

# Prisma Client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Prisma CLI
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

# 如果 standalone 缺少 schema 相关文件可补充
COPY --from=builder /app/package.json ./package.json

# 数据目录
RUN mkdir -p /app/data

# -------------------------
# entrypoint
# -------------------------
RUN printf '%s\n' \
'#!/bin/sh' \
'' \
'set -e' \
'' \
'echo "[INFO] Preparing database..."' \
'mkdir -p /app/data' \
'' \
'# 数据库同步' \
'./node_modules/.bin/prisma db push --skip-generate' \
'' \
'# 启动 SMTP 服务（仅 JS）' \
'if [ -f /app/scripts/start-smtp.js ]; then' \
'  echo "[INFO] Starting SMTP service..."' \
'  node /app/scripts/start-smtp.js &' \
'fi' \
'' \
'echo "[INFO] Starting Next.js server..."' \
'exec node server.js' \
> /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
EXPOSE 2525

CMD ["/app/docker-entrypoint.sh"]