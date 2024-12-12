resource "cloudflare_record" "record_bluesky_atproto" {
  name    = "_atproto"
  ttl     = 1
  type    = "TXT"
  content = "\"did=${var.bsky_did}\""
  zone_id = var.zone_id
}

