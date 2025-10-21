## 🚀 Quick Start (For Local)

```bash
# 1. Clone and install
git clone <repo-url>
cd hypermonk-case
npm install

# 2. Start PostgreSQL
docker-compose up -d

# 3. Setup database
npx prisma migrate dev

# 4. Fetch historical data (takes ~2-3 minutes)
npm run fetch-data

# 5. Start development server
npm run dev
```

**LIVE URL** : https://main.d3juig7aamo1pa.amplifyapp.com

**Visit:** http://localhost:3000

---

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Docker)
- **External API**: CoinGecko (Free tier)
- **Deployment**: AWS Amplify, RDS, CloudFormation, EventBridge

**What this does:**

- Fetches data from CoinGecko API
- Stores ~3,960 daily price records
- Stores ~95,040 hourly price records
- Total: ~99,000 records in PostgreSQL

### Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## 🧪 Testing

## 📊 Data Overview

### Tracked Cryptocurrencies (11)

- Bitcoin (BTC)
- Ethereum (ETH)
- Solana (SOL)
- Cardano (ADA)
- Ripple (XRP)
- Polkadot (DOT)
- Dogecoin (DOGE)
- Avalanche (AVAX)
- Chainlink (LINK)
- Uniswap (UNI)
- Litecoin (LTC)

### Supported Currencies (4)

- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- TRY (Turkish Lira)

---

## ⏰ Scheduled Data Fetching (AWS Lambda)

The application uses **AWS Lambda + EventBridge** for automated daily data fetching, replacing the traditional cron endpoint approach.

### **Architecture**

## NOTE FROM DEV =>

# Normally I was only using lambda for triggering

# POST api/cron/fetch-data endpoint but aws amplify does not allow more then 30s requests and throws timeout error

# thats why I have to built db setup and fetch coins, currencies daily in lambda func.

```
┌─────────────────────────────────────────────────────────────┐
│  EventBridge Rule (Cron: 00:00 UTC daily)                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  cron(0 0 * * ? *)                               │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │ Triggers                            │
│                       ▼                                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Lambda Function                                   │    │
│  │  - Fetches from CoinGecko API                      │    │
│  │  - Stores to RDS PostgreSQL                        │    │
│  │  - Logs to CloudWatch                              │    │
│  │  - Execution: ~55 seconds                          │    │
│  │  - Memory: 512MB, Timeout: 5 minutes               │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │ Connects via VPC                    │
│                       ▼                                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  RDS PostgreSQL Database                           │    │
│  │  - Stores hourly prices (~14k records/day)         │    │
│  │  - Stores daily prices (~2k records/day)           │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### **How It Works**

1. **EventBridge Rule** triggers Lambda at 00:00 UTC daily
2. **Lambda Function** executes data fetching:
   - Retrieves DB credentials from **Secrets Manager**
   - Calls **CoinGecko API** with rate limiting (2s delay)
   - Fetches 30 days hourly data + 365 days daily data
   - Stores records in **RDS PostgreSQL**
   - Logs execution details to **CloudWatch**
3. **Next.js Frontend** reads data from same RDS instance

### **Verified Performance**

- ✅ **Execution Time:** ~55 seconds (well under 5-min timeout)
- ✅ **Hourly Records:** 14,420+ records stored per run
- ✅ **Daily Records:** 2,196+ records stored per run
- ✅ **Success Rate:** 100% (verified in CloudWatch logs)

### **Manual Testing**

**CloudWatch Logs:**

```
[INFO] Storing 14420 hourly prices
[INFO] Inserted 14420 hourly prices
[INFO] Storing 2196 daily prices
[INFO] Inserted 2196 daily prices
[INFO] Data fetch completed successfully
```

### **Configuration**

**Lambda Function Settings:**

- Runtime: Node.js 18.x
- Memory: 512 MB
- Timeout: 5 minutes (300 seconds)
- VPC: Enabled (access to RDS)
- Environment Variables:
  - `SECRET_ARN` - Points to Secrets Manager for DB credentials

**Secrets Manager (Database Credentials):**

```json
{
  "host": "hm-case-dev.xxxxx.eu-central-1.rds.amazonaws.com",
  "username": "postgres",
  "password": "<auto-generated>",
  "database": "crypto_dashboard",
  "port": 5432
}
```

### **Why Lambda Instead of Cron Endpoint?**

| Aspect          | Lambda + EventBridge   | Traditional Cron Endpoint   |
| --------------- | ---------------------- | --------------------------- |
| **Security**    | No public endpoint     | Requires bearer token auth  |
| **Reliability** | AWS-managed scheduling | Depends on external service |
| **Scalability** | Auto-scales            | Limited by server capacity  |
| **Cost**        | $0 (free tier)         | Server must run 24/7        |
| **Monitoring**  | Built-in CloudWatch    | Custom logging required     |
| **Maintenance** | Fully managed          | Manual server upkeep        |

**Issue: Lambda not triggering**

- Check EventBridge rule is enabled in AWS Console
- Verify Lambda has proper IAM permissions
- Check CloudWatch Events metrics

**Issue: Lambda fails with database error**

- Verify Lambda is in same VPC as RDS
- Check security group allows inbound on port 5432
- Confirm Secrets Manager ARN is correct

**Issue: CoinGecko API rate limit errors**

- Verify delay is set to 2000ms (30 req/min)
- Check free tier limits in CoinGecko dashboard
- Consider upgrading to paid tier for higher limits

## 🚢 Deployment

This application uses **AWS CDK** for infrastructure as code with two deployment approaches:

### **Deployment Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                     AWS INFRASTRUCTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐   │
│  │ AWS Amplify │      │   Lambda    │      │     RDS     │   │
│  │  (Next.js)  │─────▶│  Function   │─────▶│ PostgreSQL  │   │
│  │   Hosting   │      │ (Cron Job)  │      │             │   │
│  └─────────────┘      └─────────────┘      └─────────────┘   │
│         │                     ▲                                │
│         │                     │                                │
│         │            ┌─────────────────┐                       │
│         │            │  EventBridge    │                       │
│         └───────────▶│  (Scheduler)    │                       │
│                      │  cron(0 0 * * ? *)                   │
│                      └─────────────────┘                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              AWS Secrets Manager                         │  │
│  │  - DATABASE_URL                                          │  │
│  │  - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME               │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### **Prerequisites**

- AWS Account with appropriate permissions
- AWS CLI configured (`aws configure`)
- Node.js 18+ and npm installed
- Docker installed (for Lambda builds)

### **Step 1: Deploy Infrastructure with AWS CDK**

```bash
# Navigate to CDK directory
cd cdk

