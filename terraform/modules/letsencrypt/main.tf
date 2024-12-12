terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  required_version = ">= 1.9.8"
}

resource "cloudflare_dns_record" "record" {
  name    = var.domain
  proxied = false
  ttl     = 1
  type    = "CAA"
  zone_id = var.zone_id
  data {
    flags = 0
    tag   = "issue"
    value = "letsencrypt.org"
  }
}

