# Dockerfile for Standalone NestJS API Service (apix)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY ./ ./
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/dist ./dist
RUN mkdir -p upload/static
RUN npm ci --only=production --legacy-peer-deps

EXPOSE 3000
ENV PORT=3000
ENV PREFIX=api

CMD ["node", "dist/main.js"]
