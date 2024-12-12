terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  required_version = ">= 1.8.2"

  cloud {
    organization = "radiosilence"
    workspaces {
      name = "blit-cloudflare"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# blit.cc
module "blit" {
  source = "./modules/zone"
  zone   = var.blit_zone
  modules = [
    "letsencrypt",
    "fastmail",
    "github",
    "bluesky",
  ]
}

resource "cloudflare_record" "bambi" {
  name    = "bambi.${var.blit_zone.name}"
  ttl     = 1
  type    = "A"
  content = var.bambi_ip
  proxied = true
  zone_id = var.blit_zone.id
}

resource "cloudflare_record" "bambic" {
  name    = "bambic.${var.blit_zone.name}"
  ttl     = 1
  type    = "CNAME"
  content = var.bambi_cname
  proxied = true
  zone_id = var.blit_zone.id
}

# buttholes.live
module "buttholes" {
  source = "./modules/zone"
  zone   = var.buttholes_zone
  modules = [
    "fastmail",
    "bluesky",
  ]
}

# radiosilence.dev
module "radiosilence" {
  source = "./modules/zone"
  zone   = var.radiosilence_zone
  modules = [
    "bluesky",
    "fastmail",
  ]
}
