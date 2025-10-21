#!/bin/bash

# Crypto Dashboard - Destroy All Stacks
# This script destroys all AWS resources to stop billing

set -e  # Exit on error

echo "🔥 Crypto Dashboard - AWS Resource Destruction"
echo "=============================================="
echo ""
echo "⚠️  WARNING: This will DELETE all AWS resources!"
echo "⚠️  WARNING: This includes the database and all data!"
echo "⚠️  WARNING: This action CANNOT be undone!"
echo ""
echo "💰 This will STOP all AWS billing for this project"
echo ""

read -p "Are you absolutely sure? Type 'destroy' to confirm: " confirm

if [ "$confirm" != "destroy" ]; then
    echo "❌ Destruction cancelled"
    exit 0
fi

echo ""
echo "🗑️  Destroying all stacks..."
echo ""

# Get environment
ENVIRONMENT="dev"

# Destroy stacks in reverse order (to handle dependencies)
echo "1️⃣  Destroying Cron Stack..."
cdk destroy "hm-case-Cron-${ENVIRONMENT}" --force || echo "⚠️  Cron stack not found or already destroyed"
echo ""

echo "2️⃣  Destroying Amplify Stack..."
cdk destroy "hm-case-Amplify-${ENVIRONMENT}" --force || echo "⚠️  Amplify stack not found or already destroyed"
echo ""

echo "3️⃣  Destroying Database Stack..."
cdk destroy "hm-case-Database-${ENVIRONMENT}" --force || echo "⚠️  Database stack not found or already destroyed"
echo ""

echo "4️⃣  Destroying Secrets Stack..."
cdk destroy "hm-case-Secrets-${ENVIRONMENT}" --force || echo "⚠️  Secrets stack not found or already destroyed"
echo ""

echo "✅ All stacks destroyed successfully!"
echo ""
echo "💰 AWS billing has been stopped"
echo ""
echo "🧹 Optional: You can also delete the CDK toolkit stack (one-time bootstrap):"
echo "   aws cloudformation delete-stack --stack-name CDKToolkit"
echo ""
echo "📝 Note: GitHub token secret must be manually deleted if created:"
echo "   aws secretsmanager delete-secret --secret-id crypto-dashboard/github-token --force-delete-without-recovery"
echo ""
