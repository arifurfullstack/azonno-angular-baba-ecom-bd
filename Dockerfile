FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy root files
COPY package.json ./

# Copy apix
COPY apix/package*.json ./apix/
RUN cd apix && npm ci --legacy-peer-deps
COPY apix/ ./apix/
RUN cd apix && npm run build

# Copy adminx
COPY adminx/package*.json ./adminx/
RUN cd adminx && npm ci --legacy-peer-deps
COPY adminx/ ./adminx/
RUN cd adminx && npm run build

# Copy themex
COPY themex/package*.json ./themex/
RUN cd themex && npm ci --legacy-peer-deps
COPY themex/ ./themex/
RUN cd themex && npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy root package.json and start-unified script
COPY package.json start-unified.js ./

# Copy built apix
COPY --from=builder /app/apix/package*.json ./apix/
COPY --from=builder /app/apix/dist ./apix/dist
RUN mkdir -p apix/upload/static
RUN cd apix && npm ci --only=production --legacy-peer-deps

# Copy built adminx static files
COPY --from=builder /app/adminx/dist ./adminx/dist

# Copy built themex
COPY --from=builder /app/themex/package*.json ./themex/
COPY --from=builder /app/themex/dist ./themex/dist
RUN cd themex && npm ci --only=production --legacy-peer-deps

EXPOSE 4220
ENV PORT=4220
ENV INTERNAL_API_PORT=3000

CMD ["node", "start-unified.js"]
