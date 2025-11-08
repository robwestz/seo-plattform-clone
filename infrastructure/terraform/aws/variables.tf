variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# VPC Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "database_subnets" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
}

# EKS Variables
variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "seo-platform"
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "node_groups" {
  description = "EKS node groups configuration"
  type = map(object({
    desired_size   = number
    min_size       = number
    max_size       = number
    instance_types = list(string)
    capacity_type  = string
    disk_size      = number
  }))
  default = {
    general = {
      desired_size   = 3
      min_size       = 3
      max_size       = 10
      instance_types = ["t3.xlarge"]
      capacity_type  = "ON_DEMAND"
      disk_size      = 100
    }
    compute = {
      desired_size   = 2
      min_size       = 2
      max_size       = 20
      instance_types = ["c5.2xlarge"]
      capacity_type  = "SPOT"
      disk_size      = 100
    }
    ml = {
      desired_size   = 2
      min_size       = 2
      max_size       = 10
      instance_types = ["p3.2xlarge"]
      capacity_type  = "ON_DEMAND"
      disk_size      = 200
    }
  }
}

# RDS Variables
variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 500
}

variable "rds_master_username" {
  description = "RDS master username"
  type        = string
  default     = "seo_admin"
  sensitive   = true
}

# Redis Variables
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.r6g.large"
}

# MongoDB Variables
variable "mongodb_instance_class" {
  description = "DocumentDB instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "mongodb_master_username" {
  description = "DocumentDB master username"
  type        = string
  default     = "seo_admin"
  sensitive   = true
}

variable "mongodb_master_password" {
  description = "DocumentDB master password"
  type        = string
  sensitive   = true
}

# Kafka Variables
variable "kafka_instance_type" {
  description = "MSK broker instance type"
  type        = string
  default     = "kafka.m5.large"
}

variable "kafka_volume_size" {
  description = "MSK broker volume size in GB"
  type        = number
  default     = 500
}
