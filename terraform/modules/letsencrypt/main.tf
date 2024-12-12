resource "cloudflare_record" "record_letsencrypt_caa" {
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

