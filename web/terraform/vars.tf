variable "region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "eu-west-2"
}

variable "instance_type" {
  description = "The EC2 instance type to use"
  type        = string
  default     = "t3.nano"

}
variable "ami_id" {
  description = "The AMI ID to use for the instance"
  type        = string
}

variable "hostname" {
  description = "The hostname to use for the CloudFront distribution"
  type        = string
  default     = "blit.cc"
}

variable "tag_name" {
  description = "The name tag to apply to resources"
  type        = string
  default     = "blit-web"
}

variable "price_class" {
  description = "The price class to use for the CloudFront distribution"
  type        = string
  default     = "PriceClass_100"
}

variable "certificate_arn" {
  description = "The ARN of the ACM certificate to use for the CloudFront distribution"
  type        = string
}
