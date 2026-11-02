# syntax=docker/dockerfile:1
# =====================================================================
# Immagine di produzione: sito statico (Astro) + /api/form (AWS SES).
# HTTPS e dominio li gestisce Caddy (docker-compose.yml, label caddy.*).
# =====================================================================

# ── 1. Build del sito ──────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# I form inviano al server di questa immagine, che inoltra via SES.
ARG PUBLIC_FORM_ENDPOINT=/api/form
ENV PUBLIC_FORM_ENDPOINT=$PUBLIC_FORM_ENDPOINT
RUN npm run build

# ── 2. Dipendenze del server (solo l'SDK SES) ──────────────────────
FROM node:22-alpine AS server-deps
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --omit=dev --no-audit --no-fund --no-package-lock

# ── 3. Runtime ─────────────────────────────────────────────────────
FROM node:22-alpine
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/*.mjs server/package.json ./server/
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz >/dev/null || exit 1
CMD ["node", "server/index.mjs"]
