FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Modul DB/auth diimpor saat build (route collection Next.js); nilai asli
# disuntikkan lewat env var container saat runtime, ini cuma untuk lolos build.
ENV DATABASE_URL="postgres://build:build@localhost:5432/build"
ENV AUTH_SECRET="build-time-placeholder-not-used-at-runtime"
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY drizzle.config.ts ./
COPY src/db ./src/db

RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV PORT=3000
# ponytail: migrate lalu start di satu container, cocok buat single-instance
# EasyPanel. Kalau nanti scale ke banyak replica, pindahkan migrate ke job
# terpisah (docker run --entrypoint sh <image> -c "npx drizzle-kit migrate")
# supaya tidak race — image ini sama, cukup override command-nya.
CMD ["sh", "-c", "npx drizzle-kit migrate && npm start"]
