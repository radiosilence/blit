terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  required_version = ">= 1.2.0"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Blit Zone
resource "blit_cloudflare_zone" "zone" {
  account_id = var.cloudflare_account_id
  zone       = var.blit_domain
}

# Blit Let's Encrypt
module "blit_letsencrypt" {
  source  = "./modules/letsencrypt"
  zone_id = blit_cloudflare_zone.zone.id
  domain  = var.blit_domain
}

# Blit Fastmail
module "blit_fastmail" {
  source  = "./modules/fastmail"
  zone_id = blit_cloudflare_zone.zone.id
  domain  = var.blit_domain
}

# Blit GitHub
module "blit_github" {
  source  = "./modules/github"
  zone_id = blit_cloudflare_zone.zone.id
  domain  = var.blit_domain
}


# Blit Bluesky
module "blit_bluesky" {
  source  = "./modules/bluesky"
  zone_id = blit_cloudflare_zone.zone.id
}

# Buttholes Zone
resource "buttholes_cloudflare_zone" "zone" {
  account_id = var.cloudflare_account_id
  zone       = var.buttholes_domain
}

# Buttholes Let's Encrypt

# Buttholes Fastmail
module "buttholes_fastmail" {
  source  = "./modules/fastmail"
  zone_id = buttholes_cloudflare_zone.zone.id
  domain  = var.buttholes_domain
}

# Buttholes Bsky
module "buttholes_bluesky" {
  source  = "./modules/bluesky"
  zone_id = buttholes_cloudflare_zone.zone.id
}
