# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# The Ark Victory Church - ark-web production image (Next.js standalone)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS base
# Optional: behind a TLS-intercepting corporate proxy, pass its CA bundle as a build secret:
#   docker build --secret id=extra_ca,src=/etc/ssl/certs/ca-certificates.crt .
RUN --mount=type=secret,id=extra_ca,required=false \
    cp /etc/ssl/certs/ca-certificates.crt /tmp/ca-orig.crt && \
    if [ -f /run/secrets/extra_ca ]; then cat /run/secrets/extra_ca >> /etc/ssl/certs/ca-certificates.crt; fi && \
    apk add --no-cache libc6-compat openssl && \
    cp /tmp/ca-orig.crt /etc/ssl/certs/ca-certificates.crt && rm /tmp/ca-orig.crt
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- dependencies ----------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN --mount=type=secret,id=extra_ca,required=false \
    if [ -f /run/secrets/extra_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca; fi && npm ci

# --- build -----------------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time placeholders only; real values are injected at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    AUTH_SECRET="build-time-placeholder-secret-not-used-at-runtime" \
    SITE_URL="https://thearkvictorychurch.com"
RUN --mount=type=secret,id=extra_ca,required=false \
    if [ -f /run/secrets/extra_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca; fi && \
    npx prisma generate && npm run build

# --- migrations runner (has the Prisma CLI) --------------------------------
FROM base AS migrate
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY package.json ./
CMD ["npx", "prisma", "migrate", "deploy"]

# --- runtime ---------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
