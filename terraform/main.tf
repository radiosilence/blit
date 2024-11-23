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


resource "cloudflare_zone" "zone" {
  account_id = var.cloudflare_account_id
  zone       = var.cloudflare_zone
}

resource "cloudflare_record" "record_letsencrypt_caa" {
  name    = var.cloudflare_zone
  proxied = false
  ttl     = 1
  type    = "CAA"
  zone_id = cloudflare_zone.zone.id
  data {
    flags = 0
    tag   = "issue"
    value = "letsencrypt.org"
  }
}

resource "cloudflare_record" "verify_github" {
  type    = "TXT"
  name    = var.github_verify.name
  content = var.github_verify.value
  zone_id = cloudflare_zone.zone.id
}

resource "cloudflare_record" "github_pages_a" {
  name     = var.cloudflare_zone
  proxied  = false
  ttl      = 1
  type     = "A"
  content  = each.key
  for_each = var.github_a_records
  zone_id  = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_fm_dk" {
  for_each = toset(["fm1", "fm2", "fm3", "fm4"])
  name     = "${each.key}._domainkey"
  proxied  = false
  ttl      = 1
  type     = "CNAME"
  content  = "${each.key}.${var.cloudflare_zone}.dkim.fmhosted.com"
  zone_id  = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_bluesky_atproto" {
  name    = "_atproto"
  ttl     = 1
  type    = "TXT"
  content = "did=${var.bluesky_did}"
  zone_id = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_fm_spf" {
  name    = var.cloudflare_zone
  ttl     = 1
  type    = "TXT"
  content = "v=spf1 include:${var.fastmail_dkim_domain} ?all"
  zone_id = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_fm_dmarc" {
  name    = "_dmarc"
  ttl     = 1
  type    = "TXT"
  content = "v=DMARC1; p=none;"
  zone_id = cloudflare_zone.zone.id
}

