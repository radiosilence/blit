# syntax=docker/dockerfile:1.2
FROM ghcr.io/radiosilence/nano-web:latest

# The constant half of the OCI labels; the Taskfile adds revision, created and
# version. image.source is the load-bearing one — it links the ghcr package back to
# the repository.
LABEL org.opencontainers.image.source="https://github.com/radiosilence/blit" \
  org.opencontainers.image.url="https://github.com/radiosilence/blit" \
  org.opencontainers.image.title="blit" \
  org.opencontainers.image.description="blit.cc personal site" \
  org.opencontainers.image.vendor="James Cleveland" \
  org.opencontainers.image.licenses=""

COPY dist /public
ENV PORT=3000
EXPOSE 3000
