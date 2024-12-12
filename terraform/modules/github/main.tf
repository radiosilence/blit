resource "cloudflare_record" "verify" {
  type    = "TXT"
  name    = var.github_verify.name
  content = "\"${var.github_verify.value}\""
  zone_id = var.zone_id
}

resource "cloudflare_record" "a" {
  name     = var.domain
  proxied  = false
  ttl      = 1
  type     = "A"
  content  = each.key
  for_each = var.github_a_records
  zone_id  = cloudflare_zone_blit.zone.id
}

resource "cloudflare_record" "a_www" {
  name    = "www.${var.domain}"
  proxied = false
  ttl     = 1
  type    = "CNAME"
  content = var.domain
  zone_id = cloudflare_zone_blit.zone.id
}
