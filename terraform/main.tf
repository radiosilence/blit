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
module "blit_letsencrypt" {
  source = "./modules/letsencrypt"
  zone   = var.blit_zone
}

module "blit_fastmail" {
  source = "./modules/fastmail"
  zone   = var.blit_zone
}

module "blit_github" {
  source = "./modules/github"
  zone   = var.blit_zone
}

module "blit_bluesky" {
  source = "./modules/bluesky"
  zone   = var.blit_zone
}

# buttholes.live
module "buttholes_bluesky" {
  source = "./modules/bluesky"
  zone   = var.buttholes_zone
}

module "buttholes_fastmail" {
  source = "./modules/fastmail"
  zone   = var.buttholes_zone
}

# radiosilence.dev
module "radiosilence_bluesky" {
  source = "./modules/bluesky"
  zone   = var.radiosilence_zone
}

module "radiosilence_fastmail" {
  source = "./modules/fastmail"
  zone   = var.radiosilence_zone
}
