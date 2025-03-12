FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
# Install dependencies based on the preferred package manager
COPY package.json  ./
RUN bun i

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app  
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Run the stuff
FROM ghcr.io/radiosilence/nano-web:latest AS runner
COPY --from=builder /app/dist /public/