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

# Blit

# Blit Zone
resource "cloudflare_zone" "blit" {
  account_id = var.cloudflare_account_id
  zone       = var.blit_domain
}

locals {
  blit_zone = {
    id   = cloudflare_zone.blit.id
    name = var.blit_domain
  }
}

# Blit Let's Encrypt
module "blit_letsencrypt" {
  source = "./modules/letsencrypt"
  zone   = local.blit_zone
}

# Blit Fastmail
module "blit_fastmail" {
  source = "./modules/fastmail"
  zone   = local.blit_zone
}

# Blit GitHub
module "blit_github" {
  source = "./modules/github"
  zone   = local.blit_zone
}

# Blit Bluesky
module "blit_bluesky" {
  source = "./modules/bluesky"
  zone   = local.blit_zone
}

# Buttholes

# Buttholes Zone
resource "cloudflare_zone" "buttholes" {
  account_id = var.cloudflare_account_id
  zone       = var.buttholes_domain
}

locals {
  buttholes_zone = {
    id   = cloudflare_zone.blit.id
    name = var.blit_domain
  }
}

# Buttholes Let's Encrypt
module "buttholes_letsencrypt" {
  source = "./modules/letsencrypt"
  zone   = local.buttholes_zone
}

# Buttholes Fastmail
module "buttholes_fastmail" {
  source = "./modules/fastmail"
  zone   = local.buttholes_zone
}

# Buttholes Bsky
module "buttholes_bluesky" {
  source = "./modules/bluesky"
  zone   = local.buttholes_zone
}
