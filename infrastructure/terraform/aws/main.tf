terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "s3" {
    bucket         = "seo-platform-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "seo-platform-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "SEO Platform"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Module
module "vpc" {
  source = "../modules/vpc"

  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  private_subnets    = var.private_subnets
  public_subnets     = var.public_subnets
  database_subnets   = var.database_subnets
}

# EKS Module
module "eks" {
  source = "../modules/eks"

  environment        = var.environment
  cluster_name       = var.cluster_name
  cluster_version    = var.cluster_version
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_groups        = var.node_groups
}

# RDS PostgreSQL Module
module "rds" {
  source = "../modules/rds"

  environment          = var.environment
  identifier           = "seo-platform-postgres"
  engine_version       = "16.1"
  instance_class       = var.rds_instance_class
  allocated_storage    = var.rds_allocated_storage
  database_name        = "seo_platform"
  master_username      = var.rds_master_username
  vpc_id               = module.vpc.vpc_id
  database_subnet_ids  = module.vpc.database_subnet_ids
  allowed_cidr_blocks  = module.vpc.private_subnet_cidrs
  multi_az             = true
  backup_retention     = 30
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.environment}-redis-subnet-group"
  subnet_ids = module.vpc.database_subnet_ids
}

resource "aws_security_group" "redis" {
  name        = "${var.environment}-redis-sg"
  description = "Security group for Redis cluster"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = module.vpc.private_subnet_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-redis-sg"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.environment}-redis"
  replication_group_description = "Redis cluster for SEO Platform"
  engine                     = "redis"
  engine_version            = "7.0"
  node_type                 = var.redis_node_type
  num_cache_clusters        = 3
  port                      = 6379
  parameter_group_name      = "default.redis7"
  subnet_group_name         = aws_elasticache_subnet_group.redis.name
  security_group_ids        = [aws_security_group.redis.id]
  automatic_failover_enabled = true
  multi_az_enabled          = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  snapshot_retention_limit   = 7
  snapshot_window           = "03:00-05:00"
  maintenance_window        = "sun:05:00-sun:07:00"

  tags = {
    Name = "${var.environment}-redis"
  }
}

# DocumentDB (MongoDB)
resource "aws_docdb_subnet_group" "mongodb" {
  name       = "${var.environment}-docdb-subnet-group"
  subnet_ids = module.vpc.database_subnet_ids

  tags = {
    Name = "${var.environment}-docdb-subnet-group"
  }
}

resource "aws_security_group" "mongodb" {
  name        = "${var.environment}-mongodb-sg"
  description = "Security group for DocumentDB cluster"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = module.vpc.private_subnet_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-mongodb-sg"
  }
}

resource "aws_docdb_cluster" "mongodb" {
  cluster_identifier      = "${var.environment}-mongodb"
  engine                  = "docdb"
  master_username         = var.mongodb_master_username
  master_password         = var.mongodb_master_password
  db_subnet_group_name    = aws_docdb_subnet_group.mongodb.name
  vpc_security_group_ids  = [aws_security_group.mongodb.id]
  backup_retention_period = 30
  preferred_backup_window = "03:00-05:00"
  skip_final_snapshot     = false
  final_snapshot_identifier = "${var.environment}-mongodb-final-snapshot"
  storage_encrypted       = true
  enabled_cloudwatch_logs_exports = ["audit", "profiler"]

  tags = {
    Name = "${var.environment}-mongodb"
  }
}

resource "aws_docdb_cluster_instance" "mongodb" {
  count              = 3
  identifier         = "${var.environment}-mongodb-${count.index}"
  cluster_identifier = aws_docdb_cluster.mongodb.id
  instance_class     = var.mongodb_instance_class

  tags = {
    Name = "${var.environment}-mongodb-${count.index}"
  }
}

# MSK (Kafka)
resource "aws_msk_cluster" "kafka" {
  cluster_name           = "${var.environment}-kafka"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = 3

  broker_node_group_info {
    instance_type   = var.kafka_instance_type
    client_subnets  = module.vpc.private_subnet_ids
    security_groups = [aws_security_group.kafka.id]
    storage_info {
      ebs_storage_info {
        volume_size = var.kafka_volume_size
      }
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
    encryption_at_rest_kms_key_arn = aws_kms_key.kafka.arn
  }

  configuration_info {
    arn      = aws_msk_configuration.kafka.arn
    revision = aws_msk_configuration.kafka.latest_revision
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.kafka.name
      }
    }
  }

  tags = {
    Name = "${var.environment}-kafka"
  }
}

resource "aws_security_group" "kafka" {
  name        = "${var.environment}-kafka-sg"
  description = "Security group for MSK cluster"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 9092
    to_port     = 9098
    protocol    = "tcp"
    cidr_blocks = module.vpc.private_subnet_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-kafka-sg"
  }
}

resource "aws_msk_configuration" "kafka" {
  name              = "${var.environment}-kafka-config"
  kafka_versions    = ["3.5.1"]
  server_properties = <<PROPERTIES
auto.create.topics.enable=true
default.replication.factor=3
min.insync.replicas=2
num.io.threads=8
num.network.threads=5
num.partitions=3
num.replica.fetchers=2
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
socket.send.buffer.bytes=102400
unclean.leader.election.enable=false
zookeeper.session.timeout.ms=18000
PROPERTIES
}

resource "aws_kms_key" "kafka" {
  description = "KMS key for Kafka encryption"
  tags = {
    Name = "${var.environment}-kafka-kms"
  }
}

resource "aws_cloudwatch_log_group" "kafka" {
  name              = "/aws/msk/${var.environment}-kafka"
  retention_in_days = 30

  tags = {
    Name = "${var.environment}-kafka-logs"
  }
}

# S3 Module
module "s3" {
  source = "../modules/s3"

  environment = var.environment
  buckets = {
    assets = {
      name = "${var.environment}-seo-platform-assets"
      versioning = true
    }
    backups = {
      name = "${var.environment}-seo-platform-backups"
      versioning = true
      lifecycle_rules = [{
        id      = "delete-old-backups"
        enabled = true
        expiration_days = 90
      }]
    }
    logs = {
      name = "${var.environment}-seo-platform-logs"
      versioning = false
      lifecycle_rules = [{
        id      = "delete-old-logs"
        enabled = true
        expiration_days = 30
      }]
    }
  }
}

# EFS for ML models
resource "aws_efs_file_system" "ml_models" {
  creation_token = "${var.environment}-ml-models"
  encrypted      = true

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  tags = {
    Name = "${var.environment}-ml-models"
  }
}

resource "aws_efs_mount_target" "ml_models" {
  count           = length(module.vpc.private_subnet_ids)
  file_system_id  = aws_efs_file_system.ml_models.id
  subnet_id       = module.vpc.private_subnet_ids[count.index]
  security_groups = [aws_security_group.efs.id]
}

resource "aws_security_group" "efs" {
  name        = "${var.environment}-efs-sg"
  description = "Security group for EFS"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    cidr_blocks = module.vpc.private_subnet_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-efs-sg"
  }
}
