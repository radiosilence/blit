variable "zone_id" {
  description = "The Cloudflare zone ID to use"
  type        = string
}

variable "bsky_did" {
  description = "The DID of the Bluesky agent to use"
  type        = string
  default     = "did:plc:d32vuqlfqjttwbckkxgxgbgl"
}
