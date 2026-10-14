# Multi-stage Dockerfile for Collaborative Editor
FROM node:24-alpine AS builder
WORKDIR /app

# Install root dependencies
COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts index.html ./
COPY public ./public
COPY src ./src

RUN npm ci
RUN npm run build

# Production runtime stage
FROM node:24-alpine AS runtime
WORKDIR /app

# Install production backend dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy backend server and built frontend from builder stage
COPY backend/server.js ./server.js
COPY --from=builder /app/dist ./dist

# Create persistent storage folder for Yjs LevelDB
RUN mkdir -p ./data

ENV PORT=1234
ENV HOST=0.0.0.0
ENV YPERSISTENCE=./data
ENV SERVE_FRONTEND=true

EXPOSE 1234

CMD ["node", "server.js"]
