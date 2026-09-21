# ----------------------------------------------------
# Base Stage
# ----------------------------------------------------
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.5.1 --activate
WORKDIR /app

# ----------------------------------------------------
# Dependencies & Build Stage
# ----------------------------------------------------
FROM base AS builder

ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy monorepo manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY apps/web/package.json apps/web/tsconfig.json apps/web/next.config.mjs apps/web/tailwind.config.ts apps/web/postcss.config.js ./apps/web/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/src ./packages/shared/src
COPY apps/web/src ./apps/web/src

# Build packages
RUN pnpm --filter @skillnest/shared build
RUN pnpm --filter @skillnest/web build

# ----------------------------------------------------
# Production Runner Stage
# ----------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5173

USER node

# Copy standalone Next.js server and static files
COPY --chown=node:node --from=builder /app/apps/web/.next/standalone ./
COPY --chown=node:node --from=builder /app/apps/web/.next/static ./apps/web/.next/static

WORKDIR /app/apps/web

EXPOSE 5173

CMD ["node", "server.js"]
