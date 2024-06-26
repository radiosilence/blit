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

variable "nd_server_ip" {
  description = "The IP address of the navidrome server"
  type        = string
}

variable "github_a_records" {
  description = "A map of GitHub Pages A records to create"
  type        = set(string)
  default     = ["185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153"]
}
