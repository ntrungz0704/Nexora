FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY prisma ./prisma/

RUN npm ci --ignore-scripts

COPY tsconfig.base.json ./
COPY packages/config ./packages/config/
COPY packages/shared ./packages/shared/
COPY apps/api ./apps/api/

RUN npx prisma generate
RUN npm run build -w @nexora/config && npm run build -w @nexora/shared && npm run build -w @nexora/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --omit=dev --ignore-scripts --workspace=@nexora/api --workspace=@nexora/shared --workspace=@nexora/config

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY prisma ./prisma/

EXPOSE 3000
CMD ["node", "apps/api/dist/server.js"]
