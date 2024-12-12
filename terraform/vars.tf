variable "cloudflare_api_token" {
  description = "The API token to use for the Cloudflare provider"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "The account ID of the Cloudflare account to use"
  type        = string
}

variable "blit_domain" {
  description = "The domain name for blit"
  type        = string
  default     = "blit.cc"
}

variable "buttholes_domain" {
  description = "The domain name buttholes"
  type        = string
  default     = "buttholes.live"
}

