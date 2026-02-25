# syntax=docker/dockerfile:1.2
FROM oven/bun:latest AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun run build

FROM ghcr.io/radiosilence/nano-web:latest AS runner
COPY --from=builder /app/dist /public
ENV PORT=3000
EXPOSE 3000
