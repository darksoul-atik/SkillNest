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

# Copy root configurations
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY apps/api/package.json apps/api/tsconfig.json apps/api/nest-cli.json ./apps/api/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/src ./packages/shared/src
COPY apps/api/src ./apps/api/src

# Build packages
RUN pnpm --filter @skillnest/shared build
RUN pnpm --filter @skillnest/api build

# ----------------------------------------------------
# Production Runner Stage
# ----------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Non-root user
USER node

# Copy build artifacts and dependencies
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --chown=node:node --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --chown=node:node --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --chown=node:node --from=builder /app/apps/api/dist ./apps/api/dist
COPY --chown=node:node --from=builder /app/apps/api/package.json ./apps/api/

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/main"]
