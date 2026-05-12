# syntax=docker/dockerfile:1.2
FROM node:24-alpine AS deps
WORKDIR /app
RUN npm install -g --ignore-scripts=false @endevco/aube
COPY package.json aube-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/aube/store \
    aube ci

FROM deps AS builder
COPY . .
RUN aube run build

FROM ghcr.io/radiosilence/nano-web:latest AS runner
COPY --from=builder /app/dist/client /public
ENV PORT=3000
EXPOSE 3000
