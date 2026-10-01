# -------------------------------------------------------------
# 1. Base & Dependencies Stage
# -------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# -------------------------------------------------------------
# 2. Builder Stage
# -------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
# Ensure SQL migration files are bundled into compiled dist
RUN cp -r src/database/migrations dist/database/

# -------------------------------------------------------------
# 3. Production Runner Stage
# -------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Security: Non-root execution
USER node

EXPOSE 3050
ENV PORT=3050

CMD ["node", "dist/app.js"]
