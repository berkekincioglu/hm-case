# AWS Deployment Guide - Crypto Dashboard

Complete guide for deploying the Crypto Dashboard application to AWS using Infrastructure as Code (CDK).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Infrastructure Details](#infrastructure-details)
4. [Deployment Steps](#deployment-steps)
5. [Verification](#verification)
6. [Maintenance](#maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Cost Estimation](#cost-estimation)
9. [Cleanup](#cleanup)

---

## Architecture Overview

The application uses three main AWS services:

```
┌─────────────────────────────────────────────────────────────┐
│              AWS Amplify (Next.js)                           │
│  • Frontend: Charts, Dashboard UI                            │
│  • API Routes: /api/health, /api/prices/*                    │
│  • Auto-deploy from GitHub                                   │
│  • Built-in CDN + SSL                                        │
│  • Limitation: 30-second timeout                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼ reads from
┌─────────────────────────────────────────────────────────────┐
│              AWS RDS PostgreSQL                              │
│  • Tables: Coin, Currency, PriceDaily, PriceHourly           │
│  • db.t3.micro instance                                      │
│  • Automated backups (7-day retention)                       │
│  • Encryption at rest                                        │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ writes to
┌─────────────────────────────────────────────────────────────┐
│       AWS Lambda + EventBridge (Cron)                        │
│  • Triggers daily at midnight UTC                            │
│  • Fetches cryptocurrency prices from CoinGecko              │
│  • 5-minute timeout (handles long operations)                │
│  • Uses Prisma to write to database                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│          AWS Secrets Manager                                 │
│  • Database credentials                                      │
│  • API keys (CoinGecko)                                     │
│  • JWT & Cron secrets                                       │
└─────────────────────────────────────────────────────────────┘
```

### Why Lambda Instead of API Route?

**The Problem:**

- Fetching data from CoinGecko takes ~30-60 seconds for multiple coins
- AWS Amplify has a **30-second hard timeout** for serverless functions
- API routes would timeout and fail

**The Solution:**

- Dedicated Lambda function with **15-minute maximum timeout** (configured for 5 minutes)
- Triggered by EventBridge on a schedule (not exposed as HTTP endpoint)
- Writes directly to database using Prisma
- Amplify API routes only **read** from database (fast, no timeout risk)

---

## Prerequisites

### Required Software

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **AWS CLI**: v2.x configured with credentials
- **Git**: Latest version

### AWS Account Setup

Configure AWS CLI with your credentials:

```bash
aws configure
```

You'll need:

- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `eu-central-1`)
- Default output format (e.g., `json`)

### API Keys

- **CoinGecko API Key**: Sign up at [CoinGecko](https://www.coingecko.com/en/api) to get a free API key

### GitHub Personal Access Token

Create a GitHub PAT with `repo` scope:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scope: `repo` (Full control of private repositories)
4. Generate and copy the token

---

## Infrastructure Details

### CDK Stacks

The infrastructure is divided into 3 modular stacks:

#### 1. **SecretsStack** - AWS Secrets Manager

- Database credentials (auto-generated secure password)
- CoinGecko API key storage
- JWT and cron secrets

#### 2. **DatabaseStack** - RDS PostgreSQL

- Database instance configuration (db.t3.micro)
- Security groups for network access
- Automated backups (7-day retention)
- Encryption at rest

#### 3. **CronStack** - Lambda + EventBridge

- Lambda function (built with TypeScript + esbuild)
- EventBridge cron rule (daily trigger at midnight UTC)
- IAM permissions for RDS and Secrets Manager access

---

## Deployment Steps

### Step 1: Clone and Install

```bash
git clone https://github.com/berkekincioglu/hm-case.git
cd hm-case
npm install
```

This installs dependencies for Next.js, CDK, and Lambda function.

### Step 2: Bootstrap CDK (First Time Only)

If this is your first time using CDK in your AWS account/region:

```bash
cd cdk
npx cdk bootstrap
```

Example with specific account/region:

```bash
npx cdk bootstrap aws://123456789012/eu-central-1
```

This creates an S3 bucket and IAM roles needed for CDK deployments.

### Step 3: Store GitHub Token in Secrets Manager

```bash
aws secretsmanager create-secret \
  --name crypto-dashboard/github-token \
  --secret-string "ghp_your_github_personal_access_token_here"
```

### Step 4: Deploy All Infrastructure

```bash
# Option 1: Deploy all stacks at once (recommended)
npx cdk deploy --all

# Option 2: Deploy individually
npx cdk deploy hm-case-Secrets-dev     # ~1 minute
npx cdk deploy hm-case-Database-dev    # ~10 minutes
npx cdk deploy hm-case-Cron-dev        # ~2 minutes
```

**Total deployment time: ~10-15 minutes**

### Step 5: Update CoinGecko API Key

After deployment, update the CoinGecko secret:

```bash
aws secretsmanager put-secret-value \
  --secret-id hm-case-Secrets-dev-CoinGeckoApiKey \
  --secret-string '{"apiKey":"YOUR_COINGECKO_API_KEY_HERE"}'
```

### Step 6: Get Database Connection Details

Retrieve database credentials:

```bash
aws secretsmanager get-secret-value \
  --secret-id hm-case-Secrets-dev-DatabaseSecret \
  --query SecretString --output text
```

Create a `.env.local` file in the project root:

```bash
DATABASE_URL="postgresql://username:password@endpoint:5432/crypto_dashboard?schema=public"
COINGECKO_API_KEY="your-coingecko-api-key"
```

### Step 7: Initialize Database Schema

```bash
cd ..  # Return to project root
npx prisma generate
npx prisma db push
```

This creates the database tables:

- `Coin`: Cryptocurrency information
- `Currency`: Fiat currency information
- `PriceDaily`: Daily price data
- `PriceHourly`: Hourly price data

### Step 8: Test Lambda Function

Manually trigger the Lambda function to populate initial data:

```bash
aws lambda invoke \
  --function-name hm-case-Cron-dev-FetchDataFunction \
  --region eu-central-1 \
  /tmp/response.json

cat /tmp/response.json
```

Expected response after ~30 seconds:

```json
{
  "statusCode": 200,
  "body": "{\"success\":true,\"message\":\"Data fetch completed successfully\",\"duration\":\"27832ms\",\"timestamp\":\"2025-10-21T13:29:56.500Z\"}"
}
```

### Step 9: Deploy Frontend to AWS Amplify

#### Using AWS Console (Recommended):

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **"New app"** → **"Host web app"** → **"GitHub"**
3. Authorize AWS Amplify to access your GitHub account
4. Select repository: `berkekincioglu/hm-case`, branch: `main`
5. Build settings are auto-detected from `amplify.yml`
6. **Add environment variables**:

   - `DATABASE_URL`: Get from Step 6
   - `COINGECKO_API_KEY`: Your CoinGecko key

   Example:

   ```
   DATABASE_URL=postgresql://username:password@endpoint.rds.amazonaws.com:5432/crypto_dashboard?schema=public
   COINGECKO_API_KEY=CG-xxxxxxxxxxxxx
   ```

7. Click **"Save and deploy"**
8. Wait ~5-10 minutes for build to complete

#### Using AWS CLI:

```bash
# Create the Amplify app
aws amplify create-app \
  --name crypto-dashboard \
  --repository https://github.com/berkekincioglu/hm-case \
  --region eu-central-1

# Create a branch connection
aws amplify create-branch \
  --app-id <APP_ID> \
  --branch-name main \
  --environment-variables \
    DATABASE_URL="postgresql://username:password@endpoint:5432/crypto_dashboard" \
    COINGECKO_API_KEY="your-api-key"

# Start deployment
aws amplify start-job \
  --app-id <APP_ID> \
  --branch-name main \
  --job-type RELEASE
```

---

## Verification

### 1. Check Infrastructure

Verify all stacks are deployed:

```bash
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  --query 'StackSummaries[?contains(StackName, `hm-case`)].StackName'
```

Expected output:

```json
["hm-case-Secrets-dev", "hm-case-Database-dev", "hm-case-Cron-dev"]
```

### 2. Check Your App

Get your Amplify URL:

```bash
aws amplify list-apps \
  --query "apps[?name=='crypto-dashboard'].defaultDomain" \
  --output text
```

Visit your app and verify:

- ✅ Homepage loads with charts
- ✅ No console errors
- ✅ Charts display data

### 3. Check Health Endpoint

Visit: `https://your-app.amplifyapp.com/api/health`

Expected response:

```json
{
  "status": "healthy",
  "database": "connected",
  "counts": {
    "coins": 5,
    "currencies": 3,
    "dailyPrices": 45,
    "hourlyPrices": 360
  }
}
```

### 4. Check Lambda Logs

```bash
aws logs tail /aws/lambda/hm-case-Cron-dev-FetchDataFunction --follow
```

Should show successful execution logs.

### 5. Browse Database

```bash
npx prisma studio
```

Opens a GUI to view database contents.

---

## Maintenance

### Daily Operations

The system runs automatically:

- Lambda executes daily at midnight UTC via EventBridge
- Data is automatically stored in RDS
- Frontend updates automatically via Amplify CI/CD on git push

### Updating Code

```bash
# Push changes to GitHub - Amplify auto-deploys
git add .
git commit -m "Update feature"
git push origin main

# Watch build in Amplify Console
```

### Updating Infrastructure

```bash
cd cdk

# Deploy all changes
npx cdk deploy --all

# Or deploy specific stack
npx cdk deploy hm-case-Cron-dev
```

### Changing Cron Schedule

Edit `cdk/lib/cron-stack.ts`:

```typescript
schedule: events.Schedule.cron({
  minute: "0", // Change time
  hour: "0", // Midnight UTC (21:00 UTC = 00:00 Turkey time)
  day: "*",
  month: "*",
  year: "*",
});
```

Then redeploy:

```bash
npx cdk deploy hm-case-Cron-dev
```

---

## Troubleshooting

### Issue: Lambda Timeout

**Symptoms:** Lambda fails with timeout error

**Causes:**

- Too many coins being fetched
- CoinGecko API rate limit hit
- Network issues

**Solutions:**

1. Reduce number of coins in `lambda/fetch-data/src/config/constants.ts`
2. Increase Lambda timeout in `cdk/lib/cron-stack.ts`
3. Add retry logic with exponential backoff

### Issue: Database Connection Failed

**Symptoms:** "Unable to connect to database" error

**Causes:**

- Wrong credentials
- Security group blocking connection
- Database instance stopped

**Solutions:**

1. Verify credentials in Secrets Manager:
   ```bash
   aws secretsmanager get-secret-value \
     --secret-id hm-case-Secrets-dev-DatabaseSecret
   ```
2. Check RDS security group allows Lambda access
3. Verify RDS instance is running:
   ```bash
   aws rds describe-db-instances \
     --query "DBInstances[?DBName=='crypto_dashboard'].DBInstanceStatus"
   ```

### Issue: Amplify Build Fails

**Symptoms:** Build fails in Amplify Console

**Causes:**

- Missing `DATABASE_URL` environment variable
- Prisma migration errors
- Build timeout

**Solutions:**

1. Add environment variables in Amplify Console → App → Environment variables
2. Check build logs for specific errors
3. Increase build timeout if needed

### Issue: No Data in Charts

**Symptoms:** Charts are empty or show no data

**Causes:**

- Lambda hasn't run yet
- Lambda failed to fetch data
- Database is empty

**Solutions:**

1. Manually trigger Lambda (see Step 8 in Deployment)
2. Check Lambda logs for errors:
   ```bash
   aws logs tail /aws/lambda/hm-case-Cron-dev-FetchDataFunction --follow
   ```
3. Verify database has data:
   ```bash
   npx prisma studio
   ```

### Issue: CDK Bootstrap Failed

**Symptoms:** Bootstrap command fails

**Solutions:**

1. Verify AWS credentials:
   ```bash
   aws sts get-caller-identity
   ```
2. Re-bootstrap with force flag:
   ```bash
   cdk bootstrap --force
   ```

### Issue: Cron Job Not Running

**Symptoms:** Lambda doesn't execute automatically

**Solutions:**

1. Check EventBridge rule is enabled:
   ```bash
   aws events describe-rule --name CryptoDashboard-DailyCron
   ```
2. Verify Lambda has correct permissions:
   ```bash
   aws lambda get-policy --function-name hm-case-Cron-dev-FetchDataFunction
   ```
3. Check CloudWatch Events logs

---

## Cost Estimation

| Service             | Monthly Cost      | Notes                                    |
| ------------------- | ----------------- | ---------------------------------------- |
| **RDS db.t3.micro** | ~$15-20           | Database instance, always-on             |
| **Lambda**          | <$1               | Daily executions (free tier covers most) |
| **Amplify**         | ~$0-15            | Free tier: 1000 build mins, 15GB served  |
| **EventBridge**     | Free              | Free tier: 1M events/month               |
| **Secrets Manager** | ~$2               | $0.40 per secret + API calls             |
| **CloudWatch**      | <$5               | Logs and metrics                         |
| **Data Transfer**   | <$5               | Depends on traffic                       |
| **Total**           | **~$25-40/month** |                                          |

### Cost Optimization Tips

1. **RDS**: Use db.t4g.micro (ARM-based, ~20% cheaper than t3)
2. **Lambda**: Keep execution time optimized
3. **Amplify**: Enable caching to reduce build minutes
4. **Secrets Manager**: Consolidate secrets if possible
5. **CloudWatch**: Set log retention to 7-14 days

---

## Cleanup

To delete all resources and stop billing:

```bash
cd cdk

# Delete all stacks (in reverse order)
npx cdk destroy --all

# Or destroy individually
npx cdk destroy hm-case-Cron-dev
npx cdk destroy hm-case-Database-dev
npx cdk destroy hm-case-Secrets-dev

# Manually delete Amplify app
aws amplify delete-app --app-id <APP_ID>
```

⚠️ **Warning**: This permanently deletes:

- All database data
- All secrets
- Lambda functions
- CloudWatch logs
- Amplify app

---

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Amplify Hosting](https://docs.amplify.aws/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Documentation](https://www.prisma.io/docs)
- [CoinGecko API Documentation](https://www.coingecko.com/en/api/documentation)

---

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review CloudWatch logs for error details
3. Check repository issues: [GitHub Issues](https://github.com/berkekincioglu/hm-case/issues)

---

**Last Updated**: October 21, 2025
