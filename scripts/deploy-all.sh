#!/bin/bash

# Crypto Dashboard - Deploy All Stacks
# This script deploys all AWS infrastructure using CDK

set -e  # Exit on error

echo "🚀 Crypto Dashboard - AWS CDK Deployment"
echo "=========================================="
echo ""

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Error: AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi

echo "✅ AWS credentials found"
echo ""

# Get AWS account info
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")

echo "📋 Deployment Details:"
echo "   Account: $AWS_ACCOUNT"
echo "   Region: $AWS_REGION"
echo "   Environment: dev"
echo ""

# Check if CDK is bootstrapped
echo "🔍 Checking CDK bootstrap status..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region $AWS_REGION &> /dev/null; then
    echo "⚠️  CDK not bootstrapped in this region"
    echo "🔧 Bootstrapping CDK..."
    cdk bootstrap aws://$AWS_ACCOUNT/$AWS_REGION
    echo "✅ CDK bootstrapped successfully"
else
    echo "✅ CDK already bootstrapped"
fi
echo ""

# Install Lambda dependencies
echo "📦 Installing Lambda function dependencies..."
cd lambda/fetch-data
npm install --production
cd ../..
echo "✅ Lambda dependencies installed"
echo ""

# Synthesize CloudFormation templates
echo "🔨 Synthesizing CloudFormation templates..."
cdk synth
echo "✅ Templates synthesized"
echo ""

# Deploy all stacks
echo "🚀 Deploying all stacks..."
echo "   This will take 10-15 minutes..."
echo ""

cdk deploy --all --require-approval never

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Update GitHub token in Secrets Manager:"
echo "      aws secretsmanager create-secret --name crypto-dashboard/github-token --secret-string \"YOUR_GITHUB_PAT\""
echo ""
echo "   2. Update CoinGecko API key:"
echo "      aws secretsmanager update-secret --secret-id crypto-dashboard/coingecko-api-key --secret-string \"YOUR_API_KEY\""
echo ""
echo "   3. Check Amplify build status in AWS Console"
echo ""
echo "   4. Your app will be available at the URL shown in the Amplify outputs above"
echo ""
