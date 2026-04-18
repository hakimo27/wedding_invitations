FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY lib/db/package.json                ./lib/db/
COPY lib/api-spec/package.json          ./lib/api-spec/
COPY lib/api-zod/package.json           ./lib/api-zod/
COPY lib/api-client-react/package.json  ./lib/api-client-react/
COPY artifacts/api-server/package.json  ./artifacts/api-server/
COPY artifacts/wedding/package.json     ./artifacts/wedding/
RUN pnpm install --frozen-lockfile

# Build
FROM deps AS builder
COPY . .
RUN NODE_ENV=production BASE_PATH=/ pnpm --filter @workspace/wedding run build
RUN NODE_ENV=production pnpm --filter @workspace/api-server run build

# Production image
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY lib/db/package.json                ./lib/db/
COPY lib/api-zod/package.json           ./lib/api-zod/
COPY lib/api-client-react/package.json  ./lib/api-client-react/
COPY artifacts/api-server/package.json  ./artifacts/api-server/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/artifacts/api-server/dist ./dist/server
COPY --from=builder /app/artifacts/wedding/dist/public ./dist/public

EXPOSE 3000

CMD ["node", "dist/server/index.mjs"]
