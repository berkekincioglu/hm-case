# AWS Deployment Guide

## 📋 Overview

This guide covers deploying the Cryptocurrency Dashboard to AWS using modern, production-ready services.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    CloudFront (CDN)                       │  │
│  │  - Global edge locations                                 │  │
│  │  - SSL/TLS termination                                   │  │
│  │  - Static asset caching                                  │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       ↓                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Application Load Balancer                 │  │
│  │  - Health checks                                          │  │
│  │  - SSL certificates (ACM)                                │  │
│  │  - Request routing                                       │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│       ┌───────────────┴────────────────┐                       │
│       ↓                                ↓                       │
│  ┌─────────────┐                 ┌─────────────┐              │
│  │   ECS/EC2   │                 │   ECS/EC2   │              │
│  │  (Next.js)  │                 │  (Next.js)  │              │
│  │             │                 │             │              │
│  │  Container  │                 │  Container  │              │
│  └──────┬──────┘                 └──────┬──────┘              │
│         │                               │                      │
│         └───────────────┬───────────────┘                      │
│                         ↓                                      │
│              ┌─────────────────────┐                           │
│              │    RDS PostgreSQL   │                           │
│              │                     │                           │
│              │  - Multi-AZ         │                           │
│              │  - Auto backups     │                           │
│              │  - Read replicas    │                           │
│              └─────────────────────┘                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              EventBridge (Scheduler)                      │  │
│  │                                                           │  │
│  │  Schedule: cron(0 2 * * ? *)                            │  │
│  │  Target: POST /api/cron/fetch-data                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Options

### Option 1: AWS ECS (Recommended)

**Pros:**

- ✅ Fully managed container orchestration
- ✅ Auto-scaling based on CPU/memory
- ✅ Easy rollbacks and deployments
- ✅ Cost-effective with Fargate

**Cons:**

- ⚠️ Slightly more complex setup
- ⚠️ Container registry required (ECR)

### Option 2: AWS EC2 with Docker

**Pros:**

- ✅ Full control over infrastructure
- ✅ Simpler mental model
- ✅ Easy SSH access for debugging

**Cons:**

- ⚠️ Manual scaling and management
- ⚠️ You manage OS updates and security

### Option 3: AWS Amplify (Easiest)

**Pros:**

- ✅ Zero-config deployment
- ✅ Git integration
- ✅ Built-in CI/CD
- ✅ Automatic SSL

**Cons:**

- ⚠️ Less control over infrastructure
- ⚠️ Higher cost for same resources
- ⚠️ Limited customization

---

## 🐳 Dockerization

### Create Dockerfile

```dockerfile
# /Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Update next.config.ts

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Enable standalone build for Docker
  experimental: {
    // Enable server actions if needed
  },
};

export default nextConfig;
```

### Create .dockerignore

```
# .dockerignore
node_modules
.next
.env*.local
.git
.gitignore
README.md
docker-compose.yml
Dockerfile
.dockerignore
```

### Build and Test Locally

```bash
# Build Docker image
docker build -t crypto-dashboard .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e COINGECKO_API_KEY="..." \
  -e CRON_SECRET="..." \
  crypto-dashboard
```

---

## 📦 ECS Deployment (Detailed)

### Step 1: Create ECR Repository

```bash
# Create repository
aws ecr create-repository --repository-name crypto-dashboard

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS \
  --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag and push image
docker tag crypto-dashboard:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/crypto-dashboard:latest

docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/crypto-dashboard:latest
```

### Step 2: Create RDS PostgreSQL

1. Open RDS Console
2. Create Database:

   - **Engine**: PostgreSQL 16
   - **Templates**: Production (or Dev/Test for staging)
   - **DB Instance**: db.t3.micro (free tier) or db.t3.small
   - **Storage**: 20 GB SSD (auto-scaling enabled)
   - **Multi-AZ**: Yes (production) / No (staging)
   - **Username**: postgres
   - **Password**: Generate strong password
   - **VPC**: Same as ECS cluster
   - **Public access**: No
   - **Database name**: crypto_dashboard

3. Security Group:
   - Inbound: PostgreSQL (5432) from ECS security group

### Step 3: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name crypto-dashboard-cluster

