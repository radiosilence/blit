# blit.cc personal site

![publish-web-container](https://github.com/radiosilence/blit/actions/workflows/publish-web-container.yml/badge.svg)

## What this does

Basically this builds and deploys blit.cc

### Web ([blit.cc](https://blit.cc))

- Created with [TanStack Start](https://tanstack.com/start)
- Packaged as a docker image, hosted on a local microk8s and accessible via CloudFlare Tunnel.
- Uses my project [nano-web](https://github.com/radiosilence/nano-web) to serve files.
- Deployed using Pulumi.
