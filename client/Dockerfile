# Build the SPA, then serve the static bundle with nginx.
# Build context is the repo root so @devboard/shared is available.
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci --workspace @devboard/shared --workspace @devboard/client --include-workspace-root

COPY shared ./shared
RUN npm run build --workspace @devboard/shared
COPY client ./client
RUN npm run build --workspace @devboard/client

# --- Runtime: nginx serving the SPA ---
FROM nginx:1.27-alpine AS runner
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