# Or use console:
# ECS → Clusters → Create Cluster
# - Name: crypto-dashboard-cluster
# - Infrastructure: AWS Fargate (serverless)
```

### Step 4: Create Task Definition

Create `task-definition.json`:

```json
{
  "family": "crypto-dashboard",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "crypto-dashboard",
      "image": "YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/crypto-dashboard:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT:secret:crypto-dashboard/database-url"
        },
        {
          "name": "COINGECKO_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT:secret:crypto-dashboard/coingecko-api-key"
        },
        {
          "name": "CRON_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT:secret:crypto-dashboard/cron-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/crypto-dashboard",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3000/api/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register task definition:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### Step 5: Create Application Load Balancer

1. EC2 Console → Load Balancers → Create Load Balancer
2. Choose Application Load Balancer
3. Configure:

   - **Name**: crypto-dashboard-alb
   - **Scheme**: Internet-facing
   - **IP address type**: IPv4
   - **VPC**: Your VPC
   - **Subnets**: Select 2+ public subnets
   - **Security group**: Allow HTTP (80) and HTTPS (443)

4. Create Target Group:
   - **Target type**: IP addresses
   - **Protocol**: HTTP
   - **Port**: 3000
   - **VPC**: Same as ALB
   - **Health check path**: `/api/health`
   - **Health check interval**: 30 seconds

### Step 6: Create ECS Service

```bash
aws ecs create-service \
  --cluster crypto-dashboard-cluster \
  --service-name crypto-dashboard-service \
  --task-definition crypto-dashboard:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=crypto-dashboard,containerPort=3000"
```

---

## 🔐 Secrets Management

### Store Secrets in AWS Secrets Manager

```bash
# Database URL
aws secretsmanager create-secret \
  --name crypto-dashboard/database-url \
  --secret-string "postgresql://user:pass@rds-endpoint:5432/crypto_dashboard"

# CoinGecko API Key
aws secretsmanager create-secret \
  --name crypto-dashboard/coingecko-api-key \
  --secret-string "CG-UMSbWgGxjn3Hf1AGKHSztCWM"

# Cron Secret
aws secretsmanager create-secret \
  --name crypto-dashboard/cron-secret \
  --secret-string "$(openssl rand -base64 32)"
```

### Grant ECS Task Execution Role Access

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT:secret:crypto-dashboard/*"
      ]
    }
  ]
}
```

---

## 🌐 CloudFront Distribution

### Step 1: Create Distribution

1. CloudFront Console → Create Distribution
2. Configure:
   - **Origin domain**: ALB DNS name
   - **Protocol**: HTTPS only
   - **Allowed HTTP methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - **Cache policy**: CachingOptimized (or custom)
   - **Origin request policy**: AllViewer
   - **Viewer protocol policy**: Redirect HTTP to HTTPS

### Step 2: Configure Custom Domain (Optional)

1. **Route 53**: Create hosted zone
2. **ACM**: Request SSL certificate
3. **CloudFront**: Add alternate domain name (CNAME)
4. **Route 53**: Create A record → Alias to CloudFront

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: crypto-dashboard
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster crypto-dashboard-cluster \
            --service crypto-dashboard-service \
            --force-new-deployment
```

---

## 💰 Cost Estimation

### Monthly Costs (Approximate)

| Service                       | Configuration               | Monthly Cost    |
| ----------------------------- | --------------------------- | --------------- |
| **ECS Fargate**               | 2 tasks × 0.5 vCPU, 1GB RAM | ~$30            |
| **RDS PostgreSQL**            | db.t3.micro (20GB)          | ~$15            |
| **Application Load Balancer** | Standard                    | ~$20            |
| **CloudFront**                | 1TB transfer                | ~$85            |
| **Secrets Manager**           | 3 secrets                   | ~$1.20          |
| **EventBridge**               | 1 rule                      | Free            |
| **CloudWatch Logs**           | 5GB                         | ~$2.50          |
| **Data Transfer**             | Moderate                    | ~$10            |
| **TOTAL**                     |                             | **~$163/month** |

**Free Tier Eligible**: RDS, ECS (partial), CloudWatch

---

## 📊 Monitoring & Logging

### CloudWatch Dashboard

Create dashboard with:

- ECS CPU/Memory utilization
- RDS connections and performance
- ALB request count and latency
- EventBridge rule invocations
- Application errors (from logs)

### Alarms

```bash
# High CPU on ECS
Metric: CPUUtilization
Threshold: > 80%
Action: SNS notification + Auto-scaling

# Database connections
Metric: DatabaseConnections
Threshold: > 80% of max
Action: SNS notification

# ALB 5xx errors
Metric: HTTPCode_Target_5XX_Count
Threshold: > 10 in 5 minutes
Action: SNS notification
```

---

## 🎯 Interview Talking Points

1. **Scalability**: "I chose ECS Fargate for horizontal auto-scaling based on CPU/memory metrics"

2. **High Availability**: "Multi-AZ RDS deployment ensures database availability during failures"

3. **Security**: "Secrets stored in AWS Secrets Manager, never in code or environment files"

4. **Cost Optimization**: "Fargate Spot instances for non-critical workloads, RDS reserved instances for 40% savings"

5. **Observability**: "Full CloudWatch integration with custom dashboards, alarms, and log aggregation"

6. **CI/CD**: "GitHub Actions automatically builds, tests, and deploys on every main branch push"
