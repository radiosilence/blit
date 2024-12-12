
module "letsencrypt" {
  source = "../letsencrypt"
  zone   = var.zone
  count  = contains(var.modules, "letsencrypt") ? 1 : 0
}

module "fastmail" {
  source = "../fastmail"
  zone   = var.zone
  count  = contains(var.modules, "fastmail") ? 1 : 0
}

module "github" {
  source = "../github"
  zone   = var.zone
  count  = contains(var.modules, "github") ? 1 : 0
}

module "bluesky" {
  source = "../bluesky"
  zone   = var.zone
  count  = contains(var.modules, "bluesky") ? 1 : 0
}
