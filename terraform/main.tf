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

# Blit Let's Encrypt
module "blit_letsencrypt" {
  source = "./modules/letsencrypt"
  zone   = var.blit_zone
}

# Blit Fastmail
module "blit_fastmail" {
  source = "./modules/fastmail"
  zone   = var.blit_zone
}

# Blit GitHub
module "blit_github" {
  source = "./modules/github"
  zone   = var.blit_zone
}

# Blit Bluesky
module "blit_bluesky" {
  source = "./modules/bluesky"
  zone   = var.blit_zone
}

# Buttholes

# Buttholes Let's Encrypt
module "buttholes_letsencrypt" {
  source = "./modules/letsencrypt"
  zone   = var.buttholes_zone
}

# Buttholes Fastmail
module "buttholes_fastmail" {
  source = "./modules/fastmail"
  zone   = var.buttholes_zone
}

# Buttholes Bsky
module "buttholes_bluesky" {
  source = "./modules/bluesky"
  zone   = var.buttholes_zone
}
