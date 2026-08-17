# Dockerfile for Email Service (part of monorepo)
# Build from monorepo root context:
# docker build -t blockvibe-email-service -f services/email-service/Dockerfile .

FROM node:22.17.0-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy monorepo files
COPY . .

# Install dependencies and build
RUN corepack enable pnpm && corepack prepare pnpm@10.5.0 --activate && pnpm i --frozen-lockfile
RUN pnpm --filter @blockvibe/email-contracts build
RUN pnpm --filter @blockvibe/email-service build

EXPOSE 4001

CMD ["node", "services/email-service/dist/server.js"]
