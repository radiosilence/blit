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
  content = "\"${var.github_verify.value}\""
  zone_id = cloudflare_zone.zone.id
}

resource "cloudflare_record" "github_pages_a" {
  name     = var.cloudflare_zone
  proxied  = false
  ttl      = 1
  type     = "A"
  content  = each.value
  for_each = var.github_a_records
  zone_id  = cloudflare_zone.zone.id
}

resource "cloudflare_record" "github_pages_a_www" {
  name    = "www.${var.cloudflare_zone}"
  proxied = false
  ttl     = 1
  type    = "CNAME"
  content = var.cloudflare_zone
  zone_id = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_fm_dk" {
  for_each = toset(["fm1", "fm2", "fm3", "fm4"])
  name     = "${each.value}._domainkey"
  proxied  = false
  ttl      = 1
  type     = "CNAME"
  content  = "${each.value}.${var.cloudflare_zone}.dkim.fmhosted.com"
  zone_id  = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_fm_mx" {
  for_each = toset([
    { name = "in1", priority = 10 },
    { name = "in2", priority = 20 },
  ])
  name     = var.cloudflare_zone
  priority = each.value.priority
  ttl      = 1
  type     = "MX"
  content  = "${each.value.name}-smtp.messagingengine.com"
  zone_id  = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_bluesky_atproto" {
  name    = "_atproto"
  ttl     = 1
  type    = "TXT"
  content = "\"did=${var.bsky_did}\""
  zone_id = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_fm_spf" {
  name    = var.cloudflare_zone
  ttl     = 1
  type    = "TXT"
  content = "\"v=spf1 include:${var.fm_dkim_domain} ?all\""
  zone_id = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_fm_dmarc" {
  name    = "_dmarc"
  ttl     = 1
  type    = "TXT"
  content = "\"v=DMARC1; p=none;\""
  zone_id = cloudflare_zone.zone.id
}

