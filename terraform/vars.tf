variable "cloudflare_api_token" {
  description = "The API token to use for the Cloudflare provider"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "The account ID of the Cloudflare account to use"
  type        = string
}
variable "cloudflare_zone" {
  description = "The domain name of the Cloudflare zone to use"
  type        = string
}

variable "root_cname_domain" {
  description = "The domain name to use for the root CNAME record"
  type        = string
}

variable "github_a_records" {
  description = "A map of GitHub Pages A records to create"
  type        = set(string)
  default     = ["185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153"]
}

variable "bsky_did" {
  description = "The DID of the Bluesky agent to use"
  type        = string
  default     = "did:plc:d32vuqlfqjttwbckkxgxgbgl"
}

variable "github_verify" {
  description = "The GitHub Pages verification string to use"
  type = object({
    name  = string
    value = string
  })
  default = {
    name  = "_github-pages-challenge-radiosilence"
    value = "963852554fb760462512037c38879e"
  }
}

variable "fm_dkim_domain" {
  description = "The domain name to use for the Fastmail DKIM records"
  type        = string
  default     = "spf.messagingengine.com"
}
