# AWS Deployment Guide - Crypto Dashboard

This project uses **AWS CDK (Cloud Development Kit)** for Infrastructure as Code deployment.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              AWS Amplify Hosting (Next.js)                  │
│  - Frontend (SSR + Static) + API Routes                    │
│  - Auto-deploy from GitHub                                  │
│  - Built-in CDN + SSL                                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS RDS PostgreSQL                             │
│  - db.t3.micro instance                                     │
│  - Automated backups                                         │
│  - Encryption at rest                                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│         AWS Lambda + EventBridge (Cron)                     │
│  - Triggers daily at midnight UTC                           │
│  - Calls /api/cron/fetch-data                              │
│  - Fetches cryptocurrency prices                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│          AWS Secrets Manager                                │
│  - Database credentials                                      │
│  - API keys (CoinGecko)                                     │
│  - JWT & Cron secrets                                       │
└─────────────────────────────────────────────────────────────┘
```

## CDK Stacks

The infrastructure is divided into 4 modular stacks:

1. **SecretsStack** - Secrets Manager for sensitive data
2. **DatabaseStack** - RDS PostgreSQL database
3. **AmplifyStack** - Next.js hosting with Amplify
4. **CronStack** - EventBridge + Lambda for scheduled jobs

## Prerequisites

### 1. AWS Account Setup

```bash
# Install AWS CLI
brew install awscli  # macOS
# or
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Output format (json)
```

### 2. Install CDK

```bash
# Install globally
npm install -g aws-cdk

# Verify installation
cdk --version
```

### 3. GitHub Personal Access Token

Create a GitHub PAT with `repo` scope:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scope: `repo` (Full control of private repositories)
4. Generate and copy the token

## Deployment Steps

### Step 1: Bootstrap CDK (One-time setup)

```bash
# Bootstrap CDK in your AWS account/region
cdk bootstrap
```

This creates an S3 bucket and IAM roles for CDK deployments.

### Step 2: Store GitHub Token

```bash
# Create GitHub token secret
aws secretsmanager create-secret \
  --name crypto-dashboard/github-token \
  --secret-string "ghp_your_github_personal_access_token_here"
```

### Step 3: Deploy All Stacks

```bash
# Option 1: Use the deploy script (recommended)
./scripts/deploy-all.sh

# Option 2: Manual deployment
npm run cdk:deploy
```

This will:

- ✅ Deploy Secrets Manager (auto-generates secure secrets)
- ✅ Deploy RDS PostgreSQL database (~5 mins)
- ✅ Deploy Amplify app connected to GitHub (~3 mins)
- ✅ Deploy Lambda + EventBridge cron (~1 min)

**Total deployment time: ~10-15 minutes**

### Step 4: Update Secrets

After deployment, update the CoinGecko API key:

```bash
# Update CoinGecko API key
aws secretsmanager update-secret \
  --secret-id crypto-dashboard/coingecko-api-key \
  --secret-string "CG-YourActualCoinGeckoAPIKey"
```

### Step 5: Wait for Amplify Build

1. Go to AWS Amplify Console
2. Find your app: `crypto-dashboard`
3. Wait for the build to complete (~5-10 mins)
4. Your app URL will be: `https://main.xxxxxxxxxx.amplifyapp.com`

### Step 6: Run Database Migrations

Once Amplify is deployed, run migrations through the Amplify console:

```bash
# This happens automatically in the build process
# But if needed, you can manually trigger:
# Go to Amplify Console → App → Build settings → Add migration command
```

## Post-Deployment

### Get Your App URL

```bash
# Get Amplify app URL
aws amplify list-apps --query "apps[?name=='crypto-dashboard'].defaultDomain" --output text
```

### Verify Cron Job

```bash
# Check Lambda function
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'CryptoDashboard-Cron')]"

# Check EventBridge rule
aws events list-rules --name-prefix CryptoDashboard
```

### Test Cron Job Manually

```bash
# Invoke Lambda function manually
aws lambda invoke \
  --function-name $(aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'CryptoDashboard-Cron')].FunctionName" --output text | head -n 1) \
  --payload '{}' \
  response.json

# Check response
cat response.json
```

