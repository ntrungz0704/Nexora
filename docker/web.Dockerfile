FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:3000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --ignore-scripts

COPY tsconfig.base.json ./
COPY packages/config ./packages/config/
COPY packages/shared ./packages/shared/
COPY apps/web ./apps/web/

RUN npm run build -w @nexora/config && npm run build -w @nexora/shared && npm run build -w @nexora/web

FROM nginx:1.27-alpine AS runner
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
