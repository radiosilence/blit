terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

resource "cloudflare_record" "verify_github" {
  type    = "TXT"
  name    = var.github_verify.name
  content = "\"${var.github_verify.value}\""
  zone_id = var.zone_id
}

resource "cloudflare_record" "github_pages_a" {
  name     = var.domain
  proxied  = false
  ttl      = 1
  type     = "A"
  content  = each.key
  for_each = var.github_a_records
  zone_id  = cloudflare_zone_blit.zone.id
}

resource "cloudflare_record" "github_pages_a_www" {
  name    = "www.${var.domain}"
  proxied = false
  ttl     = 1
  type    = "CNAME"
  content = var.domain
  zone_id = cloudflare_zone_blit.zone.id
}
