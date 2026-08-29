# ─────────────────────────────────────────────────────────────
# SignalMDM Frontend — Multi-stage Dockerfile
# Stage 1: Build Vite/React app
# Stage 2: Serve via Express (serverClient.js)
# ─────────────────────────────────────────────────────────────

# ── Build Stage ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (cache layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .

# Set API URL for the build (will be baked into the JS bundle)
ARG VITE_API_URL=http://localhost:8000/api/v1
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

RUN npm run build

# ── Runtime Stage ───────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy package files and install production-only deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built dist and server
COPY --from=builder /app/dist ./dist
COPY serverClient.js ./

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:3030 || exit 1

EXPOSE 3030

CMD ["node", "serverClient.js"]
