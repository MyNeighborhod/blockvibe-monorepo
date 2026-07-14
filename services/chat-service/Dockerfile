# Dockerfile for Chat Service (part of monorepo)
# Build from monorepo root context:
# docker build -t blockvibe-chat-service -f services/chat-service/Dockerfile .

FROM node:22.17.0-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy monorepo files
COPY . .

# Install dependencies and build
RUN corepack enable pnpm && corepack prepare pnpm@10.5.0 --activate && pnpm i --frozen-lockfile
RUN pnpm --filter @blockvibe/chat-service build

EXPOSE 4002

CMD ["node", "services/chat-service/dist/server.js"]