## Updating the Application

### Update Code

```bash
# 1. Push code to GitHub
git add .
git commit -m "Update feature"
git push

# 2. Amplify auto-deploys (watch in console)
```

### Update Infrastructure

```bash
# If you modify CDK stacks
cdk deploy --all

# Only deploy specific stack
cdk deploy CryptoDashboard-Database-dev
```

## Monitoring

### View Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/CryptoDashboard-Cron-dev-FetchDataFunction --follow

# RDS logs
aws rds describe-db-log-files --db-instance-identifier $(aws rds describe-db-instances --query "DBInstances[?DBName=='crypto_dashboard'].DBInstanceIdentifier" --output text)
```

### Check Amplify Build

```bash
# Get recent builds
aws amplify list-jobs --app-id $(aws amplify list-apps --query "apps[?name=='crypto-dashboard'].appId" --output text) --branch-name main --max-results 5
```

## Costs

| Resource        | Monthly Cost      | Notes                                   |
| --------------- | ----------------- | --------------------------------------- |
| RDS db.t3.micro | ~$15              | 20GB storage, always on                 |
| Amplify         | ~$1-5             | Free tier: 1000 build mins, 15GB served |
| Lambda          | Free              | Free tier: 1M requests                  |
| EventBridge     | Free              | Free tier: 1M events                    |
| Secrets Manager | ~$2               | $0.40 per secret + API calls            |
| **Total**       | **~$18-22/month** |                                         |

## Destroying Resources

### ⚠️ WARNING: This deletes everything!

```bash
# Option 1: Use destroy script
./scripts/destroy-all.sh

# Option 2: Manual destruction
npm run cdk:destroy
```

This will:

1. Delete Lambda + EventBridge cron
2. Delete Amplify app
3. Delete RDS database (ALL DATA LOST!)
4. Delete all secrets

**Billing stops immediately after destruction!**

## Troubleshooting

### Issue: CDK Bootstrap Failed

```bash
# Solution: Ensure AWS credentials are correct
aws sts get-caller-identity

# Re-bootstrap
cdk bootstrap --force
```

### Issue: Amplify Build Failed

```bash
# Check build logs in Amplify Console
# Common issues:
# - Missing environment variables
# - Prisma migration errors
# - Build timeout

# Solution: Check Amplify Console → App → Build logs
```

### Issue: Lambda Can't Connect to Database

```bash
# Check security groups allow Lambda → RDS
# Check DATABASE_URL is correct in Lambda environment

# Get database endpoint
aws rds describe-db-instances --query "DBInstances[?DBName=='crypto_dashboard'].Endpoint"
```

### Issue: Cron Job Not Running

```bash
# Check EventBridge rule is enabled
aws events describe-rule --name CryptoDashboard-DailyCron

# Check Lambda has correct permissions
aws lambda get-policy --function-name $(aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'CryptoDashboard-Cron')].FunctionName" --output text | head -n 1)
```

## CDK Commands

```bash
# Synthesize CloudFormation templates
npm run cdk:synth

# Show differences between deployed and local
npm run cdk:diff

# Deploy all stacks
npm run cdk:deploy

# Destroy all stacks
npm run cdk:destroy

# List all stacks
cdk list

# Watch mode (auto-deploy on changes)
cdk watch
```

## Environment Variables

All environment variables are managed through CDK and stored in:

- **Secrets Manager** (sensitive)
- **Amplify Environment Variables** (injected at build time)

No `.env` files needed in production!

## Security Best Practices

✅ **Secrets in Secrets Manager** - Not hardcoded  
✅ **Database in private subnet** - With security groups  
✅ **IAM roles with least privilege** - Defined in CDK  
✅ **Encryption at rest** - RDS encrypted  
✅ **SSL/TLS** - Amplify auto-provisions certificates  
✅ **Automated backups** - 7-day retention

## Support

- **AWS CDK Docs**: https://docs.aws.amazon.com/cdk/
- **Amplify Docs**: https://docs.amplify.aws/
- **RDS Docs**: https://docs.aws.amazon.com/rds/

## License

MIT
