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

ENV DATABASE_URL=file:/app/data/dev.db
ENV JWT_SECRET=docker-build-secret-key
ENV ENCRYPTION_KEY=docker-build-encryption-key

RUN npx prisma generate

RUN npm run build

RUN npx tsx scripts/build-scripts.ts


# =========================
# runner
# =========================
FROM node:lts-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

ENV SMTP_PORT=2525
ENV SMTP_HOST=127.0.0.1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

COPY --from=builder /app/prisma ./prisma

COPY --from=builder /app/dist/scripts ./scripts

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /app/data

COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
EXPOSE 2525

CMD ["/app/docker-entrypoint.sh"]