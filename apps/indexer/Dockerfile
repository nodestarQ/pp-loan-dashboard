# syntax=docker/dockerfile:1.6
FROM node:22-alpine AS base
RUN apk add --no-cache wget
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate
WORKDIR /app

# --- deps stage: install the full workspace once, cached on pnpm-lock
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/indexer/package.json ./apps/indexer/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
	pnpm install --frozen-lockfile

# --- runtime: copy source + regenerate ponder-env.d.ts so the TS build
# is valid even if the committed copy is stale from a schema edit.
FROM deps AS runtime
COPY packages/shared ./packages/shared
COPY apps/indexer ./apps/indexer

ENV NODE_ENV=production
ENV PONDER_PORT=42069
EXPOSE 42069

WORKDIR /app/apps/indexer
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=6 \
	CMD wget -qO- http://127.0.0.1:42069/health || exit 1

CMD ["pnpm", "exec", "ponder", "start"]
