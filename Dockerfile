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

# The build context is dist/ (`task docker:image`), not the repository root: this
# copies everything in the context into the directory nano-web serves. The first
# COPY fails a build from any context without a generated home page, so a build
# from the root cannot publish the checkout.
COPY index.html /public/index.html
COPY . /public
ENV PORT=3000
EXPOSE 3000