# Install dependencies
npm install

# Bootstrap AWS CDK (first time only)
npx aws-cdk bootstrap

# Deploy to development
npx cdk deploy --all --context env=dev

# Deploy to production
npx cdk deploy --all --context env=prod
```

**What gets deployed:**

- ✅ RDS PostgreSQL database (t3.micro for dev, t3.small for prod)
- ✅ Lambda function for scheduled data fetching
- ✅ EventBridge rule (daily cron at 00:00 UTC)
- ✅ Secrets Manager for database credentials
- ✅ VPC with public/private subnets
- ✅ Security groups and IAM roles

**CloudFormation Stacks:**

- `hm-case-Network-{env}` - VPC and networking
- `hm-case-Database-{env}` - RDS instance
- `hm-case-Cron-{env}` - Lambda function + EventBridge

### **Step 2: Initialize Database Schema**

After CDK deployment, run migrations from your local machine:

```bash
# Get database credentials from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id hm-case-dev-db-credentials \
  --query SecretString \
  --output text | jq .

# Update .env with RDS endpoint
DATABASE_URL=postgresql://postgres:password@rds-endpoint:5432/crypto_dashboard

# Run Prisma migrations
npx prisma migrate deploy

```

### **Step 3: Deploy Next.js Frontend to AWS Amplify**

1. **Connect GitHub Repository:**

   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect your GitHub repository
   - Select branch: `main`

2. **Configure Build Settings:**

   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - "**/*"
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Add Environment Variables:**

   - `DATABASE_URL` - RDS connection string from Secrets Manager
   - `NODE_ENV` - `production`

4. **Deploy:**
   - Click "Save and deploy"
   - Amplify will automatically build and deploy on every push to main

### **AWS Resources Created**

| Resource            | Purpose                 | Cost (Estimate)        |
| ------------------- | ----------------------- | ---------------------- |
| **RDS PostgreSQL**  | Database storage        | ~$15/month (t3.micro)  |
| **Lambda Function** | Scheduled data fetching | ~$0 (within free tier) |
| **EventBridge**     | Cron scheduler          | Free                   |
| **Secrets Manager** | Credential storage      | $0.40/month            |
| **VPC**             | Network isolation       | Free                   |
| **Amplify Hosting** | Next.js frontend        | ~$0-15/month           |
| **Total**           |                         | **~$15-30/month**      |

### **Environment Variables (Production)**

Store these in **AWS Secrets Manager** (automatically created by CDK):

```bash
# Database credentials (auto-generated by CDK)
DB_HOST=hm-case-dev.xxxxx.eu-central-1.rds.amazonaws.com
DB_USER=postgres
DB_PASSWORD=<auto-generated>
DB_NAME=crypto_dashboard

