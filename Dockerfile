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

# drizzle-kit ada di devDependencies, jadi tidak ikut ke node_modules standalone
# di stage "runner" — pakai node_modules lengkap dari "deps" untuk stage migrasi ini.
FROM deps AS migrator
WORKDIR /app
COPY drizzle.config.ts tsconfig.json ./
COPY src/db ./src/db
CMD ["npx", "drizzle-kit", "migrate"]

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
