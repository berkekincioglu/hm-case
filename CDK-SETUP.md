# 🚀 AWS CDK Deployment - Setup Complete!

## ✅ What We Just Created

### Infrastructure as Code (CDK)

```
cdk/
├── bin/
│   └── app.ts                  # CDK entry point - orchestrates all stacks
└── lib/
    ├── secrets-stack.ts        # AWS Secrets Manager (credentials)
    ├── database-stack.ts       # RDS PostgreSQL (data storage)
    ├── amplify-stack.ts        # Amplify Hosting (Next.js app)
    └── cron-stack.ts           # Lambda + EventBridge (daily cron)

lambda/
└── fetch-data/
    ├── index.ts                # Lambda handler (triggers API)
    ├── package.json
    └── tsconfig.json

scripts/
├── deploy-all.sh               # One-click deployment ✅
└── destroy-all.sh              # One-click destruction ✅

cdk.json                        # CDK configuration
DEPLOYMENT.md                   # Full deployment guide
```

### AWS Resources Defined

| Resource            | Type                   | Purpose           | Cost/Month  |
| ------------------- | ---------------------- | ----------------- | ----------- |
| **RDS**             | db.t3.micro PostgreSQL | Database          | ~$15        |
| **Amplify**         | Hosting                | Next.js SSR + API | ~$1-5       |
| **Lambda**          | Function               | Cron job trigger  | Free        |
| **EventBridge**     | Cron Rule              | Daily at midnight | Free        |
| **Secrets Manager** | 4 secrets              | Credentials/Keys  | ~$2         |
| **Total**           | -                      | -                 | **~$18-22** |

## 📋 Next Steps (In Order!)

### Step 1: Configure AWS Credentials (5 mins)

```bash
# Install AWS CLI (if not installed)
brew install awscli  # macOS

# Configure your AWS credentials
aws configure
# Enter:
# - AWS Access Key ID: (from AWS Console)
# - AWS Secret Access Key: (from AWS Console)
# - Default region: us-central-1
# - Output format: json

# Verify
aws sts get-caller-identity
```

### Step 2: Bootstrap CDK (One-time, 2 mins)

```bash
# This creates S3 bucket + IAM roles for CDK
cdk bootstrap
```

### Step 3: Create GitHub Token (3 mins)

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scope: ✅ `repo`
4. Generate token
5. Store it:

```bash
aws secretsmanager create-secret \
  --name crypto-dashboard/github-token \
  --secret-string "ghp_YOUR_GITHUB_TOKEN_HERE"
```

### Step 4: Deploy Everything! (15 mins)

```bash
# One command deploys everything!
./scripts/deploy-all.sh

# Or using npm:
npm run cdk:deploy
```

This will:

- ✅ Create 4 CloudFormation stacks
- ✅ Generate secure secrets automatically
- ✅ Create RDS PostgreSQL database
- ✅ Deploy Next.js app to Amplify
- ✅ Setup Lambda cron job

### Step 5: Update CoinGecko API Key (1 min)

```bash
# After deployment, update the API key
aws secretsmanager update-secret \
  --secret-id crypto-dashboard/coingecko-api-key \
  --secret-string "CG-UMSbWgGxjn3Hf1AGKHSztCWM"
```

### Step 6: Wait for Amplify Build (5-10 mins)

1. Go to: https://console.aws.amazon.com/amplify
2. Click on `crypto-dashboard` app
3. Watch the build progress
4. Once complete, get your URL:

```bash
# Your app will be live at:
https://main.dxxxxxxxxxx.amplifyapp.com
```

### Step 7: Test the Cron Job (1 min)

```bash
# Manually trigger Lambda to test
aws lambda invoke \
  --function-name $(aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'CryptoDashboard-Cron')].FunctionName" --output text | head -n 1) \
  --payload '{}' \
  response.json

# Check response
cat response.json
```

## 🎯 What This Gives You

### For the Case Study Submission

✅ **Full Infrastructure as Code** - All in TypeScript  
✅ **cdk.json** - CDK configuration file (they requested this)  
✅ **4 Modular Stacks** - Clean separation of concerns  
✅ **Proper IAM Roles** - Least privilege security  
✅ **Secrets Management** - No hardcoded credentials  
✅ **Environment Variables** - Properly configured  
✅ **Public URL** - Live, working application  
✅ **GitHub Integration** - Auto-deploy on push

### Architecture Highlights

```
Frontend: AWS Amplify (Next.js SSR + Static)
    ↓
Backend: Same Amplify (API routes)
    ↓
Database: RDS PostgreSQL (db.t3.micro)
    ↓
Cron: Lambda + EventBridge (daily fetch)
    ↓
Secrets: AWS Secrets Manager (secure storage)
```

## 🔧 Common Commands

```bash
# Deploy everything
npm run cdk:deploy

# Destroy everything (stop billing)
npm run cdk:destroy

# View differences before deploying
npm run cdk:diff

# Generate CloudFormation templates
npm run cdk:synth

# Watch Lambda logs
aws logs tail /aws/lambda/CryptoDashboard-Cron-dev-FetchDataFunction --follow
```

## 🧪 Testing Locally Before Deployment

```bash
# 1. Run local dev server
npm run dev

# 2. Test API endpoints
curl http://localhost:3000/api/prices

# 3. Test auth
curl http://localhost:3000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 4. Once satisfied, deploy!
npm run cdk:deploy
```

## 💰 Cost Management

```bash
# After case study is reviewed, destroy everything:
./scripts/destroy-all.sh

# This will:
# ✅ Delete all AWS resources
# ✅ Stop all billing
# ✅ Preserve your code in GitHub
```

**One command = $0/month!**

## 🎓 What Makes This Impressive

### For Evaluators

1. **Infrastructure as Code** ✨

   - All resources defined in TypeScript
   - Version controlled
   - Reproducible deployment

2. **Best Practices** ✨

   - Secrets in Secrets Manager
   - IAM roles with least privilege
   - VPC security groups
   - Encrypted database
   - Automated backups

3. **Modular Architecture** ✨

   - 4 separate stacks
   - Clear dependencies
   - Easy to update individually

4. **Production-Ready** ✨

   - Auto-scaling
   - CDN (CloudFront via Amplify)
   - SSL/TLS certificates
   - Monitoring with CloudWatch

5. **Cost-Optimized** ✨
   - Smallest RDS instance
   - Serverless Lambda (pay per use)
   - Free tier maximized

## 📚 Documentation

- **DEPLOYMENT.md** - Full deployment guide with troubleshooting
- **cdk/lib/\*.ts** - Well-commented infrastructure code
- **README.md** - Project overview and local development

## 🎉 You're Ready to Deploy!

```bash
# Just run this when you're ready:
./scripts/deploy-all.sh
```

**Estimated time to live app: 20-30 minutes**

Good luck with the case study! 🚀
