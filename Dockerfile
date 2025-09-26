FROM oven/bun:alpine AS base
RUN apk add bash
RUN adduser --disabled-password --shell /bin/sh nano
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=base /etc/group /etc/group
COPY --from=base /etc/passwd /etc/passwd
COPY . .

ENV NODE_ENV=production
RUN bun run build
RUN chown -R nano:nano /app/dist

FROM ghcr.io/radiosilence/nano-web:latest AS runner
COPY --from=builder /app/dist/client /public
COPY --from=base /etc/passwd /etc/passwd
COPY --from=base /etc/group /etc/group

USER nano

ENV PORT=3000
EXPOSE 3000
