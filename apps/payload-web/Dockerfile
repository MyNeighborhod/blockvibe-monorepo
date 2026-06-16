# Next.js / Payload CMS Dockerfile for Monorepo Workspace
# Must be built with context at the monorepo root:
# docker build -t blockvibe-app:latest -f apps/payload-web/Dockerfile .

FROM node:22.17.0-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy all files from the monorepo root
COPY . .

# Install dependencies via pnpm
RUN corepack enable pnpm && corepack prepare pnpm@10.5.0 --activate && pnpm i --frozen-lockfile

# Disables Next.js telemetry, set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV DATABASE_URL postgres://postgres:postgres@localhost:5432/placeholder
ENV PAYLOAD_SECRET placeholder

# Build the payload-web application
RUN pnpm --filter payload-web build

# Production runner image
FROM node:22.17.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output from builder
COPY --from=builder /app/apps/payload-web/.next/standalone ./
COPY --from=builder /app/apps/payload-web/public ./apps/payload-web/public
COPY --from=builder /app/apps/payload-web/.next/static ./apps/payload-web/.next/static

USER nextjs

EXPOSE 3000

# Run Next.js server using the monorepo entry point
CMD HOSTNAME="0.0.0.0" node apps/payload-web/server.js
