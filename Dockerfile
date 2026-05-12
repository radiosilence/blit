# syntax=docker/dockerfile:1.2
FROM ghcr.io/radiosilence/nano-web:latest
COPY dist/client /public
ENV PORT=3000
EXPOSE 3000
