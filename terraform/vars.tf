variable "cloudflare_api_token" {
  description = "The API token to use for the Cloudflare provider"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "The account ID of the Cloudflare account to use"
  type        = string
}

variable "blit_zone" {
  description = "The zone ID for blit"
  type = object({
    name = string
    id   = string
  })
  default = {
    id   = "8aa9988e3df6b6a6ab4e4e6dbc3a2451"
    name = "blit.cc"
  }
}

variable "buttholes_zone" {
  description = "The domain name buttholes"
  type = object({
    name = string
    id   = string
  })
  default = {
    id   = "1115a1e5006523692d61e49e672f6df0"
    name = "buttholes.live"
  }
}
