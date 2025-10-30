# syntax=docker/dockerfile:1.2
FROM oven/bun:latest AS base
RUN adduser --disabled-password --shell /bin/sh nano

FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun run build
RUN chown -R nano:nano /app/dist

FROM ghcr.io/radiosilence/nano-web:latest AS runner
COPY --from=builder /app/dist /public
COPY --from=base /etc/passwd /etc/passwd
COPY --from=base /etc/group /etc/group
USER nano
ENV PORT=3000
EXPOSE 3000
