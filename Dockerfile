FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ── Зависимости ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY lib/db/package.json                ./lib/db/
COPY lib/api-spec/package.json          ./lib/api-spec/
COPY lib/api-zod/package.json           ./lib/api-zod/
COPY lib/api-client-react/package.json  ./lib/api-client-react/
COPY artifacts/api-server/package.json  ./artifacts/api-server/
COPY artifacts/wedding/package.json     ./artifacts/wedding/
RUN pnpm install --no-frozen-lockfile

# ── Сборка ──────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN NODE_ENV=production BASE_PATH=/ pnpm --filter @workspace/wedding run build
RUN NODE_ENV=production pnpm --filter @workspace/api-server run build

# ── Production-образ ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN corepack enable
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Только production-зависимости
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY lib/db/package.json                ./lib/db/
COPY lib/api-zod/package.json           ./lib/api-zod/
COPY lib/api-client-react/package.json  ./lib/api-client-react/
COPY artifacts/api-server/package.json  ./artifacts/api-server/
RUN pnpm install --no-frozen-lockfile --prod

# Скомпилированные файлы
COPY --from=builder /app/artifacts/api-server/dist ./dist/server
COPY --from=builder /app/artifacts/wedding/dist/public ./dist/public

# Entrypoint: сид + запуск сервера
COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
