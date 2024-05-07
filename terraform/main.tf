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

resource "cloudflare_record" "record_nd_a" {
  name    = "nd"
  proxied = true
  ttl     = 1
  type    = "A"
  value   = var.nd_server_ip
  zone_id = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_amazon_caa" {
  name    = "blit.cc"
  proxied = false
  ttl     = 1
  type    = "CAA"
  zone_id = cloudflare_zone.zone.id
  data {
    flags = 0
    tag   = "issue"
    value = "amazon.com"
  }
}

resource "cloudflare_record" "record_letsencrypt_caa" {
  name    = "blit.cc"
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
  name    = "_github-pages-challenge-radiosilence"
  value   = "963852554fb760462512037c38879e"
  zone_id = cloudflare_zone.zone.id
}

resource "cloudflare_record" "github_pages_a" {
  name     = "blit.cc"
  proxied  = false
  ttl      = 1
  type     = "A"
  value    = each.key
  for_each = var.github_a_records
  zone_id  = cloudflare_zone.zone.id
}
resource "cloudflare_record" "github_pages_a_www" {
  name     = "www.blit.cc"
  proxied  = false
  ttl      = 1
  type     = "A"
  value    = each.key
  for_each = var.github_a_records
  zone_id  = cloudflare_zone.zone.id
}


resource "cloudflare_record" "record_fm1_dk" {
  name    = "fm1._domainkey"
  proxied = false
  ttl     = 1
  type    = "CNAME"
  value   = "fm1.blit.cc.dkim.fmhosted.com"
  zone_id = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_fm2_dk" {
  name    = "fm2._domainkey"
  proxied = false
  ttl     = 1
  type    = "CNAME"
  value   = "fm2.blit.cc.dkim.fmhosted.com"
  zone_id = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_fm3_dk" {
  name    = "fm3._domainkey"
  proxied = false
  ttl     = 1
  type    = "CNAME"
  value   = "fm3.blit.cc.dkim.fmhosted.com"
  zone_id = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_fm_mx2" {
  name     = "blit.cc"
  priority = 20
  ttl      = 1
  type     = "MX"
  value    = "in2-smtp.messagingengine.com"
  zone_id  = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_fm_mx1" {
  name     = "blit.cc"
  priority = 10
  ttl      = 1
  type     = "MX"
  value    = "in1-smtp.messagingengine.com"
  zone_id  = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_bluesky_atproto" {
  name    = "_atproto"
  ttl     = 1
  type    = "TXT"
  value   = "did=did:plc:d32vuqlfqjttwbckkxgxgbgl"
  zone_id = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_fm_spf" {
  name    = "blit.cc"
  ttl     = 1
  type    = "TXT"
  value   = "v=spf1 include:spf.messagingengine.com ?all"
  zone_id = cloudflare_zone.zone.id
}

resource "cloudflare_record" "record_fm_dmarc" {
  name    = "_dmarc"
  ttl     = 1
  type    = "TXT"
  value   = "v=DMARC1; p=none;"
  zone_id = cloudflare_zone.zone.id
}

