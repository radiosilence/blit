resource "cloudflare_record" "record" {
  name    = "_atproto"
  ttl     = 1
  type    = "TXT"
  content = "\"did=${var.bsky_did}\""
  zone_id = var.zone_id
}

