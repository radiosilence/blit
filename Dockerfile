FROM node:24 AS base
RUN adduser --disabled-password --shell /bin/sh nano


FROM base AS builder

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build
RUN chown -R nano:nano /app/dist


FROM ghcr.io/radiosilence/nano-web:latest AS runner

COPY --from=builder /app/dist /public
COPY --from=base /etc/passwd /etc/passwd
COPY --from=base /etc/group /etc/group
USER nano
ENV PORT=3000
EXPOSE 3000
