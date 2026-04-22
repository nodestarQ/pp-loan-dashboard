# syntax=docker/dockerfile:1.6
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate
WORKDIR /app

# --- deps stage
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
	pnpm install --frozen-lockfile

# --- build stage
FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN pnpm --filter @pp/web build

# --- runtime: slim node image with only prod deps + compiled server
FROM base AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN apk add --no-cache wget

COPY --from=build /app/pnpm-workspace.yaml /app/pnpm-lock.yaml /app/package.json ./
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/shared/src ./packages/shared/src
COPY --from=build /app/apps/web/package.json ./apps/web/
COPY --from=build /app/apps/web/build ./apps/web/build

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
	pnpm install --prod --frozen-lockfile

EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=6 \
	CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

WORKDIR /app/apps/web
CMD ["node", "build"]
