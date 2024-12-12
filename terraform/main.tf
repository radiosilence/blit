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


resource "cloudflare_zone_blit" "zone" {
  account_id = var.cloudflare_account_id
  zone       = var.domain_blit
}


resource "cloudflare_zone_buttholes" "zone" {
  account_id = var.cloudflare_account_id
  zone       = var.domain_buttholes
}
