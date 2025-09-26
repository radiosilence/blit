FROM node:24 AS base
RUN adduser --disabled-password --shell /bin/sh nano

FROM base AS builder

WORKDIR /app
COPY . .
RUN npm run install

ENV NODE_ENV=production
RUN ls -l ./node_modules/@inlang/
RUN cat ./node_modules/@inlang/plugin-message-format/dist/index.js
RUN npm run build
RUN chown -R nano:nano /app/dist

FROM ghcr.io/radiosilence/nano-web:latest AS runner
COPY --from=builder /app/dist/client /public
COPY --from=base /etc/passwd /etc/passwd
COPY --from=base /etc/group /etc/group

USER nano

ENV PORT=3000
EXPOSE 3000