# Lambda uses Secrets Manager ARN
SECRET_ARN=arn:aws:secretsmanager:eu-central-1:xxx:secret:hm-case-dev-db-credentials-xxx

# Next.js Amplify uses DATABASE_URL
DATABASE_URL=postgresql://postgres:password@host:5432/crypto_dashboard
```

### **Scheduled Data Fetching**

The Lambda function automatically runs daily at **00:00 UTC** (configured in EventBridge):

```typescript
// cdk/lib/cron-stack.ts
new events.Rule(this, "DailyFetchRule", {
  schedule: events.Schedule.cron({
    minute: "15",
    hour: "12",
    day: "*",
    month: "*",
    year: "*",
  }),
});
```

**Manual Invocation (for testing):**

```bash
aws lambda invoke \
  --function-name hm-case-Cron-dev-FetchDataFunction67FE63B8-YcPLLEeYAlor \
  --region eu-central-1 \
  /tmp/response.json && cat /tmp/response.json
```

**View Logs:**

```bash
aws logs tail /aws/lambda/hm-case-Cron-dev-FetchDataFunction67FE63B8-YcPLLEeYAlor \
  --follow \
  --region eu-central-1
```

### **Deployment Checklist**

- [ ] AWS CLI configured with correct credentials
- [ ] Docker running for Lambda builds
- [ ] CDK deployed successfully (`cdk deploy --all`)
- [ ] Database credentials retrieved from Secrets Manager
- [ ] Prisma migrations executed against RDS
- [ ] Amplify app connected to GitHub repository
- [ ] Environment variables configured in Amplify
- [ ] Lambda function tested with manual invocation
- [ ] EventBridge rule verified in AWS Console
- [ ] CloudWatch logs showing successful data fetching

### **Monitoring & Logs**

**Lambda Execution Logs:**

```bash
# Real-time logs
aws logs tail /aws/lambda/hm-case-Cron-dev-FetchDataFunction67FE63B8-YcPLLEeYAlor --follow --region eu-central-1

# Filter for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/hm-case-Cron-dev-FetchDataFunction67FE63B8-YcPLLEeYAlor \
  --filter-pattern "ERROR" \
  --region eu-central-1
```

**Database Monitoring:**

```bash
# Check RDS instance status
aws rds describe-db-instances \
  --db-instance-identifier hm-case-dev \
  --region eu-central-1

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=hm-case-dev \
  --start-time 2025-01-21T00:00:00Z \
  --end-time 2025-01-21T23:59:59Z \
  --period 3600 \
  --statistics Average \
  --region eu-central-1
```

### **Troubleshooting**

**Issue: Lambda timeout (5 minutes exceeded)**

- Solution: Fetches ~14k hourly records in ~55 seconds, should not timeout
- Verify: Check CloudWatch logs for execution duration

**Issue: Database connection failed**

- Solution: Verify Lambda has VPC access to RDS
- Check: Security group allows inbound PostgreSQL (port 5432)
- Verify: Secrets Manager credentials are correct

**Issue: No data being stored**

- Solution: Check Lambda logs for CoinGecko API errors
- Verify: Rate limiting delay is set to 2000ms (30 req/min)
- Check: Database connection string in Secrets Manager

**Issue: CDK deployment fails**

- Solution: Run `cdk bootstrap` again
- Verify: AWS credentials have necessary permissions
- Check: Docker is running for Lambda function builds

### **Cleanup (Destroy Infrastructure)**

```bash
cd cdk
npx cdk destroy --all --context env=dev

# Manually delete:
# - Amplify app (if not in CDK)
# - CloudWatch log groups
# - Secrets Manager secrets
```
