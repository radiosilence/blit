# blit.cc personal infra/site

![deploy-cloudflare](https://github.com/radiosilence/blit/actions/workflows/deploy-cloudflare.yml/badge.svg)
![publish-web-container](https://github.com/radiosilence/blit/actions/workflows/publish-web-container.yml/badge.svg)

## What this does

Basically this deploys my DNS and infrastructure for blit.cc and navidrome instance, designed to be best practice, GitOps and IaC first.

There are some k8s configs in `./k8s` for a microk8s server running on a personal instance, which are applied/updated via Github Actions kubectl CLI.

### DNS

- Hosted with Cloudflare
- Deployed using Terraform Cloud, config in `./terraform`.

### Web ([blit.cc](https://blit.cc))

- `./web`
- Created with [astro](https://astro.build/)
- Packaged as nanovm unikernel AWS AMI, hosted as an EC2 instance.
- Uses my project [nano-web](https://github.com/radiosilence/nano-web) to serve files.
- CloudFront used to terminate SSL and as CDN
- Deployed using Terraform Cloud, config in `./web/terraform`.
- Also runs in the microk8s cluster as a backup, using the containerised version of nano-web.
