resource "cloudflare_record" "record_fm_mx" {
  for_each = tomap({
    "in1" = 10,
    "in2" = 20,
  })
  name     = var.domain
  priority = each.value
  ttl      = 1
  type     = "MX"
  content  = "${each.key}-smtp.messagingengine.com"
  zone_id  = var.zone_id
}

resource "cloudflare_record" "record_fm_dk" {
  for_each = toset(["fm1", "fm2", "fm3", "fm4"])
  name     = "${each.key}._domainkey"
  proxied  = false
  ttl      = 1
  type     = "CNAME"
  content  = "${each.key}.${var.domain}.dkim.fmhosted.com"
  zone_id  = var.zone_id
}


resource "cloudflare_record" "record_fm_spf" {
  name    = var.domain
  ttl     = 1
  type    = "TXT"
  content = "\"v=spf1 include:spf.messagingengine.com ?all\""
  zone_id = var.zone_id
}

resource "cloudflare_record" "record_fm_dmarc" {
  name    = "_dmarc"
  ttl     = 1
  type    = "TXT"
  content = "\"v=DMARC1; p=reject; rua=mailto:dmarc-agg@blit.cc\""
  zone_id = var.zone_id
}

