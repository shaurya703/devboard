# Multi-stage build for the DevBoard API.
# Build context is the repo root (see docker-compose.yml) so the
# @devboard/shared workspace is available to compile against.
#
# Uses Debian slim (not alpine) because Prisma's engines need OpenSSL; the
# slim image is Prisma's recommended base and avoids musl/libssl detection
# failures in the migrate engine.
FROM node:20-slim AS builder
WORKDIR /app

# OpenSSL is required by Prisma's query + schema engines.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

# Install workspace deps using the root lockfile + each package manifest.
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci --workspace @devboard/shared --workspace @devboard/server --include-workspace-root

# Build shared, then generate Prisma client, then build the server.
COPY shared ./shared
RUN npm run build --workspace @devboard/shared
COPY server ./server
RUN npm run prisma:generate --workspace @devboard/server \
 && npm run build --workspace @devboard/server

# --- Runtime image ---
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/prisma ./server/prisma

WORKDIR /app/server
EXPOSE 4000
# Apply migrations then boot. Safe to run on every container start.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
